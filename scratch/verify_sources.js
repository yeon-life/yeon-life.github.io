const fs = require('fs');
const path = require('path');

// 1. data/articles_today.js 로드
const articlesJsPath = path.join(__dirname, '..', 'data', 'articles_today.js');
let articles = {};
try {
  const fileContent = fs.readFileSync(articlesJsPath, 'utf8');
  const sandbox = {};
  const runCode = `
    const window = {};
    ${fileContent}
    window.YL_ARTICLES_TODAY;
  `;
  articles = eval(runCode);
} catch (e) {
  console.error('articles_today.js 로드 실패:', e.message);
  process.exit(1);
}

// 링크 검증 결과를 저장할 객체
const verificationResults = {};

async function verifyUrl(url) {
  if (!url || url === '#' || url.trim() === '') {
    return { status: 'invalid', message: '플레이스홀더(#) 또는 유효하지 않은 URL 형식입니다.' };
  }

  try {
    console.log(`URL 검증 중: ${url}`);
    // HEAD 요청으로 빠르고 가볍게 연결성 체크 (실패 시 GET으로 fallback)
    let response;
    try {
      response = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'YeonLife-LinkVerifier/1.0' },
        signal: AbortSignal.timeout(4000) // 4초 타임아웃
      });
    } catch (headErr) {
      // 일부 서버는 HEAD 요청을 거부할 수 있으므로 GET으로 재시도
      response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'YeonLife-LinkVerifier/1.0' },
        signal: AbortSignal.timeout(4000)
      });
    }

    if (response.ok) {
      return { status: 'ok', code: response.status, message: '정상 연결 확인' };
    } else {
      return { status: 'broken', code: response.status, message: `서버 응답 오류 (HTTP ${response.status})` };
    }
  } catch (err) {
    let msg = err.message;
    if (err.name === 'TimeoutError') {
      msg = '연결 시간 초과 (4초)';
    }
    return { status: 'error', message: `연결 실패: ${msg}` };
  }
}

async function run() {
  console.log('=== 출처 및 링크 검증 전문 에이전트 가동 ===');
  
  for (const articleKey in articles) {
    const article = articles[articleKey];
    const sources = article.sources || [];
    
    if (sources.length === 0) {
      continue;
    }

    verificationResults[articleKey] = [];
    console.log(`\n[기사 검사] ${article.subtitle || articleKey} (출처수: ${sources.length})`);

    for (const source of sources) {
      const url = source.url;
      const title = source.title;
      
      const checkResult = await verifyUrl(url);
      
      verificationResults[articleKey].push({
        title,
        url,
        status: checkResult.status,
        code: checkResult.code || null,
        message: checkResult.message
      });

      // API Abuse 방지 및 매너 대기
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // 검증 결과를 data/source_verifications.js 파일로 저장
  const outputPath = path.join(__dirname, '..', 'data', 'source_verifications.js');
  const outputContent = `/*
 * 출처 및 링크 검증 결과 데이터
 * 생성일: ${new Date().toISOString()}
 */
window.YL_SOURCE_VERIFICATIONS = ${JSON.stringify(verificationResults, null, 2)};
`;

  fs.writeFileSync(outputPath, outputContent, 'utf8');
  console.log(`\n검증 결과가 저장되었습니다: ${outputPath}`);
}

run();
