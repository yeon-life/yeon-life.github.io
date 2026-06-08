# 수풀AI — 코덱스 점검 의뢰서

> 작성: 이진우(연소사) | 작성일: 2026-05-02 | 정식 배포 전 품질 점검 요청

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **앱 이름** | 수풀AI · 수학 완전학습 |
| **버전** | v4.5 |
| **앱 성격** | 중·고등학생 수학 AI 학습 앱 (학원 연동) |
| **브랜드 컬러** | `#526E8A` |
| **배포 예정 URL** | `yeon.ai.kr/supul/su-pul.html` |
| **GitHub 레포** | `jinwooshon-coder/yeon-ai-kr` |
| **배포 플랫폼** | GitHub Pages |

---

## 2. 파일 구성

```
supul/
├── su-pul.html            ← 메인 앱 (학생용, ~14,600줄)
├── drawing-pad.html       ← 수식 그림판 (iframe으로 연동)
├── admin.html             ← 관리자 콘솔
├── parent.html            ← 학부모용 뷰
├── config.js              ← 배포 설정값
├── problemBank.js         ← 다차원 문제뱅크 (7차원 분류)
├── yeon-focus-tracker.js  ← 학생 집중도 감지 스킬
├── sw.js                  ← 서비스워커 (PWA 오프라인)
├── manifest.webmanifest   ← PWA 설정
├── icon.svg               ← 앱 아이콘
└── lowgrade/              ← 초등 저학년 버전
    ├── index.html
    ├── grade2.html
    ├── grade3.html
    └── grade4.html
```

---

## 3. 주요 기능 목록

### 학생 앱 (su-pul.html) — 5개 탭
| 탭 | 기능 |
|----|------|
| **문제풀이** | 사진 촬영 또는 텍스트 입력 → Claude API 풀이 → KaTeX 수식 렌더링 |
| **연습** | 문제뱅크(problemBank.js) 기반 연습문제 생성, 난이도·유형 선택 |
| **수업** | 수업 기록, 다음 수업 준비, 과제, 시간표, 선생님 소통 게시판 |
| **공식** | 단원별 공식 카드, 개념 학습 |
| **내 학습** | 오답노트, 취약점 분석, 성장 그래프, 복습 스케줄 |

### 부가 기능
- **그림판 모달**: drawing-pad.html을 iframe으로 불러와 수식 손글씨 입력
- **QR 공유**: 앱 링크 QR 코드 생성 (qrcodejs CDN)
- **학원 등록 코드**: 가입 시 6자리 코드 필수 입력
- **선생님 브랜딩**: `yeon_teacher_brand` localStorage로 앱 이름/반 이름 커스텀
- **YeonFocus**: 60초 무입력 시 집중도 환기 팝업
- **PWA**: 오프라인 캐시, 홈화면 추가
- **카카오톡 인앱 감지**: 외부 브라우저로 자동 리다이렉트
- **에러 모니터링**: `supul_error_log` localStorage 자동 누적
- **Google 로그인** (Google Identity Services)

---

## 4. 기술 스택

| 분류 | 내용 |
|------|------|
| 구조 | 단일 HTML (Vanilla JS, 외부 프레임워크 없음) |
| 수식 | KaTeX 0.16.9 (CDN) |
| OCR | Tesseract.js v5 (CDN) |
| QR | qrcodejs 1.0.0 (Cloudflare CDN) |
| 인증 | Google Identity Services |
| AI | Claude API (Anthropic) — 서버사이드 프록시 경유 |
| PWA | Service Worker (sw.js v4) |
| 집중도 | yeon-focus-tracker.js (자체 제작) |
| 저장 | localStorage 기반 (Firebase 미연동) |

---

## 5. 점검 요청 항목

### 🔴 최우선 — 버그 및 충돌
1. **탭 전환 오류**: 탭 클릭 시 `null.addEventListener` 류 에러 발생 이력 있음 (이미 일부 수정됨 — 잔여 케이스 확인)
2. **그림판 iframe 연동**: `openDrawingPadModal()` / `closeDrawingPadModal()` / `sendDrawingToAnalyze()` 함수 정상 동작 확인
3. **QR 모달**: `openQRModal()` / `closeQRModal()` / `copyAppLink()` 정상 동작 확인
4. **서비스워커 캐시**: `sw.js` 버전 충돌로 구버전 캐시가 남는 케이스 확인
5. **KaTeX 렌더링 타이밍**: defer 로드 후 `renderMathInElement` 호출 시점 문제 확인

### 🟡 중요 — UX 및 로직
6. **학원 등록 코드 검증**: 가입 시 코드 누락/오류 처리 흐름 확인
7. **문제뱅크 fallback**: `ProblemBank.select()` 결과가 0건일 때 레거시 `questionPool` 폴백 동작 확인
8. **오답 분석 로직**: 취약점 분석 데이터가 localStorage에 올바르게 누적되는지 확인
9. **Google 로그인 실패 처리**: 로그인 취소/실패 시 앱이 멈추지 않는지 확인
10. **카카오 인앱 리다이렉트**: iOS/Android 각각 정상 동작 확인

### 🟢 권장 — 코드 품질
11. **전역 변수 충돌**: 14,000줄 단일 파일 내 전역 변수명 중복 여부 스캔
12. **메모리 누수**: setInterval/addEventListener 미해제 케이스 확인
13. **콘솔 에러**: 브라우저 콘솔에 불필요한 에러·경고 출력 여부
14. **모바일 레이아웃**: iOS Safari / Android Chrome 주요 화면 확인
15. **오프라인 동작**: 서비스워커 캐시 범위에서 핵심 기능 동작 여부

---

## 6. 알려진 이슈 (수정 완료)

| 이슈 | 커밋 |
|------|------|
| QR 모달 JS 코드가 `<script>` 태그 밖으로 노출 | `9a1c022` |
| 그림판 연동 함수 미정의로 버튼 클릭 시 에러 | `7b6370f` |
| `</script>` 태그 누락으로 탭 전체 먹통 | `66feff8` |
| 그림판 인라인 iframe → 모달 방식으로 변경 | `1393283` |

---

## 7. 점검 방법 제안

```
1. su-pul.html을 로컬 서버(Live Server 등)로 실행
2. drawing-pad.html, yeon-focus-tracker.js, problemBank.js 같은 폴더에 위치
3. 브라우저 DevTools 콘솔 열어두고 전체 탭 순서대로 클릭
4. 그림판 버튼 → 모달 열림 확인
5. QR 버튼 → QR 생성 확인
6. 60초 방치 → YeonFocus 팝업 확인
7. 오프라인 모드(DevTools → Network → Offline) → 핵심 기능 동작 확인
```

---

## 8. 배포 후 예정 작업 (참고)

- Firebase Auth 연동 (현재 localStorage 기반)
- 토스페이먼츠 결제 연동
- 선생님 대시보드 연동
- 연플래너(hub) ↔ 수풀(spoke) 데이터 싱크

---

*이 의뢰서와 함께 압축된 파일 전체를 점검해 주세요.*
*문의: jinwooshon@gmail.com*
