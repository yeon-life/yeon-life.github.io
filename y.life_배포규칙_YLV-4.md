# y.life 배포 규칙 — YLV-4

> **Y**-**L**ife **V**ersion **4** — 연라이프(y-life.kr) 미디어 사이트 배포 표준
> **갱신일**: 2026-05-18
> **상위 문서**: 연 통합 규격 **YUV4** (`연_통합규격_yuv4.md`)
> **버전 정책**: YLV 는 항상 YUV 와 같은 메이저 버전 (YUV4 → YLV-4, YUV5 → YLV-5)

**핵심 약속**: 이 문서는 **연라이프 미디어 사이트에 공통으로 적용되는 표준**만 담는다. YUV4 에 있는 공통 항목은 그대로 상속하고, 미디어 고유만 본 문서에 명시.

---

## 0. 이 문서의 사용법

```
YUV4 (연 통합 규격, 모든 연 앱)
 └─ YLV-4 (연라이프 배포 규칙, 이 문서)
     ├─ 세계화전략_지침 (전략·로드맵)
     ├─ 신뢰도_평가_정책 (공개 정책)
     └─ 홍보전략_지침 (홍보·SNS)
```

### 0-1. YUV ↔ YLV 양방향 동기화 (yeon-guidebook §15)

- **YUV → YLV**: 공통 변경 시 YLV 즉시 상속
- **YLV → YUV**: 미디어에서 발견된 공통 사안은 YUV 에도 반영
- 버전은 항상 일치 (메이저 단위)

### 0-2. 갱신 시 동기화 대상

1. `y.life_배포규칙_YLV-X.md` (이 파일)
2. `y.life_배포규칙_YLV-X.html` (시각화)
3. 메모리 `project_yeon_life_homepage.md`
4. 본 문서 30번 "변경 이력"
5. **YUV 영향 여부 확인** — 영향 있으면 YUV 도 동시 갱신

---

## 1. 절대 규칙 (모든 작업 공통)

YUV4 §1 그대로 + 연라이프 추가:

- 1-1. 앱 간 격리 🔴
- 1-2. 한국어 전용
- 1-3. 한자 "然" 금지 — 한글 "연"만
- 1-4. 잘게 묻지 말 것
- 1-5. 같은 실패 반복 금지
- 1-6. Google Drive는 Read/Edit/Write 도구만
- ★ 1-7. **"학원" → "연아카데미" 일괄 교체** (yeon-guidebook §14-1)
- ★ 1-8. AI 페르소나 글에 매 회 "AI 작성" 라벨 + 면책 자동 삽입
- ★ 1-9. 외국 매체 본문 전문 번역 게재 금지 (인용 2~3문장 + 원문 링크)
- ★ 1-10. 정치·이념 기사는 좌·중·우 매체 각 1개 이상 인용 의무
- ★ 1-11. 의료·법률·금융 단정 금지
- ★ 1-12. "AI가 공정한 뉴스" 마케팅 금지 ("공정해지도록 설계")
- ★ 1-13. "X가 아니라 Y" 비교 프레임 금지
- ★ 1-14. 사용자에게 "자라·주무세요" 류 취침 권유 금지
- ★ 1-15. **비밀번호 평문 저장·조회 절대 금지** (YUV4 §3-4)
- ★ 1-16. **클라이언트에 비즈니스 로직·프롬프트 두지 않음** (YUV4 §19 Thin Client)
- ★ 1-17. **답변의 항상 마지막 라인에 사용자가 바로 가기 좋은 작업 대상 파일/폴더 링크 배치** (예: [challenge-diagnosis.html](file:///c:/Claude/연라이프/yeon-life.github.io/challenge-diagnosis.html))

---

## 2. 사용자 권한 5계층

YUV4 §2 (4계층 연아카데미형)을 연라이프 미디어형 **5계층**으로 확장.

| 계층 | 코드/가입 | 권한 |
|------|-----------|------|
| 서버 관리자 (연소사 1인) | 6자리 (`822000`) | 전체 통제·운영·검수 정책 |
| 연아카데미 관리자 (분원 원장) | 6자리 (`123400`) | 자기 연아카데미만 운영 |
| 마을지기 | 서버 관리자 임명 | 광장 모더레이션·검수 큐 보조 |
| 글지기 | 마을지기 승인 | 사이트에 글 직접 작성 |
| 일반 주민 | 6자리(연아카데미) 또는 이메일(마을) | 읽기·댓글·아골라/아곤란 |

### 2-1. 가입 두 경로
연아카데미 단체(6자리) + 마을 직접(이메일). 둘 다 "일반 주민"으로 합류.

### 2-2. 권한 누수 금지 (YUV4 §2-3 그대로)

---

## 3. y-프로젝트 SSO (YUV4 §3 상속 + 미디어 확장)

`y_accounts` 단일 컬렉션 — 모든 연 앱(연플래너·수풀AI·스무고개·연자기관리·**연라이프**) 공유.

### 3-1. 연라이프 고유 사용 이벤트 (`y_usage_events`)
`article_read` · `article_share` · `column_purchase` · `feedback_submit` · `agora_post` · `agonran_post`

### 3-2. ⭐ 사용자 고유 번호 + ID/PW 변경 이력 (YUV4 §3-4 상속)

- 모든 사용자에게 `y_user_no` (7자리, 예 `Y-0001234`) 자동 부여
- ID/PW 변경 시 `y_accounts.id_changed_at` / `pw_changed_at` 갱신 + `y_account_changes` 불변 로그
- **비밀번호는 bcrypt/argon2 해시만, 평문 절대 금지**
- 관리자도 평문 ❌, 변경 메타데이터(시점·횟수)만 조회

### 3-3. 관리자 조회 권한 범위

| 역할 | 조회 범위 |
|---|---|
| 서버 관리자 | 모든 사용자 |
| **연아카데미 관리자** | **자기 분원 소속만** |
| 마을지기 | 자기가 모더하는 광장 글의 작성자 닉네임만 (개인정보 X) |
| 일반 주민 | 본인만 |

### 3-4. 연라이프 추가 컬렉션 (§10 상세)
`articles_published` · `articles_pending` · `personas` · `hwadu` · `news_sources` · `trust_scores` · `agora_posts` · `agonran_posts` · `feedbacks` · `purchases` · `vacation_mode` · `circuit_breaker`

---

## 4. 가입·로그인 + 잠금 + 본인 확인

YUV4 §4 그대로 + 연라이프 가입 두 경로 조정.

### 4-1. 로그인 화면 구조
- 상단: 緣 y-life.kr + 슬로건 "같은 사건, 세 시선으로."
- 중앙 세로 버튼 3개:
  1. 이메일로 로그인
  2. 연아카데미 코드로 가입/로그인 (6자리)
  3. 새 계정 만들기

### 4-2. 5회 실패 5분 잠금 (YUV4 §4-2 그대로)

### 4-3. ⭐ 신규 가입자 본인 확인 (YUV4 §4-4 적용)

미디어 사이트라 학생 등록과는 다르지만 같은 패턴 적용:

- **이메일 신규 가입자**: 이메일 인증 즉시 → "일반 주민" 자동 등록
- **연아카데미 6자리 가입자**: 첫 인증 = **임시 등록** → 연아카데미 관리자가 이름·소속 확인 후 본 등록
- **10일 유예**: 본 등록 안 되어도 모든 읽기·댓글 기능 사용 가능
- **`verification_status`**: `pending` / `verified` / `rejected`

### 4-4. 오류 메시지 톤
- ❌ "Invalid email"
- ✅ "이메일 또는 비밀번호가 맞지 않아요."

---

## 5. 챗봇 공통 규격 (추후 도입)

### 5-1. ⭐ 챗봇 기본 엔진 = Gemma 4 26B (YUV4 §5-1)

연라이프 1차에는 챗봇 X. 향후 도입 시:

| 용도 | 1순위 | 2순위 |
|---|---|---|
| **FAQ·광장 안내** | **Gemma 4 26B** (기본) | Gemini 1.5 Flash |
| **사색 모드 (화두 대화)** | **Claude Haiku** | Gemma 4 26B |
| 칼럼 자동 생성 (별도 §14) | Gemini 2.5 Pro(작가) / Flash(기자) | — |

→ **Gemini API 키 재사용**, 별도 키 발급 금지.

---

## 6. 자동 백엔드 탐색 (YUV4 §6 그대로 상속)

`https://api.y-life.kr` 활성화 시 자동 연결. `file://`·`localhost` 폴백.

---

## 7. 호스팅 마이그레이션 마커 (YUV4 §7 그대로 상속)

연라이프 추가 마커 위치:
- 자동 발행 Cron 진입점
- Gemini API 호출 stub
- AdSense 슬롯 초기화 stub
- 신뢰도 미터 외부 데이터 로딩 stub
- **§18 자동 업데이트 IIFE** (모든 페이지)
- **§24 PWA Service Worker 등록**

---

## 8. 공통 화면 요소

YUV4 §8 + 연라이프 추가:
- 마스트헤드: 모바일 56px / 데스크탑 64px
- 차림표: 우상단 Miro식 메가 메뉴
- 새로 고침 버튼: 자동 발행 글 영역 필수
- 베타 라벨: "BETA · 자라는 중"
- **연아카데미명**: 본원 "연플래닝" / 삼산 분원 "삼산 연아카데미" (학원 표기 금지)

---

## 9. 디자인 시스템 (yp-* 토큰) — YUV4 §9 그대로 상속

연라이프 추가 의미 색:
- `--cat-good` #427a71 (좋은 소식)
- `--cat-must` #2f5d62 (꼭 알아야 할 소식)
- `--cat-caution` #a85a4a (주의할 소식)
- `--cat-market` #c38d56 (글로벌 마켓 시그널)

---

## 10. 데이터 저장 (Firestore)

YUV4 §10 그대로 + 연라이프 신규 컬렉션 12개 (위 §3-4 참조).

### 10-1. `articles_published` 문서 구조

```json
{
  "slug": "yeon-woojin", "post_id": "yu-01",
  "title": "...", "kicker": "...", "subtitle": "...",
  "body_html": "...",
  "category": "must-know",
  "sources": [...],
  "trust": {"score": 91, "axes": {...}, "media": [...]},
  "ai_generated": true,
  "reviewed_by": "server_admin",
  "reviewed_at": "...", "published_at": "...",
  "lang": "ko", "i18n": { "en": null, ... }
}
```

### 10-2. Security Rules
```
match /articles_published/{id} {
  allow read: if true;
  allow write: if request.auth.token.role == 'server_admin';
}
match /agonran_posts/{id} {
  allow read: if true;
  allow write: if request.auth != null
                  && request.resource.data.author_age < 20;
}
```

---

## 11. 반응형 (YUV4 §11 그대로 상속)

---

## 12. SNS·카톡 공유

- 카카오톡 매일 아침 1통 (06:30 KST)
- 자동 OG 카드: 글 제목 + 페르소나 배지 + 신뢰도 점수 + 슬로건
- 상세: `홍보전략_지침`

---

## 13. 메시지 톤 — YUV4 §13 그대로 + 연라이프 추가

| 상황 | ❌ 금지 | ✅ 권장 |
|---|---|---|
| AI 응답 못 받음 | "API quota exceeded" | "오늘의 글이 잠시 늦어지고 있어요. 다음 시각에 다시 와 주세요." |
| 검수 대기 | "Pending review" | "이 글은 사람 검수를 기다리고 있어요." |
| 비용 한도 | "Budget limit" | "오늘은 충분히 들었어요. 내일 다시 들려드릴게요." |

---

## 14. 미디어 발행 표준 ⭐ 연라이프 고유

### 14-1. 자동 발행 시간표 (KST)
```
03:00 · Cron 트리거 (Cloudflare Workers)
03:30 · RSS 수집·큐레이션 완료
04:00 · Gemini 13편 병렬 호출
05:00 · 본문 + 이미지 생성 완료
05:30 · 검수 큐 + 아침 알림
06:00 · 첫 발행
06:00~09:00 · 13편 순차 발행 (14분 간격)
```

### 14-2. 페르소나 17명 발행 정책

| 그룹 | 인원 | 빈도 | 모델 |
|---|---|---|---|
| AI 작가 | 3 | 매일 1편 | Gemini 2.5 Pro |
| AI 기자 | 10 | 매일 1편 | Gemini 2.5 Flash |
| 초대 필자 | 4 | 주 1~2회 | 사람 작성 |

### 14-3. 카테고리 3축

| 카테고리 | 자동 분류 기준 |
|---|---|
| **좋은 소식** | 긍정 키워드·해결책 점수 ↑ |
| **꼭 알아야 할 소식** | 보편성 ↑ · 정치 색채 ↓ |
| **주의할 소식** | 위험·피해 ↑ |

### 14-4. 글 1편 표준
- 본문 2,500자 ± 200, H2 2~3, H3 1
- 풀쿼트 1, 인용 1~2, 마지막은 질문
- AI 작성 라벨 + 면책 자동 삽입
- 인용 출처 박스
- 신뢰도 미터 자동 삽입 (8축 펼치기)
- 대표 이미지 1장 (4단계 폴백)

### 14-5. 이미지 4단계 자동 폴백
1순위 원 매체 OG (라이선스 명시, ~30%) → 2순위 Unsplash/Pexels CC0 (~40%) → 3순위 Imagen 자동 생성 (~28%) → 4순위 SVG 추상 도형 (~2%)

---

## 15. 신뢰도 8축 평가 ⭐ 연라이프 고유

8축: ① 출처 다양성 15% · ② 1차 출처 인용 20% · ③ 검증 가능성 15% · ④ 시간 검증 10% · ⑤ 이해 충돌 점검 10% · ⑥ 팩트체커 교차 15% · ⑦ 언론자유 가중 10% · ⑧ 아카이브 일관성 5%

| 점수 | 처리 |
|---|---|
| ≥ 80 | 검수 후 자동 발행 + 상단 강조 |
| 70~79 | 검수 후 자동 발행 |
| 50~69 | 검수 큐 필수 (24h 미승인 자동 폐기) |
| < 50 | 자동 폐기 |
| 정치·종교·실명 | 항상 검수 큐 |

모든 글 하단 신뢰도 미터 자동 삽입 의무. 매체 평가 DB 공개. 상세: `신뢰도_평가_정책.html`.

---

## 16. 저작권 안전선 ⭐ 연라이프 고유

1. 외국·국내 매체 본문 전문 번역·복제 게재 절대 금지
2. 인용 2~3문장 한도, 원문 링크 의무
3. 우리 본문 = 우리 톤의 해설·맥락화
4. OG·기사 사진은 라이선스 명시된 경우만
5. 사람 얼굴 AI 생성 금지
6. AI 페르소나 글에 매 회 "AI 작성" 라벨
7. 의료·법률·금융 단정 금지

---

## 17. 광고·진영 정책 ⭐ 연라이프 고유

| 영역 | 광고 |
|---|---|
| 메인 홈 (광장) | **광고 0** |
| AI 페르소나 블로그 | AdSense 적극 |
| 사용자 개인 블로그 | 본인 선택 |
| 학생 글·아곤란 | **광고 0** |
| 광장·아골라 | **광고 0** |
| 뉴스 (큐레이션·해설) | **광고 0** |
| 칼럼·작가 페이지 | AdSense OK |

진영 광고 거부 · AdSense 카테고리 차단 · 단일 광고주 매출 30% 초과 알림.

---

## 18. ⭐ 자동 업데이트 시스템 (YUV4 §18 상속)

### 18-1. 핵심 약속
독자가 "새로고침" 절대 누를 필요 없음. 연소사가 GitHub push만 하면 5분 안에 모든 사용자 앱이 새 버전.

### 18-2. 자동 업데이트 3겹 기술

| 기술 | 역할 |
|------|------|
| **Service Worker (PWA, §24)** | 백그라운드에서 새 파일 자동 다운로드 |
| **버전 폴링 5분마다** | `version.json` 비교 |
| **HTML `no-cache` + 해시 파일명** | `index.html` 매번 새로 |

### 18-3. 부드러운 자동 리로드

새 버전 감지 시 즉시 리로드 ❌. 다음 모두 만족 시 리로드:
1. 사용자가 입력 중이 아님 (`document.activeElement`가 input/textarea 아님)
2. 최근 30초간 클릭·키 입력 없음 (idle)
3. **글 읽는 중이 아님** (스크롤 활동 30초 이내 시 대기 — 연라이프 추가 조건)
4. 챗봇 응답 대기 중이 아님

### 18-4. 표준 구현 (모든 페이지 진입 시)

```js
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000;
let currentVersion = window.YEON_BUILD_VERSION || 'dev';

async function checkVersion() {
  try {
    const r = await fetch('/version.json?t=' + Date.now(), { cache: 'no-cache' });
    const j = await r.json();
    if (j.version !== currentVersion) {
      if (j.force) { showToast('보안 업데이트가 적용돼요…'); setTimeout(() => location.reload(), 1000); }
      else { showToast('새 버전이 준비됐어요 ✨'); scheduleSoftReload(); }
    }
  } catch(_) {}
}
function scheduleSoftReload() {
  let lastActivity = Date.now();
  ['click','keydown','touchstart','scroll'].forEach(ev =>
    window.addEventListener(ev, () => lastActivity = Date.now()));
  const tick = setInterval(() => {
    const idle = Date.now() - lastActivity > 30000;
    const isInput = ['INPUT','TEXTAREA'].includes(document.activeElement?.tagName);
    if (idle && !isInput && !window.YEON_CHAT_PENDING) {
      clearInterval(tick);
      showToast('새 버전 적용됐어요 ✨', 3000);
      setTimeout(() => location.reload(), 600);
    }
  }, 5000);
}
setInterval(checkVersion, VERSION_CHECK_INTERVAL);
checkVersion();
```

### 18-5. 사용자 경험
- 보이는 건: 토스트 "새 버전 적용됐어요 ✨" 3초
- 새로고침 버튼 누른 적 없음. 업데이트 모달 본 적 없음
- 작업 내용(댓글·아골라 글 작성 중) 절대 잃지 않음

### 18-6. 강제 업데이트
`version.json`에 `force: true` → idle 안 기다리고 즉시 리로드. 단 사용자 입력 중인 폼은 자동 백업.

---

## 19. 검수·자율 운영 ⭐ 연라이프 고유

### 19-1. 검수 큐 정책
- 24시간 안에 사람 승인 없으면 자동 폐기
- 정치·종교·실명·의료·법률·금융 단정 → 점수 무관 항상 검수 큐
- 독자 신고 1건 → 24h 안에 재검토

### 19-2. 부재 모드 (Vacation Mode)
- 신뢰 ≥ 0.70 글 모두 자동 발행, 민감만 큐 보관
- 복귀 시 자동 요약 리포트

### 19-3. 서킷 브레이커

| 상황 | 자동 대응 |
|---|---|
| API 비용 월 한도 80% | 자동 정지 + 알림 |
| 매체 RSS 24h 무응답 | 그 매체 제외 |
| 검수 실패율 30% 초과 | 페이스 자동 감속 |
| Gemini API 장애 | 큐 보존, 복구 후 재시도 |
| 같은 글 2회 거부 | 페르소나 그 날 휴재 |

---

## 20. 홈 메인 정보 아키텍처 (IA) ⭐ 연라이프 고유

```
1. 마스트헤드 (緣 y-life.kr + 메가 메뉴)
2. 오늘의 화두 ★
3. 우리나라 이슈 (한국 AI 기자)
4. 세계적 이슈 (Country of the Day + 글로벌)
5. 토론 광장 (아골라·아곤란)
6. 사설·인사이트 (편집인 + AI 작가)
7. 푸터
```

---

## 21. ⭐ 배포·코드 보호 표준 (YUV4 §19 상속)

### 21-1. 권장 스택

| 역할 | 플랫폼 |
|---|---|
| 정적 호스팅·CDN | **Cloudflare Pages** |
| 서버 함수 | **Cloudflare Workers** |
| DB·인증·실시간 | **Firebase** (Firestore + Auth + Functions + FCM) |
| DNS·SSL·DDoS | Cloudflare 자동 |

금지: Netlify · GitHub Pages (백엔드 불가) · Vercel (선택적·임시만)

### 21-2. Thin Client 원칙

| 두는 곳 | 무엇 |
|---|---|
| **클라이언트** | UI 그리기·사용자 입력·결과 표시·`/api/*` 호출 |
| **서버 (Workers)** | AI 프롬프트(Gemini/Claude)·신뢰도 8축 산식·검수 로직·매체 평가 DB·API 키·인증 검증·DB 접근 |

→ **연라이프의 진짜 가치(페르소나 프롬프트·신뢰도 알고리즘·검수 로직)는 모두 서버에**.

### 21-3. 폴더 구조 (연라이프 호스팅 모드)

```
연라이프 홈페이지 제작/
├── index.html              ← 클라이언트
├── 시안_v4_홈페이지.html
├── 오늘의_연라이프_YYYY-MM-DD.html (자동 생성)
├── 블로그_*.html
├── 광장_생각지도.html
├── 신뢰도_평가_정책.html
├── data/personas.js
├── data/articles_today.js (자동 갱신)
├── public/                 ← 정적 자산
├── functions/              ← Cloudflare Workers
│   ├── api/
│   │   ├── publish.js      ← 자동 발행 워크플로
│   │   ├── trust-score.js  ← 신뢰도 8축 산식
│   │   ├── review-queue.js ← 검수 큐
│   │   ├── feedback.js     ← 독자 신고 처리
│   │   ├── auth.js
│   │   └── health.js
│   └── _shared/
│       ├── prompts/        ← 페르소나 17명 프롬프트
│       └── media-db/       ← 매체 평가 DB
├── version.json            ← §18 자동 업데이트용
├── manifest.json           ← §24 PWA
├── sw.js                   ← §24 Service Worker
├── wrangler.toml           ← Cloudflare Workers 설정
└── firebase.json
```

### 21-4. 자동 배포 흐름

```
연소사가 OneDrive\Projects\연라이프\index.html 저장
   ↓
git commit + push
   ↓ (자동, 5초)
Cloudflare Pages·Workers + Firebase 자동 webhook
   ↓
   - 클라이언트: minify → Cloudflare Pages CDN 200+ 도시
   - 서버 함수: Cloudflare Workers 자동 배포
   - DB·인증: Firebase 그대로
   ↓ (총 1~3분)
모든 독자 앱: §18 자동 업데이트로 새 버전 적용
   ↓
연소사 한 일: 파일 저장 1번
```

### 21-5. 비용 (연라이프 풀가동 기준)

| 단계 | 월 |
|---|---|
| 시작 (베타, 방문자 5천) | 무료 |
| 성장 (방문자 5만) | $0~5 |
| 확장 (방문자 50만, 다국어) | $20~50 |
| 대형 (방문자 500만) | $200~500 |

자동화(Gemini API) + 인프라(Cloudflare/Firebase) 합산: **월 약 3~5만원 (성장 단계)**.

---

## 22. ⭐ Obsidian Vault 표준 (YUV4 §21 적용)

연라이프에서 적용되는 자리:
- **광장 생각의 지도** (`광장_생각지도.html`) — 글 노드의 키워드 태그
- **개인 스크랩북** — 사용자 본인 자료의 4단 폴더 + Wiki Link 바로가기
- **편집 백오피스** — 검수 큐의 글에 키워드 자동 추출 (Gemma 4 26B)

### 22-1. 깊이 4단 규칙
- ✅ `04_세계는지금/유럽/독일/베를린.md` (4단)
- ❌ 5단 이상은 태그로 (`#키워드`)

### 22-2. AI 자동 분류 응답 JSON
```json
{
  "keywords": ["기후", "에너지", "재생에너지", "독일", "정책"],
  "main_folder": "04_세계는지금/유럽/독일",
  "shortcut_folders": ["05_분야별/환경", "06_분야별/정책"]
}
```

---

## 23. ⭐ 내보내기 표준 v1.1.10 (YUV4 §22 상속)

연라이프 칼럼·아골라 글·스크랩북은 **6가지 형식** 내보내기 지원:

| 형식 | 확장자 | 추천 용도 |
|---|---|---|
| 📝 Markdown | `.md` | 옵시디언·노션·깃허브 |
| 🌐 HTML | `.html` | 브라우저 공유 |
| 📄 Word | `.doc` | 학부모 인쇄 |
| 📕 PDF | `.pdf` | 최종 보고서 |
| 📦 JSON | `.json` | 백업·재가져오기 |
| 📚 Obsidian Vault | `.md × N` | 도메인별 + `index.md` |

### 23-1. 파일명 규칙
`연라이프_<도메인>_<날짜>.<확장자>` (예: `연라이프_칼럼_2026-05-18.md`)

### 23-2. 보안
- 본인 데이터만 — 다른 사용자 절대 섞이지 않음
- `user_id`는 JSON에만, 사람용에는 노출 금지
- 기본 비공개

---

## 24. ⭐ PWA 표준 (YUV4 §23 상속)

연라이프는 폰·태블릿·PC 모두 "홈 화면 추가" 가능, 오프라인 동작, 자동 업데이트.

### 24-1. 필수 요건 6가지
1. `<meta name="theme-color" content="#2f5d62">` — yp-deep
2. `<link rel="manifest" href="manifest.json">`
3. `<link rel="icon">` + `apple-touch-icon` (SVG 권장)
4. Service Worker 등록 (HTTPS만)
5. `beforeinstallprompt` 처리 — "📲 앱 설치" 버튼 동적 표시
6. 반응형 (§11)

### 24-2. 파일 구성
```
앱폴더/
├── index.html              (PWA 메타)
├── manifest.json           (앱 정보)
├── sw.js                   (Service Worker)
├── icon-192.svg            (192×192)
├── icon-512.svg            (512×512)
└── apple-touch-icon.svg    (180×180)
```

### 24-3. Manifest 표준 (연라이프)
```json
{
  "name": "연라이프 · y-life.kr",
  "short_name": "연라이프",
  "description": "같은 사건, 세 시선으로.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#2f5d62",
  "background_color": "#f4f0e9",
  "lang": "ko",
  "categories": ["news", "education", "lifestyle"],
  "icons": [
    {"src": "icon-192.svg", "sizes": "192x192", "type": "image/svg+xml", "purpose": "any maskable"},
    {"src": "icon-512.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any maskable"}
  ],
  "shortcuts": [
    {"name": "오늘의 화두", "url": "/?view=hwadu"},
    {"name": "오늘의 글", "url": "/오늘의_연라이프.html"},
    {"name": "광장", "url": "/광장_생각지도.html"}
  ]
}
```

### 24-4. Service Worker 캐시 전략
- `index.html`·`manifest.json`·`version.json` → 네트워크 우선 + 폴백 캐시
- 아이콘·CSS·이미지 → 캐시 우선
- 자동 발행 글 페이지 → 네트워크 우선 (매일 갱신)
- 외부 API → 캐시 안 함

### 24-5. §18 자동 업데이트와 연결
Service Worker 가 새 버전 감지 → §18 idle 대기 → 자동 리로드. 두 시스템 함께 작동.

---

## 25. 절대 하지 말 것

YUV4 §14 모두 적용 + 연라이프 추가:

### 발행·콘텐츠
- ❌ 외국 매체 본문 전문 번역
- ❌ 인용 단락 한도 초과
- ❌ 사람 얼굴 AI 생성 (사실적)
- ❌ 정치·의료·금융 단정
- ❌ "X가 아니라 Y" 비교 프레임
- ❌ AI 라벨·신뢰도 미터 누락

### 마케팅
- ❌ "AI가 공정한 뉴스"
- ❌ "객관적이다"·"편향 없다"
- ❌ 진영 광고
- ❌ 학생 글·아곤란 광고

### 용어
- ❌ "학원" 사용 → "연아카데미"
- ❌ "지점·분점" → "분원·아카데미"

### 보안·데이터 (YUV4 §14 추가)
- ❌ 비밀번호 평문 저장·조회
- ❌ 변경 이력 로그 수정·삭제 (불변)
- ❌ 클라이언트에 비즈니스 로직·프롬프트 (§21 Thin Client)

### 자동 업데이트·배포
- ❌ 사용자에게 "새로고침 해주세요" 안내 (§18)
- ❌ 사용자에게 "올려주세요" 시키기 (§21 자동 배포 표준)
- ❌ 작업 중인 사용자 입력 무시하고 즉시 리로드

### 사용자 대화
- ❌ "자라·주무세요" 류 취침 권유

---

## 26. 배포 전 점검 체크리스트 ⭐

### 통합 계정·권한·보안 (YUV4 §3·§14)
- [ ] `y_accounts` 단일 사용?
- [ ] 5계층 권한 분리?
- [ ] `y_user_no` 모든 사용자에게 부여?
- [ ] ID/PW 변경 → `y_account_changes` 로그?
- [ ] 비밀번호 해시만, 평문 ❌?
- [ ] 5회 실패 5분 잠금?
- [ ] "API" 단어 노출 ❌?

### 미디어 발행 (§14)
- [ ] 자동 발행 03:00 시간표 가동?
- [ ] AI 라벨·면책 자동 삽입?
- [ ] 카테고리 3축 자동 분류?
- [ ] 이미지 4단계 폴백 작동?

### 신뢰도 (§15)
- [ ] 8축 점수 매 글 산정?
- [ ] 신뢰도 미터 모든 글 하단?
- [ ] 50점 미만 자동 폐기?
- [ ] `신뢰도_평가_정책.html` 공개?

### 저작권·광고 (§16·§17)
- [ ] 인용 2~3문장 자동 검증?
- [ ] 광장·아곤란 광고 0?
- [ ] 진영 광고 차단?

### 자동 업데이트 (§18) ⭐ YUV4 신규
- [ ] Service Worker 등록 (모든 페이지)?
- [ ] `version.json` 5분 폴링?
- [ ] idle 상태에서만 리로드?
- [ ] HTML `no-cache` + 해시 파일명?
- [ ] "새 버전 적용됐어요" 토스트 3초?

### 검수·자율 (§19)
- [ ] 검수 큐 24h 폐기?
- [ ] 부재 모드 토글?
- [ ] 서킷 브레이커 5종?

### 홈 IA (§20)
- [ ] 7개 섹션 순서?

### 배포·코드 보호 (§21) ⭐ YUV4 신규
- [ ] Thin Client: 클라이언트는 UI만?
- [ ] AI 프롬프트·신뢰도 산식·검수 로직이 Workers에?
- [ ] minify 적용?
- [ ] GitHub push → 자동 배포?
- [ ] 연소사 무개입 배포?

### Vault·내보내기·PWA (§22·§23·§24) ⭐ YUV4 신규
- [ ] Vault 4단 깊이?
- [ ] 6형식 내보내기 작동?
- [ ] PWA manifest·SW·아이콘 3종?
- [ ] "📲 앱 설치" 버튼 동적 표시?
- [ ] theme-color 메타?

### 용어 (yeon-guidebook §14)
- [ ] "학원" 없음 (→ "연아카데미")?
- [ ] "지점·분점" 없음 (→ "분원·아카데미")?
- [ ] 영문 기술용어 없음?

### 한국어 (YUV4 §13)
- [ ] 모든 UI 한국어?
- [ ] 메시지 톤 친절·짧음?

### 홍보·SNS (`홍보전략_지침`)
- [ ] 슬로건 노출?
- [ ] OG 이미지 자동 생성?
- [ ] 카카오톡 매일 발송?

---

## 27. 통합 업그레이드 + YUV ↔ YLV 동기화

YUV4 §16 상속 + yeon-guidebook §15.

### 27-1. 본 규격서 변경 시
1. 변경 사항 정리
2. **YUV 영향 여부 확인** — 영향 있으면 YUV 도 동시 갱신
3. 영향 페이지·시스템 목록
4. 페이지별 업그레이드
5. §26 체크리스트 실행
6. 결과 보고

### 27-2. YUV 가 갱신되면
YLV 도 자동 같은 메이저 버전으로 (YUV5 → YLV-5).

---

## 28. 로컬 폴더·백업 구조 (YUV4 §17 상속)

```
C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\
├── index.html
├── 시안_v4_홈페이지.html
├── 오늘의_연라이프_YYYY-MM-DD.html
├── 블로그_AI작가기자_인덱스.html
├── 블로그_페르소나.html / _칼럼.html / _상점.html
├── 광장_생각지도.html
├── 단계2_광장글_상세페이지.html
├── md_viewer.html
├── 신뢰도_평가_정책.html
├── 세계화전략_지침.md / .html
├── 홍보전략_지침.md / .html
├── y.life_배포규칙_YLV-4.md / .html  ← 이 문서
├── 시스템_AI페르소나_자동화_설계.html
├── data/personas.js / articles_today.js
├── functions/                    ← 추후 §21
├── version.json / manifest.json / sw.js (호스팅 시)
└── _백업\v_YYYYMMDD_변경요약\
```

---

## 29. 변경 규칙

본 규격서 변경 시:
1. `y.life_배포규칙_YLV-X.md`
2. `y.life_배포규칙_YLV-X.html`
3. 메모리 `project_yeon_life_homepage.md`
4. 본 문서 30번 "변경 이력"
5. §27 통합 업그레이드
6. **YUV 영향 시 YUV 도 동시 갱신**

---

## 30. 변경 이력

| 버전 | 날짜 | 변경 사항 |
|---|---|---|
| **YLV-4** | 2026-05-18 | YUV4 동기화 승급. YUV4 신표준 5개 흡수: §18 자동 업데이트(Service Worker + idle 리로드), §21 배포·코드 보호(Cloudflare Pages + Workers + Firebase, Thin Client), §22 Obsidian Vault(4단·Wiki Link), §23 내보내기 v1.1.10(6형식), §24 PWA(manifest·SW·아이콘). §3-4 `y_user_no` + ID/PW 변경 이력 추가. §4-3 본인 확인 10일 유예 적용. §5-1 Gemma 4 26B 챗봇 기본 엔진. 비밀번호 평문 금지·Thin Client 명문화. 옛 YLV-3.2 `_백업/v_20260518_pre_YLV4/`로. |
| YLV-3.2 (백업) | 2026-05-18 | YUV-3.2 상속 + 미디어 고유 7개. 이름·버전 통일. "학원→연아카데미" 적용. |
