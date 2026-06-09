const fs = require('fs');
const path = require('path');

const fileContent = fs.readFileSync('어린이의_결_초등_월간/js/grade_data.js', 'utf8');
eval(fileContent); // Loads GRADE_DATA

const record_corner = {
  "key": "record",
  "title": "📝 기록 탐험 · 생각의 그물",
  "headline": "내 머릿속 생각을 붙잡는 마법의 그물, 기록! — 오늘부터 시작하는 나만의 생각 보물찾기",
  "dek": "흘러가기 쉬운 소중한 나의 아이디어와 오늘의 배움을 손글씨로 튼튼하게 남기는 힘을 배워요.",
  "body_md": "## 우리의 머릿속 생각을 담는 마법의 그물, 기록!\n\n우리의 머릿속은 매일 수많은 반짝이는 생각과 아이디어로 가득 차 있어요. 하지만 이 생각들은 마치 하늘을 스쳐 지나가는 '무지개'나 밤하늘의 '별똥별' 같아서, 제때 붙잡지 않으면 눈 깜짝할 사이에 잊히고 만답니다.\n어떻게 하면 이 소중한 생각들을 평생 나의 소중한 보물로 간직할 수 있을까요? 그 비밀은 바로 **'기록(Writing)'**이라는 마법의 그물에 있어요.\n\n### 1. 역사 속 위대한 인물들의 공통 비밀\n우리가 존경하는 이순신 장군님은 나라가 어려운 전쟁 속에서도 매일 날씨와 군사들의 일기, 그리고 자신의 생각을 꼼꼼히 적은 **'난중일기'**를 남기셨어요.\n또한 세상을 바꾼 천재 과학자 에디슨과 예술가 레오나르도 다 빈치는 평생 수천 권의 아이디어 노트를 쓰며 사소한 생각도 놓치지 않고 다 적었답니다. 그들이 원래부터 기억력이 엄청나게 좋은 컴퓨터 같아서 대단해진 것일까요? 아니에요! 그들은 기억보다 **'기록의 정직한 힘'**을 믿었기 때문에 훌륭한 역사와 발명을 남길 수 있었던 거예요.\n\n### 2. 기록하면 어떤 좋은 마법이 일어날까요?\n*   **첫째, 뇌에 여유 공간이 생겨요**: 머릿속에 할 일이나 생각을 억지로 가득 담아두면 뇌가 지쳐요. 하지만 종이에 생각을 **적어두는 순간**, 뇌는 안심하고 새로운 상상을 펼칠 수 있는 맑고 깨끗한 여유 공간을 가지게 돼요.\n*   **둘째, 생각의 자람이 한눈에 보여요**: 한 달 전에 내가 쓴 노트를 다시 읽어보면, \"와, 내가 그때 이런 생각을 했었구나! 그 사이에 내가 이만큼 더 깊고 튼튼하게 자라났네!\" 하며 나의 성장을 직접 느끼고 기뻐할 수 있어요.\n*   **셋째, 세상에 단 하나뿐인 나만의 보물이 돼요**: 내가 적은 단 한 줄의 생각, 내가 그린 작고 서툰 그림 하나가 모이면 훗날 그 어떤 값비싼 책보다 귀한 나만의 소중한 일대기(보물책)가 된답니다.\n\n### 3. 오늘 수업 시간에 함께 실천하는 '기록 탐험가'의 약속\n*   **약속 1: 내 곁에 언제나 '생각 수첩' 두기**\n    오늘부터 연삼산점 수업 시간에 나만의 작은 수첩이나 연습장을 준비해 보세요. 선생님 말씀이나 책을 읽다 번뜩 떠오른 재미있는 생각을 자유롭게 적어 보세요.\n*   **약속 2: 욕심내지 않고 딱 한 줄만 적기**\n    기록은 어렵고 길게 쓸 필요가 없어요. \"오늘 점심에 먹은 사과가 정말 달콤했다\", \"오늘 지렁이에 대해 새로 배웠다\"처럼 아주 짧고 정직한 한 문장으로 시작하는 것이 기록의 첫걸음이랍니다.",
  "future_note": "오늘 연삼산점 수업이 모두 끝난 후에, 오늘 가장 신기했던 단어 하나와 내 기분을 나의 생각 수첩에 딱 한 줄로 남기는 기록의 첫걸음을 떼어 보세요.",
  "thoughtQuestions": [
    "만약 내가 10년 후에 지금 내가 쓴 생각 수첩을 다시 펼쳐 본다면, 10년 뒤의 나는 지금의 나에게 어떤 말을 건네고 싶어할까요?",
    "오늘 수업 시간이나 일상 속에서 흘려보내지 않고 내 생각 수첩에 꼭꼭 묶어두고 싶은 예쁜 기억이나 생각은 무엇인가요?"
  ],
  "app_verdict": "아동의 주도적 성찰 능력인 메타인지(Metacognition)를 함양하고 지속 가능한 자기 기록 습관을 기를 수 있도록 설계된 교육 콘텐츠입니다. 삼산 연아카데미 수업 지도 교재 연계.",
  "sources": [
    {"name": "연삼산점 학습 습관 코칭 가이드", "url": "https://yeon-samsan.pages.dev/"}
  ],
  "critique": {
    "fact_verdict": "clean",
    "false_claims": [],
    "readability": 5,
    "links_checked": 1,
    "links_ok": 1,
    "dead_links": []
  },
  "corrected": 0,
  "imgPrompt": "Warm pastel watercolor of a happy Korean child sitting at a wooden desk with a vintage inkwell and quill, writing in a leather journal, floating letters and stars in the air, warm and bright cream background",
  "aiRole": "모든 아이디어를 기록하여 보물로 만들어주는 꼼꼼하고 다정한 기록 보관소 요정",
  "aiSuggestions": [
    "기록을 재미있게 매일 지속할 수 있는 요정의 꿀팁은?",
    "일기 쓸거리가 없을 때는 노트에 무엇을 적어야 할까요?",
    "이순신 장군님은 난중일기에 어떤 사소한 것까지 적으셨나요?"
  ],
  "vocabulary": [
    {"word": "기록 (Record)", "desc": "어떤 사실이나 생각을 잊지 않도록 글로 적거나 적어 두는 일이에요."},
    {"word": "메타인지 (Metacognition)", "desc": "내가 무엇을 알고 무엇을 모르는지 스스로 생각하고 아는 능력이에요."}
  ]
};

for (const grade in GRADE_DATA) {
  // Check if key already exists
  const exists = GRADE_DATA[grade].corners.some(c => c.key === "record");
  if (!exists) {
    GRADE_DATA[grade].corners.push(record_corner);
    console.log(`Added record corner to Grade ${grade}`);
  } else {
    console.log(`Record corner already exists in Grade ${grade}`);
  }
}

const newJs = "var GRADE_DATA = " + JSON.stringify(GRADE_DATA, null, 2) + ";\n";
fs.writeFileSync('어린이의_결_초등_월간/js/grade_data.js', newJs, 'utf8');
console.log("Successfully wrote updated GRADE_DATA to grade_data.js");
