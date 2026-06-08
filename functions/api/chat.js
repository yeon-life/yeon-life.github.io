/*
 * /api/chat — 연라이프 챗봇 백엔드
 * 가이드북 §7-0 보안 원칙 · §10-27 연라이프 분리 원칙 준수
 * ───────────────────────────────────────────────────────────
 * 입력:  POST { messages: [{role, content}], tier: 'free'|'subscriber' }
 * 출력:  { reply: '...', truncated: false }
 *
 * 4단계 이용 옵션 (§10-44):
 *  free       → Gemma 4 26B (Gemini API), max 500자, IP당 분당 5회
 *  subscriber → Gemini 2.5 Pro, 무제한, 우선 처리
 *
 * 환경 변수 (wrangler secret):
 *  GEMINI_API_KEY   — Google Gemini API 키 (본점만 보관)
 *  CACHE_KV         — KV namespace binding (1시간 캐시)
 *  RATE_LIMIT_KV    — KV namespace binding (rate limit 추적)
 *
 * ⚠️ API 단어는 사용자 응답에 절대 노출 금지 (§7-0)
 */

// ─── 상수 ────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://y-life.kr',
  'https://www.y-life.kr',
  'https://yeon-life.github.io',
];

const MODEL_FREE       = 'gemma-3-27b-it';   // Gemma 4 26B — Gemini API 경유
const MODEL_SUBSCRIBER = 'gemini-2.5-pro';   // 구독 동행 최상위 모델
const GEMINI_API_BASE  = 'https://generativelanguage.googleapis.com/v1beta/models';

const FREE_MAX_CHARS   = 500;   // 시민 무료 응답 자 수 제한
const RATE_LIMIT_MAX   = 5;     // IP당 분당 최대 요청
const RATE_WINDOW_SEC  = 60;
const CACHE_TTL_SEC    = 3600;  // 1시간 캐시
const CACHE_MSG_COUNT  = 3;     // 캐시 키에 포함할 마지막 메시지 수

// ─── 메인 핸들러 ─────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return corsResponse('', 204, request);
  }

  if (request.method !== 'POST') {
    return json({ error: '잘못된 요청 방식입니다.' }, 405, request);
  }

  // Origin 검사
  const origin = request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return json({ error: '접근이 허용되지 않은 경로입니다.' }, 403, request);
  }

  // 환경 변수 확인
  if (!env.GEMINI_API_KEY) {
    return json({ error: '서비스를 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.' }, 503, request);
  }

  // 요청 파싱
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '요청 형식이 올바르지 않습니다.' }, 400, request);
  }

  const { messages, tier = 'free' } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: '메시지가 없습니다.' }, 400, request);
  }

  const isFree = tier !== 'subscriber';

  // ─── Rate Limit (무료 티어만) ────────────────────────────────
  if (isFree && env.RATE_LIMIT_KV) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const limited = await checkRateLimit(env.RATE_LIMIT_KV, ip);
    if (limited) {
      return json({
        error: '잠깐 쉬었다가 다시 시도해 주세요. (1분에 최대 5번까지 이용 가능해요)',
      }, 429, request);
    }
  }

  // ─── 캐시 조회 ───────────────────────────────────────────────
  const cacheKey = await buildCacheKey(messages, tier);
  if (env.CACHE_KV) {
    const cached = await env.CACHE_KV.get(cacheKey, 'json');
    if (cached) {
      return json(cached, 200, request);
    }
  }

  // ─── Gemini API 호출 ─────────────────────────────────────────
  const model    = isFree ? MODEL_FREE : MODEL_SUBSCRIBER;
  const maxTokens = isFree ? 256 : 2048;  // 500자 ≒ 256 토큰, 여유 포함

  let rawReply;
  try {
    rawReply = await callGemini(env.GEMINI_API_KEY, model, messages, maxTokens);
  } catch (err) {
    // 구독자 모델 실패 시 무료 모델로 자동 폴백
    if (!isFree) {
      try {
        rawReply = await callGemini(env.GEMINI_API_KEY, MODEL_FREE, messages, 2048);
      } catch {
        return json({ error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, 502, request);
      }
    } else {
      return json({ error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, 502, request);
    }
  }

  // ─── 응답 처리 ───────────────────────────────────────────────
  const { reply, truncated } = truncateReply(rawReply, isFree ? FREE_MAX_CHARS : Infinity);
  const result = { reply, truncated };

  // 캐시 저장
  if (env.CACHE_KV) {
    await env.CACHE_KV.put(cacheKey, JSON.stringify(result), {
      expirationTtl: CACHE_TTL_SEC,
    });
  }

  return json(result, 200, request);
}

// ─── Gemini API 호출 ─────────────────────────────────────────
async function callGemini(apiKey, model, messages, maxTokens) {
  // Gemini 메시지 포맷 변환 (roles: user/model)
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const endpoint = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
        topP: 0.9,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('빈 응답');
  return text;
}

// ─── 응답 길이 제한 (문장 단위 자름) ────────────────────────────
function truncateReply(text, maxChars) {
  if (text.length <= maxChars) {
    return { reply: text, truncated: false };
  }

  // 문장 구분자 우선 탐색 (한국어 포함)
  const delimiters = ['. ', '.\n', '! ', '!\n', '? ', '?\n', '。', '！', '？'];
  let cutAt = -1;
  for (let i = maxChars; i >= maxChars * 0.6; i--) {
    if (delimiters.some(d => text.startsWith(d, i - 1))) {
      cutAt = i;
      break;
    }
  }
  if (cutAt < 1) cutAt = maxChars;

  return {
    reply: text.slice(0, cutAt).trimEnd() + '\n\n(더 길고 자세한 답변을 원하시면 동행 구독을 이용해 보세요.)',
    truncated: true,
  };
}

// ─── 캐시 키 생성 (SHA-256) ──────────────────────────────────
async function buildCacheKey(messages, tier) {
  const recent = messages.slice(-CACHE_MSG_COUNT);
  const payload = JSON.stringify({ messages: recent, tier });
  const enc  = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  const hex  = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return `chat:${hex}`;
}

// ─── IP 기반 Rate Limit ──────────────────────────────────────
async function checkRateLimit(kv, ip) {
  const enc     = new TextEncoder().encode(ip + 'yeon-salt');
  const hash    = await crypto.subtle.digest('SHA-256', enc);
  const ipHash  = Array.from(new Uint8Array(hash)).slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const key     = `rl:${ipHash}`;

  const current = parseInt(await kv.get(key) || '0', 10);
  if (current >= RATE_LIMIT_MAX) return true;

  await kv.put(key, String(current + 1), { expirationTtl: RATE_WINDOW_SEC });
  return false;
}

// ─── 헬퍼 ────────────────────────────────────────────────────
function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status, request) {
  const origin = request?.headers?.get('Origin') || '';
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
  });
}

function corsResponse(body, status, request) {
  const origin = request?.headers?.get('Origin') || '';
  return new Response(body, {
    status,
    headers: { ...corsHeaders(origin) },
  });
}
