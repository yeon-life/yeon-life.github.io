# 수풀AI v4.5 배포·사용성 점검 수정 보고서

작성일: 2026-05-02

## 적용 기준

영풀 v4.5 배포 점검과 같은 기준으로, 원본 zip은 유지하고 별도 작업용 배포 폴더를 만들어 수정했습니다.

- 작업 폴더: `supul-v4.5-secure-api`
- 원본 보존: `수풀AI_v4.5_코덱스점검패키지.zip`
- 수정 범위: 배포 경로, PWA 시작 파일, 내부 링크, API 키 장기 저장 위험, 공개 시크릿, 잘못 섞인 영풀/영어 화면, 모바일 첫 화면

## 수정 완료

1. PWA 시작 파일 수정
   - `manifest.webmanifest`의 `start_url`을 `./gangdongwon.html`에서 `./su-pul.html`로 변경했습니다.

2. 첫 진입 파일 수정
   - `index.html` 자동 이동 및 noscript 링크를 `su-pul.html`로 변경했습니다.

3. 초등 저학년 화면 복귀 링크 수정
   - `lowgrade/index.html`의 깨진 `../deploy/index.html` 링크를 `../su-pul.html`로 변경했습니다.

4. API 키 저장 위험 완화
   - `su-pul.html`의 외부 AI 엔진 키는 `localStorage`에 장기 저장하지 않고 현재 탭의 `sessionStorage`와 메모리에서만 보관되도록 변경했습니다.
   - 기존 `localStorage`에 남아 있던 `supul_ai_engine.keys`는 최초 로드 시 세션 저장소로 옮긴 뒤 장기 저장소에서 제거되도록 했습니다.
   - `drawing-pad.html`의 Gemini 수식 인식 키도 같은 방식으로 현재 탭 세션 저장으로 변경했습니다.

5. PWA 파일 연결 보강
   - `su-pul.html`에 `manifest.webmanifest` 연결과 `sw.js` 등록을 추가했습니다.
   - `sw.js` 캐시 이름을 `supulai-v4.5-secure-api`로 올리고 핵심 파일을 프리캐시에 포함했습니다.

6. 공유 링크 위험 제거
   - 친구 초대 링크의 하드코딩된 `https://su-pul.netlify.app/gangdongwon.html`을 현재 배포 위치 기준의 `su-pul.html` 링크로 변경했습니다.

7. 공개 설정값 정리
   - `config.js`에 들어 있던 실제 Apps Script URL, 공유 시크릿, 관리자 진입 코드를 배포본에서 비웠습니다.
   - `su-pul.html`의 하드코딩된 Apps Script URL도 제거하고 `config.js`를 통해서만 읽도록 변경했습니다.
   - 관리자 화면은 관리자 코드가 비어 있으면 먼저 배포 환경 설정을 요구하도록 바꿨습니다.

8. 수풀/영풀 혼입 제거
   - `icon.svg`의 영풀/영어 문구를 수풀/수학 문구로 변경했습니다.
   - `parent.html`의 학부모 안내 제목과 핵심 문구를 수학 학습 기준으로 바꿨습니다.
   - `lowgrade/index.html`에 남아 있던 영풀 초등부 문구와 영어 학습 카드를 수풀AI 수학 안내로 바꿨습니다.
   - `lowgrade/grade2.html`, `grade3.html`, `grade4.html`은 영어 학습 화면이 직접 노출되지 않도록 수풀AI 메인으로 이동시켰습니다.

## 확인 결과

- `manifest.webmanifest` JSON 파싱 정상
- 로컬 내부 참조 누락 없음
- 실제 파일을 찾을 수 없는 `gangdongwon.html` 진입 참조 제거
- API 키를 `localStorage`에 직접 저장하거나 읽는 주요 경로 제거
- 주요 페이지 HTTP 응답 확인: `/`, `su-pul.html`, `admin.html`, `parent.html`, `drawing-pad.html`, `lowgrade/index.html`
- Chrome headless 기준 모바일 크기 첫 화면 렌더링 확인: 메인 화면, 초등부 안내 화면
- 공개 파일 안의 실제 Apps Script URL, 공유 시크릿, 기존 관리자 코드 제거 확인

## 남은 운영 주의

현재 패키지는 GitHub Pages 같은 정적 배포에서 첫 화면과 정적 흐름을 테스트할 수 있는 형태입니다. 다만 외부 AI API를 학생 앱 브라우저에서 직접 호출하는 구조 자체는 완전한 상용 보안 구조가 아니므로, 판매형 운영에서는 영풀과 동일하게 서버 프록시 또는 중앙 API 게이트웨이로 옮기는 것이 최종 권장입니다.

관리자/서버 동기화 기능은 공개 시크릿을 제거했기 때문에, 실제 운영 전에는 서버 쪽에서 인증을 처리하는 방식으로 다시 연결해야 합니다. 공개 HTML/JS에 관리자 코드나 서버 시크릿을 넣는 방식은 배포본에서 사용하지 않는 것이 안전합니다.
