# 연(緣)의 사랑방 위젯

**단 한 줄로 모든 페이지에 사랑방을 설치**하는 자족형 JavaScript 위젯.

- **버전**: 1.0.0
- **출처**: Y Life — 연(緣)의 집
- **용도**: 연에이젼트 및 모든 연프로젝트에 사랑방 기능 배포

---

## 📁 이 폴더에 담긴 것

| 파일 | 역할 |
|------|------|
| `saranbang-widget.js` | **핵심** — 사랑방 위젯 전체 (HTML+CSS+JS+언어 데이터) |
| `yeon-brand.css` | 연 브랜드 색·폰트·간격 CSS 변수 (연에이젼트에서 톤 맞출 때) |
| `example.html` | 설치가 잘 됐는지 바로 확인할 수 있는 테스트 페이지 |
| `README.md` | 이 문서 |

---

## 🚀 연에이젼트에 설치하는 방법 — 2단계

### 1단계 — 파일 2개를 연에이젼트 프로젝트에 복사

- `saranbang-widget.js`
- `yeon-brand.css` (선택 — 브랜드 톤 맞추고 싶을 때만)

복사 위치는 연에이젼트 프로젝트 내의 어느 폴더든 OK. 예를 들어:
- `연에이젼트/assets/saranbang-widget.js`
- 또는 `연에이젼트/public/saranbang-widget.js`

### 2단계 — 페이지 HTML의 `</body>` 직전에 한 줄 추가

```html
<script src="saranbang-widget.js"></script>
```

그 순간 오른쪽 아래에 **"緣에 묻다"** 검은 버튼이 나타납니다. 클릭하면 다섯 겹 응답 사랑방 모달이 열려요.

끝. 다른 설정 필요 없습니다.

---

## 🎛️ 선택 옵션

원하시면 위젯 로드 **전**에 설정을 줄 수 있어요:

```html
<script>
  window.YeonSaranbangConfig = {
    lang: 'ko',              // 'ko' (기본) 또는 'en'
    position: 'bottom-right' // 'bottom-right' (기본) 또는 'bottom-left'
  };
</script>
<script src="saranbang-widget.js"></script>
```

설정 안 주시면 자동 감지 (페이지 언어 기준).

---

## 🧩 JavaScript API

다른 코드에서 위젯을 제어할 수 있습니다:

```javascript
YeonSaranbang.open();        // 수동으로 사랑방 열기
YeonSaranbang.close();       // 닫기
YeonSaranbang.setLang('en'); // 언어 바꾸기
console.log(YeonSaranbang.version); // → '1.0.0'
```

연에이젼트에서 예를 들어 GPT/Gemini 대화 중 특정 답을 **"이걸 사랑방에 공유할까요?"** 하며 `YeonSaranbang.open()` 부를 수 있어요.

---

## 🎨 brand-css로 연에이젼트 톤 통일하기

`yeon-brand.css`를 불러오면 연에이젼트에서 다음 CSS 변수를 쓸 수 있습니다:

```css
color: var(--yeon-ink);           /* 먹색 */
background: var(--yeon-paper);     /* 한지색 */
border: 1px solid var(--yeon-thread); /* 실타래 금빛 */
font-family: var(--yeon-font-title);  /* 나눔명조 */
```

또는 유틸리티 클래스 바로 사용:

```html
<body class="yeon-body">
  <h1 class="yeon-title">연에이젼트</h1>
  <button class="yeon-btn">실행</button>
</body>
```

---

## 🔧 특징

- **외부 의존성 없음** — Google Fonts만 자동 로드, 그 외 아무것도 안 깔아도 됨
- **CSS 스코핑** — 모든 클래스 이름 `ys-` 접두어로 호스트 페이지와 충돌 없음
- **반응형** — 모바일·태블릿·PC 자동 대응
- **접근성** — ESC로 닫기, aria 속성 포함
- **가벼움** — 단일 파일, 압축 없이 ~20KB
- **다국어** — 한국어·영어 내장
- **버전 관리** — `YeonSaranbang.version`으로 확인 가능

---

## 🔄 업데이트 규칙

Y Life 본가 사랑방이 업데이트되면, 이 위젯 파일도 함께 업데이트됩니다. 최신 버전은 항상 Y Life 프로젝트의 `/saranbang-widget/` 폴더에 있어요.

- 새 버전이 나오면 `saranbang-widget.js` 파일만 **덮어쓰기** 하면 됩니다
- 설정(Config)과 API는 **하위 호환**으로 유지됩니다
- 변경사항은 이 README 하단의 CHANGELOG에 기록

---

## 📝 CHANGELOG

### v1.0.0 (2026-04-17)
- 첫 배포
- 플로팅 버튼 + 모달
- 다섯 겹 응답 (한 줄의 길잡이 / 연소사의 한 편 / 다른 이의 한 마디 / 오늘의 한 걸음 / 더 깊은 세 질문)
- 한국어·영어 자동 감지
- 반응형 + 접근성

---

## ✅ 설치 확인

`example.html`을 더블클릭해서 열어보세요. 오른쪽 아래 "緣에 묻다" 버튼이 뜨고, 클릭하면 사랑방 모달이 열리면 설치 OK.
