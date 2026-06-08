/*
 * /api/image/usage — 나노바나나 사용량 조회 엔드포인트
 * 가이드북 §10-45 비용 가시화 · §7-0 보안 원칙 준수
 * ───────────────────────────────────────────────────────────────
 * 호출자: 메인 클로드 — 비용 가시화(§10-45) 용도, 또는 관리자 대시보드
 *
 * 입력 (GET, 파라미터 없음):
 *  GET /api/image/usage
 *  선택 쿼리: ?auth_token=XXX  (CLAUDE_AGENT_TOKEN 과 일치 시만 허용)
 *
 * 출력 (JSON):
 *  {
 *    "today":      { "calls": 3, "won": 156, "date": "2026-05-20" },
 *    "this_month": { "calls": 42, "won": 2184 },
 *    "all_time":   { "calls": 287, "won": 14924 },
 *    "daily_limit":    30,
 *    "remaining_today": 27
 *  }
 *
 * 환경 변수 (wrangler secret):
 *  CLAUDE_AGENT_TOKEN — 인증용 시크릿 (선택 — 없으면 공개 조회)
 *  USAGE_KV           — KV namespace binding
 *  DAILY_LIMIT        — 일일 최대 호출 수 (기본 30)
 */

const DEFAULT_DAILY_LIMIT = 30;

// ─── 메인 핸들러 (GET /api/image/usage) ─────────────────────────
export async function onRequestGet(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return corsResponse('', 204);
  }

  // ─── 인증 (CLAUDE_AGENT_TOKEN 설정된 경우만 검사) ─────────────
  if (env.CLAUDE_AGENT_TOKEN) {
    const url       = new URL(request.url);
    const authToken = url.searchParams.get('auth_token')
                   || request.headers.get('X-Auth-Token')
                   || '';
    if (!authToken || authToken !== env.CLAUDE_AGENT_TOKEN) {
      return json({
        success: false,
        error:   '인증 토큰이 올바르지 않습니다.',
        code:    'UNAUTHORIZED',
      }, 401);
    }
  }

  // ─── USAGE_KV 확인 ─────────────────────────────────────────────
  if (!env.USAGE_KV) {
    return json({
      success: false,
      error:   '사용량 데이터를 아직 이용할 수 없습니다.',
      code:    'NO_KV',
    }, 503);
  }

  const dailyLimit = parseInt(env.DAILY_LIMIT || DEFAULT_DAILY_LIMIT, 10);
  const today      = todayKST();
  const month      = today.slice(0, 7); // YYYY-MM

  // ─── KV 조회 (병렬) ────────────────────────────────────────────
  const [storedToday, storedMonth, storedAllTime] = await Promise.all([
    env.USAGE_KV.get(`daily:${today}`,    'json'),
    env.USAGE_KV.get(`monthly:${month}`,  'json'),
    env.USAGE_KV.get('alltime',           'json'),
  ]);

  const todayData    = storedToday    || { calls: 0, won: 0 };
  const monthData    = storedMonth    || { calls: 0, won: 0 };
  const allTimeData  = storedAllTime  || { calls: 0, won: 0 };

  return json({
    success:    true,
    today: {
      calls: todayData.calls,
      won:   todayData.won,
      date:  today,
    },
    this_month: {
      calls: monthData.calls,
      won:   monthData.won,
      month,
    },
    all_time: {
      calls: allTimeData.calls,
      won:   allTimeData.won,
    },
    daily_limit:      dailyLimit,
    remaining_today:  Math.max(0, dailyLimit - todayData.calls),
  }, 200);
}

// OPTIONS preflight
export async function onRequestOptions() {
  return corsResponse('', 204);
}

// ─── KST 오늘 날짜 (YYYY-MM-DD) ──────────────────────────────────
function todayKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}

// ─── 공통 유틸 ───────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':                'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function corsResponse(body, status = 204) {
  return new Response(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    },
  });
}
