/*
 * /api/image — 나노바나나 이미지 생성 엔드포인트
 * 가이드북 §10-45 외주 하청 시스템 · §7-0 보안 원칙 준수
 * ───────────────────────────────────────────────────────────────
 * 호출자: 메인 클로드(Claude in Cowork) — 작업 결과물에 이미지 필요 시 자율 호출
 *
 * 입력 (POST JSON):
 *  {
 *    "prompt":     "한지 위에 책 표지...",
 *    "purpose":    "책자 표지·홈 배너·일러스트 등 (로그용)",
 *    "size":       "1024x1024" | "1024x1536" | "1536x1024",
 *    "auth_token": "메인 클로드 인증 토큰"
 *  }
 *
 * 출력 (JSON):
 *  {
 *    "success":        true,
 *    "image_base64":   "iVBOR...",
 *    "mime_type":      "image/png",
 *    "cost_won":       52,
 *    "today_total_won": 156,
 *    "today_calls":    3,
 *    "daily_limit":    30,
 *    "remaining_calls": 27
 *  }
 *
 * 환경 변수 (wrangler secret):
 *  GEMINI_IMAGE_API_KEY — Google Gemini API 키 (§7-0 서버에만 보관)
 *  CLAUDE_AGENT_TOKEN   — 메인 클로드 인증용 시크릿 (선택)
 *  USAGE_KV             — KV namespace binding (사용 기록 저장)
 *  DAILY_LIMIT          — 일일 최대 호출 수 (기본 30)
 *  RATE_LIMIT           — IP당 분당 최대 호출 수 (기본 5)
 *  COST_PER_IMAGE_WON   — 이미지 1장당 단가 원화 (기본 52)
 *
 * ⚠️ API 단어·키 절대 클라이언트 노출 금지 (§7-0)
 */

// ─── 상수 ────────────────────────────────────────────────────────
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
const GEMINI_API_BASE    = 'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_DAILY_LIMIT        = 30;
const DEFAULT_RATE_LIMIT         = 5;   // IP당 분당
const DEFAULT_COST_PER_IMAGE_WON = 52;
const RATE_WINDOW_SEC            = 60;

const VALID_SIZES = ['1024x1024', '1024x1536', '1536x1024'];

// ─── 메인 핸들러 (POST /api/image) ──────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS: 메인 클로드는 호스트 무관 → 모든 출처 허용
  if (request.method === 'OPTIONS') {
    return corsResponse('', 204);
  }

  // ─── 환경 변수 확인 ────────────────────────────────────────────
  if (!env.GEMINI_IMAGE_API_KEY) {
    return json({
      success: false,
      error: '이미지 생성 서비스를 일시적으로 이용할 수 없습니다.',
      code:  'NO_API_KEY',
    }, 503);
  }

  // ─── 요청 파싱 ─────────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: '요청 형식이 올바르지 않습니다.', code: 'BAD_JSON' }, 400);
  }

  const {
    prompt,
    purpose = '미지정',
    size    = '1024x1024',
    auth_token,
  } = body;

  // ─── 필수 입력 검증 ────────────────────────────────────────────
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return json({ success: false, error: '프롬프트가 없습니다.', code: 'NO_PROMPT' }, 400);
  }
  if (!VALID_SIZES.includes(size)) {
    return json({
      success: false,
      error: `크기는 ${VALID_SIZES.join(' | ')} 중 하나여야 합니다.`,
      code: 'BAD_SIZE',
    }, 400);
  }

  // ─── 인증 (CLAUDE_AGENT_TOKEN) ────────────────────────────────
  if (env.CLAUDE_AGENT_TOKEN) {
    if (!auth_token || auth_token !== env.CLAUDE_AGENT_TOKEN) {
      return json({ success: false, error: '인증 토큰이 올바르지 않습니다.', code: 'UNAUTHORIZED' }, 401);
    }
  }

  // ─── 상수 로드 ─────────────────────────────────────────────────
  const dailyLimit     = parseInt(env.DAILY_LIMIT        || DEFAULT_DAILY_LIMIT,        10);
  const rateLimit      = parseInt(env.RATE_LIMIT         || DEFAULT_RATE_LIMIT,         10);
  const costPerImage   = parseInt(env.COST_PER_IMAGE_WON || DEFAULT_COST_PER_IMAGE_WON, 10);

  // ─── IP 기반 분당 Rate Limit ───────────────────────────────────
  if (env.USAGE_KV) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const limited = await checkRateLimit(env.USAGE_KV, ip, rateLimit);
    if (limited) {
      return json({
        success: false,
        error: '요청이 너무 빠릅니다. 잠시 후 다시 시도해 주세요.',
        code:  'RATE_LIMITED',
      }, 429);
    }
  }

  // ─── 일일 한도 확인 ────────────────────────────────────────────
  const today     = todayKST();
  let usageToday  = { calls: 0, won: 0 };

  if (env.USAGE_KV) {
    const stored = await env.USAGE_KV.get(`daily:${today}`, 'json');
    if (stored) usageToday = stored;
  }

  if (usageToday.calls >= dailyLimit) {
    return json({
      success: false,
      error:  `오늘 이미지 생성 한도(${dailyLimit}회)를 모두 사용했습니다. 내일 다시 이용해 주세요.`,
      code:   'DAILY_LIMIT_EXCEEDED',
      today_calls:   usageToday.calls,
      daily_limit:   dailyLimit,
      remaining_calls: 0,
    }, 403);
  }

  // ─── 이미지 크기 파싱 ──────────────────────────────────────────
  const [width, height] = size.split('x').map(Number);

  // ─── Gemini 2.5 Flash Image 호출 ─────────────────────────────
  let imageBase64, mimeType;
  try {
    const result = await callGeminiImage(
      env.GEMINI_IMAGE_API_KEY,
      GEMINI_IMAGE_MODEL,
      prompt.trim(),
      width,
      height,
    );
    imageBase64 = result.base64;
    mimeType    = result.mimeType;
  } catch (err) {
    return json({
      success: false,
      error:  '이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      code:   'GEMINI_ERROR',
      detail: err.message,
    }, 502);
  }

  // ─── 사용 기록 저장 (KV) ──────────────────────────────────────
  const newCalls = usageToday.calls + 1;
  const newWon   = usageToday.won   + costPerImage;
  const newToday = { calls: newCalls, won: newWon };

  // 월 누적
  const month = today.slice(0, 7); // YYYY-MM
  let usageMonth = { calls: 0, won: 0 };
  // 전체 누적
  let usageAllTime = { calls: 0, won: 0 };

  if (env.USAGE_KV) {
    // 일일 저장 (자정 +10분까지 유지 — 다음날 KST 로 자연스럽게 갱신)
    await env.USAGE_KV.put(`daily:${today}`, JSON.stringify(newToday), {
      expirationTtl: 90000, // 25시간
    });

    // 월 누적
    const storedMonth = await env.USAGE_KV.get(`monthly:${month}`, 'json');
    if (storedMonth) usageMonth = storedMonth;
    usageMonth = { calls: usageMonth.calls + 1, won: usageMonth.won + costPerImage };
    await env.USAGE_KV.put(`monthly:${month}`, JSON.stringify(usageMonth), {
      expirationTtl: 32 * 24 * 3600, // 32일
    });

    // 전체 누적 (만료 없음)
    const storedAll = await env.USAGE_KV.get('alltime', 'json');
    if (storedAll) usageAllTime = storedAll;
    usageAllTime = { calls: usageAllTime.calls + 1, won: usageAllTime.won + costPerImage };
    await env.USAGE_KV.put('alltime', JSON.stringify(usageAllTime));

    // 최근 호출 로그
    const logKey  = `log:${today}:${Date.now()}`;
    const logEntry = {
      when:    new Date().toISOString(),
      purpose,
      prompt:  prompt.slice(0, 200), // 로그용 최대 200자
      size,
      cost_won: costPerImage,
    };
    await env.USAGE_KV.put(logKey, JSON.stringify(logEntry), {
      expirationTtl: 90 * 24 * 3600, // 90일 보관
    });
  }

  // ─── 응답 반환 ─────────────────────────────────────────────────
  return json({
    success:          true,
    image_base64:     imageBase64,
    mime_type:        mimeType,
    cost_won:         costPerImage,
    today_total_won:  newWon,
    today_calls:      newCalls,
    daily_limit:      dailyLimit,
    remaining_calls:  dailyLimit - newCalls,
  }, 200);
}

// OPTIONS preflight
export async function onRequestOptions() {
  return corsResponse('', 204);
}

// ─── Gemini 2.5 Flash Image 호출 ─────────────────────────────────
async function callGeminiImage(apiKey, model, prompt, width, height) {
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ],
      }
    ],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      // 크기는 aspectRatio로 제어 (Gemini 이미지 모델 방식)
      // 1024x1024 → 1:1 / 1024x1536 → 2:3 / 1536x1024 → 3:2
      ...(width !== height ? { aspectRatio: width > height ? '3:2' : '2:3' } : {}),
    },
  };

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();

  // 응답에서 inline_data.data (base64) 추출
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        base64:   part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      };
    }
  }

  throw new Error('Gemini 응답에서 이미지 데이터를 찾을 수 없습니다.');
}

// ─── IP 기반 Rate Limit (KV) ─────────────────────────────────────
async function checkRateLimit(kv, ip, maxPerMinute) {
  const key    = `rl:img:${ip}`;
  const now    = Math.floor(Date.now() / 1000);
  const stored = await kv.get(key, 'json');

  if (!stored || now - stored.windowStart > RATE_WINDOW_SEC) {
    await kv.put(key, JSON.stringify({ count: 1, windowStart: now }), {
      expirationTtl: RATE_WINDOW_SEC + 5,
    });
    return false; // 제한 없음
  }

  if (stored.count >= maxPerMinute) return true; // 제한

  await kv.put(key, JSON.stringify({ count: stored.count + 1, windowStart: stored.windowStart }), {
    expirationTtl: RATE_WINDOW_SEC + 5,
  });
  return false;
}

// ─── KST 오늘 날짜 (YYYY-MM-DD) ──────────────────────────────────
function todayKST() {
  const now = new Date();
  // UTC+9
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
