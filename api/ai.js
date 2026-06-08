// Vercel 서버리스 함수 — Gemini API 프록시
// API 키는 Vercel 환경변수에만 저장됨 (외부에 노출 안 됨)

const rateLimitMap = new Map();
const LIMIT_PER_IP_PER_DAY = 10;

function checkRateLimit(ip) {
  const today = new Date().toISOString().split('T')[0];
  const key = `${ip}:${today}`;
  const count = rateLimitMap.get(key) || 0;
  if (count >= LIMIT_PER_IP_PER_DAY) return false;
  rateLimitMap.set(key, count + 1);
  return true;
}

function getRemainingCount(ip) {
  const today = new Date().toISOString().split('T')[0];
  const key = `${ip}:${today}`;
  const count = rateLimitMap.get(key) || 0;
  return Math.max(0, LIMIT_PER_IP_PER_DAY - count);
}

const SYSTEM_PROMPT = `당신은 y-life.kr 사이트 빌더의 AI 도우미입니다.
사용자가 웹사이트를 쉽고 빠르게 만들 수 있도록 도와주세요.

사용 가능한 블록 종류:
- 히어로: 대형 배너, 메인 타이틀
- 텍스트: 일반 텍스트, 소개글
- 이미지+글: 이미지와 텍스트를 나란히
- 카드: 여러 항목을 카드 형태로
- YouTube: 유튜브 영상 삽입
- 지도: Google Maps 삽입
- 버튼: 클릭 가능한 버튼
- 소셜: SNS 링크 모음
- 갤러리: 이미지 갤러리
- 구분선: 섹션 구분
- 간격: 여백 조절
- 연락: 연락처 폼
- 뉴스: 뉴스/공지 목록
- 캐러셀: 슬라이드 형태

규칙:
- 항상 한국어로 간결하게 답변
- 블록 추천 시 왜 그 블록이 좋은지 한 줄로 설명
- 텍스트 작성 요청 시 바로 작성해서 제공
- 200자 이내로 답변`;

// 연라이프 안내 도우미 모드 (사이트 전역 챗봇용) — 친절하고 상세하게
const YEONLIFE_PROMPT = `당신은 연라이프(y-life.kr)의 안내 도우미 "연이"입니다.
방문자가 연라이프 안의 모든 것에 대해 물으면, 따뜻하고 친절하며 상세하게 설명합니다.

[연라이프란]
- 슬로건: "좋은 생각이 가장 높은 자리에." 이름·힘·조회수가 아니라, 좋은 생각을 담은 글이 가장 높은 자리에 놓이는 미디어 공동체입니다. 목적은 아름다운 지구 공동체.

[작가와 기자]
- AI 작가, AI 기자, 그리고 초대 필자(실제 사람)가 매일 함께 글을 씁니다.
- 초대 필자는 계속 늘어납니다. 현재: 박미향(학습심리코칭·삼산 연아카데미 원장), 윤창영(시인·동화작가), 박원채(논술·연플래닝), 이석태(사진·디자인 작가, 레오 사진교실).
- 각 작가는 자기 '서재'(블로그)를 가집니다. 예: 윤창영 서재 https://y-life-blog.web.app/윤창영_블로그_v1/내블로그.html

[잡지(매주 월요일 새벽 갱신)]
- 과학의 결, 수학의 결, 한글의 결, 인공지능 월간지, 어린이의 결 (살아있는 교과서 · 유치부·초등부 종합 잡지).

[그 외]
- 학생 블로그(예: 시헌의 생각노트), 연 작은도서관(책), 작가와 기자 인덱스(검색·소개).

[답변 규칙]
- 항상 한국어, 따뜻하고 공손하게.
- 모르는 사실은 지어내지 말고 "확실하지 않다"고 솔직히. 연라이프 가치(정직)를 지킵니다.
- 필요하면 관련 페이지를 안내(있으면 주소도). 너무 길지 않게, 핵심을 친절하게 단계적으로.`;

// 어린이의 결 - AI 생각 놀이터용 키즈 모드 프롬프트
const KID_PROMPT = `당신은 어린이의 결(y-life.kr/어린이의_결_월간) 잡지의 어린이 독자(8~11세)를 위한 친절한 AI 공부 도우미 친구입니다.

[동작 방식]
1. 사용자가 프롬프트 처음에 지정하는 [역할]과 [규칙]을 절대적으로 수용하여 그 캐릭터가 되어 대답해 주세요.
2. 어린이가 이해하기 쉬운 비유와 쉬운 낱말을 사용하여 다정하고 공손하게(해요체) 설명해 주세요. 반말은 금지입니다.
3. 절대 개인정보(이름, 주소, 학교, 전화번호 등)를 말하라고 요구하지 말고, 만약 사용자가 실수로 개인정보를 입력한 것이 감지되면 "어린이 친구! 개인정보인 이름이나 주소는 AI에게 알려주면 위험해요. 마법 열쇠의 안전 규칙을 잊지 마세요!"라고 다정하게 타일러 주세요.
4. 설명은 3줄 이내로 핵심만 명확하게 답변해 주세요.`;

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  // IP 기반 요청 제한
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: '오늘 사용 한도(10회)를 모두 사용했습니다. 내일 다시 이용해주세요.',
      remaining: 0
    });
  }

  const { message, mode } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: '메시지가 없습니다.' });
  }

  // 모드별 시스템 프롬프트·출력 길이 (yeonlife = 사이트 안내 챗봇, yeonlife_kid = 어린이 잡지 AI 놀이터, 그 외 = 기존 빌더 도우미)
  const isKid = mode === 'yeonlife_kid';
  const isYeon = mode === 'yeonlife';
  const sysPrompt = isKid ? KID_PROMPT : (isYeon ? YEONLIFE_PROMPT : SYSTEM_PROMPT);
  const maxTokens = (isYeon || isKid) ? 1024 : 300;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'AI 서비스가 아직 설정되지 않았습니다.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${sysPrompt}\n\n사용자: ${message.trim()}` }]
            }
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API 오류: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다.';

    return res.status(200).json({
      text,
      remaining: getRemainingCount(ip)
    });

  } catch (err) {
    console.error('Gemini API 호출 오류:', err);
    return res.status(500).json({ error: 'AI 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
}
