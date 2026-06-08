/*
 * /api/feedback — 독자 신고·의견 처리
 * YLV-4 §15-4 투명성 + §19 검수
 * ───────────────────────────────────────────────────────────
 * 입력: { article_slug, post_id, reason, evidence_url?, contact? }
 * 처리: Firestore feedbacks 적재 → 24h 안에 재검토 워크플로
 *
 * 🚧 TODO[YEON-HOST]: 호스팅 시 실 구현
 *  - Firestore feedbacks 적재
 *  - Cloudflare Turnstile 으로 봇 차단 (§14 가이드북)
 *  - 마을지기·서버 관리자 알림
 */

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return json({ error: '잘못된 요청' }, 400);
  }

  // 필수 필드 검증
  if (!payload.article_slug || !payload.post_id || !payload.reason) {
    return json({ error: '필수 항목이 빠졌어요.' }, 400);
  }

  // 길이 제한
  if ((payload.reason || '').length > 1000) {
    return json({ error: '신고 사유가 너무 길어요. (최대 1000자)' }, 400);
  }

  // 🚧 Firestore 적재 (호스팅 시)
  const feedback = {
    article_slug: payload.article_slug,
    post_id: payload.post_id,
    reason: payload.reason.slice(0, 1000),
    evidence_url: payload.evidence_url || null,
    contact: payload.contact || null,
    created_at: new Date().toISOString(),
    ip_hash: await hashIp(request.headers.get('CF-Connecting-IP') || ''),
    status: 'pending',
  };

  // await env.DB.collection('feedbacks').add(feedback);

  return json({
    ok: true,
    message: '신고 접수됐어요. 24시간 안에 재검토 후 글 하단에 결과를 공개합니다. 🙏',
    feedback_id: 'demo-' + Date.now(),
  });
}

async function hashIp(ip) {
  if (!ip) return null;
  const enc = new TextEncoder().encode(ip + 'yeon-life-salt');
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
