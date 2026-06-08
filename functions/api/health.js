/*
 * /api/health — Cloudflare Workers 헬스체크
 * YLV-4 §6 자동 백엔드 탐색용
 * ───────────────────────────────────────────────────────────
 * 클라이언트(yeon-pwa.js, 또는 §6-2 IIFE)가 이 엔드포인트를 핑하여
 * 백엔드가 살아있는지 확인. 200 OK + 작은 JSON 응답.
 */

export async function onRequest(context) {
  const { request, env } = context;

  return new Response(JSON.stringify({
    ok: true,
    service: 'y-life.kr api',
    ylv: 'YLV-4',
    yuv: 'YUV4',
    time: new Date().toISOString(),
    region: env?.CF_REGION || 'auto',
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Cloudflare Pages Functions 호환
export const onRequestGet = onRequest;
