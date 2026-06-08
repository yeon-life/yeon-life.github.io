const fs = require('fs');
const path = require('path');

// 1. .env 파일 파싱
const envPath = 'C:\\Claude\\.env';
let apiKey = '';
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GROK_API_KEY\s*=\s*(.+)/);
  if (match) {
    apiKey = match[1].trim();
  }
} catch (e) {
  console.error('.env 파일을 읽는 도중 오류 발생:', e.message);
}

if (!apiKey) {
  console.error('GROK_API_KEY를 찾을 수 없습니다. 스크립트를 종료합니다.');
  process.exit(1);
}

// 2. data/articles_today.js 로드 및 파싱
const articlesJsPath = path.join(__dirname, '..', 'data', 'articles_today.js');
let articles = {};
try {
  const fileContent = fs.readFileSync(articlesJsPath, 'utf8');
  // window 객체를 Mock하여 eval 실행
  const sandbox = {};
  const runCode = `
    const window = {};
    ${fileContent}
    window.YL_ARTICLES_TODAY;
  `;
  // 간단한 eval을 통해 YL_ARTICLES_TODAY를 읽어옴
  articles = eval(runCode);
} catch (e) {
  console.error('articles_today.js 파싱 오류:', e.message);
  process.exit(1);
}

// 3. YLV-6 규정상 검토가 필요한 5대 기사 Key 지정
const targets = [
  'baek-sahyeon|bs-01',
  'lim-siyeon|ls-01',
  'shin-yugyeong|sy-01',
  'gwon-nayeong|gn-01',
  'jang-ido|ji-01'
];

async function callGrok(title, body, category) {
  const systemPrompt = `너는 연라이프(y-life.kr)의 "날카로운 비평"을 전담하는 4단계 하청 비평가 에이전트(Grok)이다.
울산 연아카데미의 창립 철학인 [자기주도학습, 참사람 되기, 따뜻한 공동체]의 가치관과 연라이프 배포 규칙 YLV-6에 입각하여 기사를 날카롭게 비평하라.

[비평 시 주의 깊게 검토할 3가지 관점]
1. 문체 및 톤앤매너 (인문·문학적 관점): 지나친 교조주의적 발언, 냉소, 혹은 감성적 선동이 없는가?
2. 출처 및 팩트체크 (사실·논리적 관점): 의학/금융/정치 관련 핵심 주장에 대해 공신력 있는 근거나 보충 설명이 누락되지 않았는가?
3. 사회가치 및 리스크 (중립·균형적 관점): 흑백 대립 구도를 자극하거나, 특정 대상을 낙인찍는 편향된 프레임이 있는가? 

비평 결과는 다음 세 영역으로 나누어 매우 객관적이고 날카롭게 소견을 제시하라.
- 인문·문학 비평가 소견
- 사실·논리 비평가 소견
- 중립·균형 비평가 소견

그리고 각 비평 항목의 종합 판정 등급을 [passed / warning / danger] 중 하나로 정하라.
반드시 마크다운 형식을 사용하여 명확히 단락을 구분하라.`;

  const userPrompt = `
[기사 카테고리]: ${category}
[기사 제목]: ${title}
[기사 본문]:
${body.replace(/<[^>]*>/g, '')} // HTML 태그 제거
`;

  // API 호출 모델 후보군 순차 시도
  const models = ['grok-4.3', 'grok-4.20-0309-non-reasoning'];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Grok API 호출 시도 중 (${model})...`);
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
      }

      const data = await response.json();
      return {
        model,
        result: data.choices[0].message.content
      };
    } catch (e) {
      console.warn(`${model} 호출 실패:`, e.message);
      lastError = e;
    }
  }

  throw lastError || new Error('Grok API 호출 실패');
}

async function run() {
  const results = {};
  let markdownReport = `# Grok 실시간 AI 비평 리포트\n\n- **검토일**: ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}\n- **대상**: YLV-6 배포 규칙에 따른 5대 민감/품질관리 대상 기사\n\n---\n\n`;

  for (const key of targets) {
    const article = articles[key];
    if (!article) {
      console.warn(`기사를 찾을 수 없음: ${key}`);
      continue;
    }

    // 제목은 본문이나 persona 등에서 긁어와야 함. 여기서는 key로 매핑된 기사 메타데이터를 유추.
    // data/personas.js 에서 제목을 긁어오는 것도 가능하나, 간략히 metadata나 subtitle을 제목 대신 활용
    const title = article.subtitle || '제목 없음';
    console.log(`[시작] ${key} (${title}) 검토 요청 중...`);

    try {
      const { model, result } = await callGrok(title, article.body, article.category);
      results[key] = {
        title,
        model,
        raw: result,
        timestamp: new Date().toISOString()
      };

      markdownReport += `## 📝 기사: ${title} (\`${key}\`)\n\n`;
      markdownReport += `**[AI 비평 내용 (모델: ${model})]**\n\n${result}\n\n`;
      markdownReport += `---\n\n`;
      
      console.log(`[완료] ${key} 비평 수신 완료`);
      // API Rate limit 대비 대기 시간 부여
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (e) {
      console.error(`[에러] ${key} 검토 실패:`, e.message);
      results[key] = {
        title,
        error: e.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 1. 마크다운 리포트 저장
  const mdReportPath = path.join(__dirname, '..', 'grok_critic_today.md');
  fs.writeFileSync(mdReportPath, markdownReport, 'utf8');
  console.log(`마크다운 보고서 저장 완료: ${mdReportPath}`);

  // 2. 대시보드 연동용 JS 파일 저장 (data/grok_reviews_today.js)
  const jsDataPath = path.join(__dirname, '..', 'data', 'grok_reviews_today.js');
  const jsContent = `/*
 * Grok 실시간 AI 비평 결과 데이터
 * 생성일: ${new Date().toISOString()}
 */
window.YL_GROK_REVIEWS = ${JSON.stringify(results, null, 2)};
`;
  fs.writeFileSync(jsDataPath, jsContent, 'utf8');
  console.log(`대시보드 데이터 저장 완료: ${jsDataPath}`);
}

run();
