/*
 * /api/trust-score — 신뢰도 8축 산정
 * YLV-4 §15 신뢰도 평가 표준
 * ───────────────────────────────────────────────────────────
 * 입력: 글 1편의 메타데이터 (title, body, sources[], persona, category)
 * 출력: 신뢰도 점수 0~100 + 8축 세부 점수 + 매체 균형
 *
 * 8축 가중치:
 *   ① 출처 다양성 15%
 *   ② 1차 출처 인용 20%
 *   ③ 검증 가능성 15%
 *   ④ 시간 검증 10%
 *   ⑤ 이해 충돌 점검 10%
 *   ⑥ 팩트체커 교차 15%
 *   ⑦ 언론자유 가중 10%
 *   ⑧ 아카이브 일관성 5%
 *
 * 🚧 TODO[YEON-HOST]: 호스팅 시 실 구현
 *  - 매체 평가 DB (news_sources Firestore)
 *  - RSF 자유지수 데이터
 *  - 팩트체커 API (SNU·JTBC·Reuters·AP)
 *  - Wayback Machine API
 */

const WEIGHTS = {
  diversity: 0.15,
  primary: 0.20,
  verifiability: 0.15,
  time: 0.10,
  conflict: 0.10,
  factcheck: 0.15,
  freedom: 0.10,
  archive: 0.05,
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  let article;
  try {
    article = await request.json();
  } catch (e) {
    return json({ error: '잘못된 요청 형식' }, 400);
  }

  const axes = {
    diversity:     await scoreDiversity(article, env),
    primary:       await scorePrimary(article, env),
    verifiability: await scoreVerifiability(article, env),
    time:          await scoreTime(article, env),
    conflict:      await scoreConflict(article, env),
    factcheck:     await scoreFactcheck(article, env),
    freedom:       await scoreFreedom(article, env),
    archive:       await scoreArchive(article, env),
  };

  const score = Math.round(
    Object.entries(axes).reduce((sum, [k, v]) => sum + v * WEIGHTS[k], 0)
  );

  const media = computeMediaBalance(article.sources || []);

  return json({
    score,
    axes,
    media,
    weights: WEIGHTS,
    classification: classify(score, article),
  });
}

function classify(score, article) {
  // 정치·종교·실명·의료 단정 → 항상 검수 큐
  if (isSensitive(article)) return 'review_required';
  if (score >= 80) return 'auto_publish_featured';
  if (score >= 70) return 'auto_publish';
  if (score >= 50) return 'review_required';
  return 'discard';
}

function isSensitive(article) {
  const tags = (article.tags || []).map(t => t.toLowerCase());
  const sensitive = ['정치', '종교', '실명', '의료단정', '금융단정', '법률단정'];
  return tags.some(t => sensitive.includes(t));
}

// 🚧 stub 함수들 — 호스팅 시 실 구현
async function scoreDiversity(a, env)     { return 70; }
async function scorePrimary(a, env)       { return 75; }
async function scoreVerifiability(a, env) { return 70; }
async function scoreTime(a, env)          { return 80; }
async function scoreConflict(a, env)      { return 85; }
async function scoreFactcheck(a, env)     { return 60; }
async function scoreFreedom(a, env)       { return 85; }
async function scoreArchive(a, env)       { return 75; }

function computeMediaBalance(sources) {
  // 매체 분류 (좌·중·우·해외·전문)
  const counts = { left: 0, center: 0, right: 0, foreign: 0, specialty: 0 };
  // 🚧 TODO: news_sources DB 조회
  return {
    sources_count: sources.length,
    distribution: counts,
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
