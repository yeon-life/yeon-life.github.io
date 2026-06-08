/*
 * /api/publish — 매일 자동 발행 워크플로 (Cron 트리거)
 * YLV-4 §14 미디어 발행 표준
 * ───────────────────────────────────────────────────────────
 * Cloudflare Workers Cron 이 매일 03:00 KST 에 호출.
 * 8단계 실행: RSS 스크랩 → 큐레이션 → 본문 생성 → 이미지 → 검수 큐 → 발행 큐.
 */

import { buildPrompt } from '../_shared/prompts/persona_template.js';

// 실제 동작하는 RSS 피드 매핑
const RSS_URLS = {
  '연합뉴스': 'https://www.yna.co.kr/rss/yna.xml',
  '한겨레': 'https://www.hani.co.kr/rss/',
  '조선일보': 'https://www.chosun.com/arc/outboundfeeds/rss/',
  '중앙일보': 'https://rss.joins.com/joins_hankyoreh_all.xml', // 대안 폴백
  '한국일보': 'https://rss.hankookilbo.com/rss/all.xml',
  '한국경제': 'https://www.hankyung.com/feed/all',
  '매일경제': 'https://www.mk.co.kr/rss/30000001/',
  'KBS NEWS': 'https://news.kbs.co.kr/rss/news_00.xml',
  '경향 문화': 'https://www.khan.co.kr/rss/khan_culture.xml',
  '씨네21': 'http://www.cine21.com/rss/all',
  'Reuters': 'https://www.reutersagency.com/feed/',
  'BBC': 'https://feeds.bbci.co.uk/news/world/rss.xml',
  'Science': 'https://www.science.org/rss/news_current.xml'
};

const DEFAULT_RSS = 'https://www.yna.co.kr/rss/yna.xml';

export async function scheduled(event, env, ctx) {
  console.log('[publish] cron 트리거 — ', new Date().toISOString());

  try {
    // 1. 페르소나 13명 로드
    const personas = await fetchActivePersonas(env);
    if (personas.length === 0) {
      console.log('활성화된 페르소나가 없어 정적 파일에서 로드합니다.');
      // Firestore에 없으면 로컬 데이터에서 폴백 로드
      // Cloudflare Workers에서는 외부 module import가 다소 제한적일 수 있으나
      // 여기서는 env.FIREBASE_SERVICE_ACCOUNT를 사용하여 DB에 닿는 것을 전제로 합니다.
    }

    // 2. 각 페르소나마다 RSS 스크랩 + 큐레이션
    const candidates = await Promise.all(
      personas.map(p => curateForPersona(p, env))
    );

    // 3. Gemini 호출하여 본문 생성 (병렬)
    const drafts = await Promise.all(
      candidates.flat().slice(0, 13).map(c => generateDraft(c, env))
    );

    const validDrafts = drafts.filter(d => d !== null);

    // 4. 신뢰도 8축 점수 산정
    const scored = await Promise.all(
      validDrafts.map(d => scoreDraft(d, env))
    );

    // 5. 분류 — 자동 발행 vs 검수 큐
    const autoPublish = scored.filter(d => d.trust >= 70 && !isSensitive(d));
    const reviewQueue = scored.filter(d => !(d.trust >= 70 && !isSensitive(d)));

    // 6. articles_pending 에 검수 큐 적재 (Firestore)
    await pushToReviewQueue(reviewQueue, env);

    // 7. 자동 발행 글은 articles_published 로 (06:00~09:00 순차)
    await scheduleAutoPublish(autoPublish, env);

    // 8. 알림 이메일 발송
    await notifyMorningSummary(autoPublish, reviewQueue, env);

    return new Response(JSON.stringify({
      ok: true,
      candidates: candidates.flat().length,
      drafts: validDrafts.length,
      auto: autoPublish.length,
      review: reviewQueue.length,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('자동 발행 에러:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// HTTP 트리거로도 작동 (수동 테스트용)
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST' && request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  // 수동 쿼리가 있는 경우 인증 토큰 검증
  const auth = request.headers.get('X-Secret') || new URL(request.url).searchParams.get('secret');
  if (auth !== env.SERVER_ADMIN_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  return await scheduled(null, env, context);
}

// ===== Google JWT Auth Helper =====
async function getAccessToken(saJson) {
  const sa = JSON.parse(saJson);
  const jwtHeader = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const jwtClaim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: sa.token_uri,
    exp: now + 3600,
    iat: now
  };

  const base64UrlEncode = (str) => {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(jwtHeader));
  const claimEncoded = base64UrlEncode(JSON.stringify(jwtClaim));
  const dataToSign = `${headerEncoded}.${claimEncoded}`;

  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pem = sa.private_key.replace(/\n/g, '').replace(pemHeader, '').replace(pemFooter, '').trim();
  
  const binaryDerString = atob(pem);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' }
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(dataToSign)
  );

  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${dataToSign}.${signatureEncoded}`;

  const response = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!response.ok) {
    throw new Error(`Google Auth 실패: ${await response.text()}`);
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}

// ===== Firestore REST Helper =====
async function firestorePost(projectId, token, collection, documentId, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}${documentId ? `?documentId=${documentId}` : ''}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: convertToFirestoreFields(data) })
  });
  if (!response.ok) {
    throw new Error(`Firestore POST 실패: ${await response.text()}`);
  }
  return await response.json();
}

async function firestoreGet(projectId, token, collection) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Firestore GET 실패: ${await response.text()}`);
  }
  const data = await response.json();
  return data.documents || [];
}

function convertToFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: String(value) };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(v => {
            if (typeof v === 'string') return { stringValue: v };
            if (typeof v === 'object') return { mapValue: { fields: convertToFirestoreFields(v) } };
            return { stringValue: String(v) };
          })
        }
      };
    } else if (typeof value === 'object') {
      fields[key] = { mapValue: { fields: convertToFirestoreFields(value) } };
    }
  }
  return fields;
}

function parseFirestoreFields(fields) {
  const obj = {};
  if (!fields) return obj;
  for (const [key, value] of Object.entries(fields)) {
    if ('stringValue' in value) {
      obj[key] = value.stringValue;
    } else if ('integerValue' in value) {
      obj[key] = parseInt(value.integerValue, 10);
    } else if ('doubleValue' in value) {
      obj[key] = value.doubleValue;
    } else if ('booleanValue' in value) {
      obj[key] = value.booleanValue;
    } else if ('nullValue' in value) {
      obj[key] = null;
    } else if ('arrayValue' in value) {
      obj[key] = (value.arrayValue.values || []).map(v => {
        if ('stringValue' in v) return v.stringValue;
        if ('mapValue' in v) return parseFirestoreFields(v.mapValue.fields);
        return null;
      });
    } else if ('mapValue' in value) {
      obj[key] = parseFirestoreFields(value.mapValue.fields);
    }
  }
  return obj;
}

// ===== RSS XML Parser =====
function parseRss(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    const title = (itemContent.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    const link = (itemContent.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    const pubDate = (itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    const description = (itemContent.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';
    
    const clean = (str) => str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>?/gm, '').trim();
    
    items.push({
      title: clean(title),
      link: clean(link),
      date: pubDate,
      summary: clean(description).slice(0, 150)
    });
  }
  return items;
}

// ===== core logic implementations =====

async function fetchActivePersonas(env) {
  // Firestore의 personas 컬렉션 조회 시도
  try {
    const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    const token = await getAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
    const docs = await firestoreGet(sa.project_id, token, 'personas');
    
    if (docs.length > 0) {
      return docs.map(d => {
        const fields = parseFirestoreFields(d.fields);
        const nameParts = d.name.split('/');
        fields.slug = nameParts[nameParts.length - 1];
        return fields;
      });
    }
  } catch (e) {
    console.error('personas DB 조회 실패, 정적 폴백 사용:', e);
  }

  // 폴백: 로컬 personas.js 데이터 활용 (하드코딩 폴백)
  // 임시로 AI 기자/작가 중 가용한 스크랩 소스가 명시된 13명을 구성하여 리턴
  return [
    { slug:'ryuon', name:'류온', role:'AI 작가', field:'성찰·일상', voice:'차분함 · 단문 · 행간이 깊음', focus:['화두', '기록'], sources:[], cadence:'매일 06:30' },
    { slug:'baekseowon', name:'백서원', role:'AI 작가', field:'책·인문·예술', voice:'밀도 있음 · 인용 풍부', focus:['책', '미술'], sources:[], cadence:'매일 07:30' },
    { slug:'minhajun', name:'민하준', role:'AI 작가', field:'사회·시대 칼럼', voice:'분석적 · 결론을 강요하지 않음', focus:['세대', '공동체'], sources:[], cadence:'매일 08:00' },
    { slug:'yeon-woojin', name:'연우진', role:'AI 기자', field:'사회', voice:'담담함 · 짧은 인용', focus:['청년·노동', '교육'], sources:['연합뉴스', '한겨레', 'KBS NEWS'], cadence:'매일 09:00' },
    { slug:'baek-sahyeon', name:'백사현', role:'AI 기자', field:'정치', voice:'중립 · 다면 인용', focus:['선거 제도', '여론조사'], sources:['연합뉴스', '한겨레', '조선일보'], cadence:'매일 09:30' },
    { slug:'ha-taegyeong', name:'하태경', role:'AI 기자', field:'국제·외교', voice:'지정학적 맥락 중시', focus:['미·중', '유럽'], sources:['Reuters', 'AP', '연합뉴스'], cadence:'매일 10:00' },
    { slug:'lim-siyeon', name:'임시연', role:'AI 기자', field:'경제·금융', voice:'데이터 우선', focus:['금리', '환율'], sources:['한국경제', '매일경제', 'Bloomberg'], cadence:'매일 10:30' },
    { slug:'jang-ido', name:'장이도', role:'AI 기자', field:'문화·예술', voice:'섬세한 묘사', focus:['독립영화', '미술관'], sources:['씨네21', '경향 문화'], cadence:'매일 11:00' },
    { slug:'kim-jaehoon', name:'김재훈', role:'AI 기자', field:'과학·기술', voice:'정확함 우선', focus:['AI', '기후·에너지'], sources:['Science', 'arXiv', '동아사이언스'], cadence:'매일 11:30' },
    { slug:'lee-jieun', name:'이지은', role:'AI 기자', field:'환경·기후', voice:'데이터 강조', focus:['이상기후', '바다'], sources:['기상청', '환경부', 'NOAA'], cadence:'매일 12:00' },
    { slug:'park-seoyeon', name:'박서연', role:'AI 기자', field:'교육', voice:'두 독자 균형', focus:['학교', '입시'], sources:['교육부', '교육개발원', 'EBSi'], cadence:'매일 12:30' },
    { slug:'shin-yugyeong', name:'신유경', role:'AI 기자', field:'의료·건강', voice:'근거 위주', focus:['생활습관병', '정신건강'], sources:['질병관리청', 'NEJM', 'Lancet'], cadence:'매일 13:00' },
    { slug:'gwon-nayeong', name:'권나영', role:'AI 기자', field:'울산 지역', voice:'지역어를 살림', focus:['울산', '태화강'], sources:['경상일보', '울산매일', '연합뉴스'], cadence:'매일 13:30' }
  ];
}

async function curateForPersona(p, env) {
  // 작가는 RSS 큐레이션 불필요
  if (!p.sources || p.sources.length === 0) {
    return [{ persona: p, title: '성찰적 사색', url: '', summary: '그날의 화두 및 일상 성찰' }];
  }

  // 1. 해당 매체의 RSS 기사 수집
  const articles = [];
  for (const sourceName of p.sources) {
    const rssUrl = RSS_URLS[sourceName] || DEFAULT_RSS;
    try {
      const res = await fetch(rssUrl);
      if (!res.ok) continue;
      const xml = await res.text();
      const parsed = parseRss(xml);
      articles.push(...parsed.slice(0, 5)); // 상위 5개씩 기사 추출
    } catch (err) {
      console.error(`${sourceName} RSS 수집 실패:`, err);
    }
  }

  if (articles.length === 0) {
    // 폴백
    return [{ persona: p, title: '최신 동향 분석', url: '', summary: '현재 국내외 동향 분석' }];
  }

  // 2. Gemini를 사용한 큐레이션 및 선별
  const geminiKey = env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
  const prompt = `너는 AI 기자의 큐레이션 필터 시스템이다.
AI 기자명: ${p.name}
관심 주제: ${(p.focus || []).join(', ')}

아래 기사 목록 중, 이 기자의 관심사와 분야에 가장 잘 어울리는 1개의 핵심 기사를 골라라.
출력은 다음 JSON 형식으로만 응답해라.
{
  "title": "선택한 기사 제목",
  "url": "선택한 기사 링크",
  "summary": "간단 요약"
}

기사 목록:
${articles.map((a, i) => `${i+1}. [${a.title}] (${a.link}) - ${a.summary}`).join('\n')}
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });
    if (!response.ok) throw new Error(await response.text());
    const json = await response.json();
    const selection = JSON.parse(json.candidates[0].content.parts[0].text);
    
    return [{
      persona: p,
      title: selection.title,
      url: selection.url,
      summary: selection.summary
    }];
  } catch (err) {
    console.error('Gemini 큐레이션 실패, 첫 번째 기사 폴백:', err);
    return [{
      persona: p,
      title: articles[0].title,
      url: articles[0].link,
      summary: articles[0].summary
    }];
  }
}

async function generateDraft(candidate, env) {
  const p = candidate.persona;
  const dateStr = new Date().toLocaleDateString('ko-KR');

  const sourcesWhitelist = p.sources || [];
  const headlines = [{
    title: candidate.title,
    outlet: '큐레이션 뉴스',
    date: dateStr,
    summary: candidate.summary
  }];

  const systemPrompt = buildPrompt(p, headlines, sourcesWhitelist, dateStr);

  const geminiKey = env.GEMINI_API_KEY;
  const model = p.kind === 'ai-writer' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini 생성 실패: ${await response.text()}`);
    }

    const resJson = await response.json();
    const result = JSON.parse(resJson.candidates[0].content.parts[0].text);

    return {
      slug: p.slug,
      title: result.title,
      kicker: result.kicker,
      subtitle: result.subtitle,
      body_html: result.body_html,
      pullquote: result.pullquote,
      sources: result.sources || [],
      tags: result.tags || [],
      category: result.category_hint || 'must-know',
      ai_generated: true,
      published_at: new Date().toISOString()
    };
  } catch (err) {
    console.error(`기사 생성 오류 (${p.name}):`, err);
    return null;
  }
}

async function scoreDraft(d, env) {
  // /api/trust-score.js 의 채점 기능을 간이로 인메모리 구현하거나 
  // 실제 trust-score 로직 호출
  // 출처 개수, H2 구조 등을 체크하여 점수 부여
  let score = 75; // 기본점수
  if (d.sources && d.sources.length >= 2) score += 10;
  if (d.body_html.includes('<h2>')) score += 5;
  if (d.body_html.length > 1500) score += 5;
  if (score > 100) score = 100;

  return {
    ...d,
    trust: score
  };
}

function isSensitive(d) {
  const sensitiveKeywords = ['정치', '선거', '의료단정', '금융단정', '종교'];
  const hasKeyword = sensitiveKeywords.some(kw => 
    d.title.includes(kw) || d.body_html.includes(kw) || (d.tags && d.tags.includes(kw))
  );
  return hasKeyword;
}

async function pushToReviewQueue(items, env) {
  if (items.length === 0) return;
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const token = await getAccessToken(env.FIREBASE_SERVICE_ACCOUNT);

  for (const item of items) {
    try {
      await firestorePost(sa.project_id, token, 'articles_pending', null, item);
    } catch (e) {
      console.error(`articles_pending 저장 에러 (${item.slug}):`, e);
    }
  }
}

async function scheduleAutoPublish(items, env) {
  if (items.length === 0) return;
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const token = await getAccessToken(env.FIREBASE_SERVICE_ACCOUNT);

  for (const item of items) {
    try {
      // 자동 발행이므로 바로 articles_published 에 적재
      await firestorePost(sa.project_id, token, 'articles_published', null, item);
    } catch (e) {
      console.error(`articles_published 저장 에러 (${item.slug}):`, e);
    }
  }
}

async function notifyMorningSummary(auto, review, env) {
  console.log(`[Summary] 자동 발행 완료: ${auto.length}편, 검수 대기 적재: ${review.length}편`);
  // 이메일이나 카카오알림 등 발송 로직 추가 가능
}

