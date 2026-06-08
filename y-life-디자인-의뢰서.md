# y-life.kr 웹사이트 디자인 의뢰서
> AI(Gemini / GPT)에게 디자인 개선을 요청하기 위한 공식 브리핑 문서  
> 작성일: 2026.04.25 | 작성자: 연소사(이진우)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 사이트명 | **y-life.kr** |
| 부제 | 삶·인연·소통, 그 깊은 연(緣)으로 잇다 |
| 성격 | 오픈 지식 생산 플랫폼 (Static GitHub Pages) |
| 운영 주체 | 연소사 이진우 (울산 교육자) |
| 타깃 사용자 | 생각하는 성인 + 배우는 학생 |
| 현재 URL | https://y-life.kr |
| 저장소 | yeon-life/yeon-life.github.io |

---

## 2. 현재 디자인 시스템 (Warm Linen 테마)

### 컬러 팔레트
```css
:root {
  --color-bg:      #F8F2EA;   /* 따뜻한 아이보리 배경 */
  --color-surface: #EDE5D8;   /* 카드·패널 배경 */
  --color-primary: #7A6A52;   /* 주요 버튼·링크 */
  --color-muted:   #B8B0A4;   /* 보조 텍스트 */
  --color-text:    #2A2018;   /* 본문 텍스트 */
  --gold:          #B08040;   /* 포인트 색 (금실) */
  --agora:         #3D5F8A;   /* 아골라 섹션 청색 */
  --agonran:       #3D6E3D;   /* 아곤란 섹션 녹색 */
  --wood:          #5D4037;   /* 헤더 버튼 */
}
```

### 폰트
- 제목: **Nanum Myeongjo** (serif, 800)
- 본문: **Pretendard / Noto Sans KR** (sans-serif)

### 아이콘 규칙
- SVG 라인 아이콘만 사용
- stroke-width: 1.5
- stroke-linecap/linejoin: round

### 다크 모드
- 현재 구현 완료 (설정 토글로 전환)
- 다크 배경: `#1A1612`

---

## 3. 현재 페이지 구조 (섹션 순서)

```
헤더 (sticky) → 로고 + 네비 + 로그인/가입 + 빠른이동 + 설정
  │
  ├── 히어로 (dark) — 밤 지구본 + 유성 애니메이션 + 메인 카피
  ├── 화두(話頭) — 오늘의 철학 질문 + 토론 버튼
  ├── 뉴스 — 7탭 (우리동네·지역·대한민국·지구촌·하늘·땅·바다)
  ├── 광장 — 아골라(성인 토론) + 아곤란(학생 질문)
  ├── 인연의 다리 — 연계 사이트 카드 그리드
  └── 푸터
```

---

## 4. 현재 문제점 / 개선 요청 사항

### 4-1. 전체 레이아웃
- [ ] 섹션 간 전환이 너무 단조로움 — 각 섹션이 비슷한 높이와 패딩
- [ ] 히어로 이후 첫 번째 섹션(화두)으로의 자연스러운 흐름이 부족
- [ ] 모바일에서 헤더 요소가 너무 밀집됨

### 4-2. 뉴스 섹션
- [ ] 7개 탭이 한 줄에 나열 — 작은 화면에서 overflow 발생
- [ ] 뉴스 카드 디자인이 너무 평범 (단순 border 박스)
- [ ] 카테고리별 색상 정체성 강화 필요

### 4-3. 광장 섹션 (아골라/아곤란)
- [ ] 그리스 아고라 스케치 배경이 있으나 글씨와 대비 부족
- [ ] 두 카드(아골라/아곤란)의 시각적 구분이 미흡
- [ ] 글쓰기 버튼 위계가 약함

### 4-4. 히어로
- [ ] CSS 지구본이 너무 어두운 면 존재
- [ ] 메인 카피 레이아웃 재정비 필요 (현재 좌측 정렬)
- [ ] CTA 버튼 "마을 입주하기"의 시각적 임팩트 보완

### 4-5. 화두(話頭) 섹션
- [ ] 인용문 박스가 너무 단순한 border 스타일
- [ ] 인용문 글씨와 섹션 배경이 잘 어우러지지 않음

---

## 5. 디자인 철학 & 금지 사항

### 철학
> "마음씨 있게" — 자극적이지 않고, 따뜻하며, 사유를 돕는 디자인

- 저채도 톤 유지 (원색 금지)
- 비교 프레임 카피 금지 ("구글 사이트보다" 같은 표현 X)
- 지나친 그라디언트, 네온, 글리치 효과 금지
- 텍스트 대비 4.5:1 이상 유지

### 기술 제약
- **순수 HTML/CSS/JS** (프레임워크 없음)
- CDN 외부 라이브러리 최소화
- GitHub Pages 정적 호스팅 — 서버 사이드 처리 없음
- 기존 CSS 변수 시스템 유지

---

## 6. 현재 핵심 CSS 구조 (참고용)

```css
/* 섹션 공통 */
.section { padding: 72px 0; }
.section-inner { max-width: 1280px; margin: 0 auto; padding: 0 4%; }
.section-title { font-family: 'Nanum Myeongjo', serif; font-size: clamp(22px,3vw,30px); font-weight: 800; }
.section-title span { color: var(--gold); }

/* 헤더 */
.site-header { background: rgba(26,21,14,0.97); height: 60px; position: sticky; top: 0; z-index: 200; }

/* 히어로 */
.hero-dark { background: #0F0A06; min-height: 100vh; position: relative; overflow: hidden; }
.css-globe { width: 540px; height: 540px; border-radius: 50%;
  background: url('밤지구위성사진') 0 center; background-size: auto 100%;
  animation: globeSpin 44s linear infinite; }

/* 뉴스 */
.news-tab { border-radius: 20px; font-size: 13px; color: #fff; border: 1px solid rgba(255,255,255,0.35); }
.news-card { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 18px; }

/* 광장 */
.plaza-card { background: var(--surface); border-radius: 16px; padding: 24px; }
.plaza-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
```

---

## 7. 의뢰 요청 사항 (AI에게 요청할 것)

### 요청 A — 전체 UI 리뉴얼 제안
다음 조건을 지키면서 y-life.kr 홈페이지의 각 섹션별 디자인 개선안을 HTML+CSS 코드로 제안해 주세요:
1. 기존 Warm Linen 컬러 팔레트 유지
2. 뉴스 카드에 카테고리별 색상 포인트 추가
3. 화두 섹션 인용문 박스를 더 인상적으로
4. 광장 섹션 두 카드의 시각적 차별화
5. 모바일 반응형 개선

### 요청 B — 특정 섹션 집중 개선
다음 섹션의 HTML+CSS를 완전히 새로 디자인해 주세요:
- **대상**: 뉴스 섹션 (탭 + 카드)
- **조건**: 7개 카테고리 각각의 색상 정체성, 카드에 이미지 영역 추가, 다크모드 지원

### 요청 C — 컴포넌트 단위 디자인
다음 UI 컴포넌트들을 yeon-design 시스템에 맞게 재디자인해 주세요:
- 로그인/가입 모달 (구글 버튼 포함)
- 글쓰기 모달
- 설정 모달

---

## 8. 첨부 참고 자료

현재 사이트: **https://y-life.kr**

현재 index.html 파일 경로 (로컬):
```
C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\index.html
```

관련 디자인 스킬 문서: yeon-design SKILL.md (연 프로젝트 공식 디자인 시스템)

---

*이 의뢰서를 Gemini 또는 ChatGPT에 붙여넣고, 위 요청 A/B/C 중 원하는 것을 지정하여 요청하세요.*
