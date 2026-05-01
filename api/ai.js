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

  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: '메시지가 없습니다.' });
  }

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
              parts: [{ text: `${SYSTEM_PROMPT}\n\n사용자: ${message.trim()}` }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 300,
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
