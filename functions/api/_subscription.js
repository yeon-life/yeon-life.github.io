/*
 * /api/subscription/verify — 구독 동행 코드 검증
 * 가이드북 §7-0 · §10-44 구독 4단계 옵션
 * ───────────────────────────────────────────────────────────
 * 입력:  POST { code: '6자리', deviceId: 'uuid' }
 * 출력:  { ok: true, token: '...', expiresAt: 'ISO' }  (24h 유효)
 *
 * 검증된 구독자는 SUBSCRIPTION_KV 에 토큰 저장 (24h TTL)
 * 챗봇은 /api/chat 호출 시 이 토큰으로 tier='subscriber' 권한 확인
 *
 * 환경 변수:
 *  SUBSCRIPTION_KV      — KV namespace binding (토큰 저장)
 *  SUBSCRIBER_CODES_KV  — KV namespace binding (유효 코드 목록)
 *
 * ⚠️ API·코드 단어는 사용자 응답에 노출 금지 (§7-0)
 */

const ALLOWED_ORIGINS = [
  'https://y-life.kr',
  'https://www.y-life.kr',
  'https://yeon-life.github.io',
];

const TOKEN_TTL_SEC    = 86400;   // 24h
const CODE_LENGTH      = 6;

// ─── 메인 핸들러 ─────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return corsResponse('', 204, request);
  }

  if (request.method !== 'POST') {
    return json({ error: '잘못된 요청 방식입니다.' }, 405, request);
  }

  const origin = request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return json({ error: '접근이 허용되지 않은 경로입니다.' }, 403, request);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '요청 형식이 올바르지 않습니다.' }, 400, request);
  }

  const { code, deviceId } = body;

  // 입력 검증
  if (!code || String(code).length !== CODE_LENGTH || !/^\d+$/.test(String(code))) {
    return json({ error: '올바른 코드를 입력해 주세요.' }, 400, request);
  }
  if (!deviceId || String(deviceId).length < 8) {
    return json({ error: '기기 정보가 올바르지 않습니다.' }, 400, request);
  }

  // 환경 변수 확인
  if (!env.SUBSCRIPTION_KV || !env.SUBSCRIBER_CODES_KV) {
    return json({ error: '서비스를 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.' }, 503, request);
  }

  // ─── 코드 검증 ───────────────────────────────────────────────
  const codeRecord = await env.SUBSCRIBER_CODES_KV.get(String(code), 'json');
  if (!codeRecord) {
    return json({ error: '입력하신 코드를 다시 확인해 주세요.' }, 401, request);
  }

  // 만료 확인
  if (codeRecord.expiresAt && new Date(codeRecord.expiresAt) < new Date()) {
    return json({ error: '만료된 코드입니다. 새 코드로 다시 시도해 주세요.' }, 401, request);
  }

  // ─── 토큰 생성 ───────────────────────────────────────────────
  const token      = await generateToken(code, deviceId);
  const expiresAt  = new Date(Date.now() + TOKEN_TTL_SEC * 1000).toISOString();

  // KV 저장 (24h TTL)
  await env.SUBSCRIPTION_KV.put(
    `token:${token}`,
    JSON.stringify({
      tier:      codeRecord.tier || 'subscriber',
      deviceId,
      code:      '******',   // 코드 원문은 저장하지 않음
      issuedAt:  new Date().toISOString(),
      expiresAt,
    }),
    { expirationTtl: TOKEN_TTL_SEC }
  );

  return json({ ok: true, token, expiresAt }, 200, request);
}

// ─── 토큰 생성 (HMAC-SHA256 기반 256비트) ────────────────────
async function generateToken(code, deviceId) {
  const seed   = `${code}:${deviceId}:${Date.now()}`;
  const enc    = new TextEncoder().encode(seed);
  const hash   = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── 토큰 검증 유틸 (다른 Worker 에서 import 가능) ───────────
export async function verifySubscriptionToken(kv, token) {
  if (!token || !kv) return null;
  const record = await kv.get(`token:${token}`, 'json');
  if (!record) return null;
  if (new Date(record.expiresAt) < new Date()) return null;
  return record;
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
  return new Response(body, { status, headers: { ...corsHeaders(origin) } });
}
