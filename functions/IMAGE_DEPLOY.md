# 나노바나나 이미지 API 배포 안내
> 가이드북 §10-45 외주 하청 시스템 / 2026-05-20 작성

---

## 1. 생성된 파일 2개

| 파일 | 엔드포인트 | 용도 |
|------|-----------|------|
| `functions/api/image.js` | `POST /api/image` | Gemini 2.5 Flash Image 호출 + 사용 기록 |
| `functions/api/image_usage.js` | `GET /api/image/usage` | 오늘·이달·전체 사용량 조회 |

---

## 2. KV Namespace 1개 추가

`wrangler.toml` 에 다음을 추가합니다:

```toml
[[kv_namespaces]]
binding = "USAGE_KV"
id      = "여기에_KV_ID_입력"
```

KV namespace 생성 명령:
```bash
npx wrangler kv:namespace create "USAGE_KV"
```
명령 실행 후 출력된 id 를 wrangler.toml 에 붙여넣습니다.

---

## 3. 환경 변수 설정 (wrangler secret)

### 필수

```bash
# Google Gemini API 키 — Google AI Studio(aistudio.google.com)에서 발급
npx wrangler secret put GEMINI_IMAGE_API_KEY
```

### 선택 (인증·비용 조절용)

```bash
# 메인 클로드만 호출 가능하도록 하는 시크릿 문자열 (아무 문자열 직접 지정)
npx wrangler secret put CLAUDE_AGENT_TOKEN

# 일일 최대 호출 수 (기본 30)
npx wrangler secret put DAILY_LIMIT
# 입력 예: 30

# IP당 분당 최대 호출 수 (기본 5)
npx wrangler secret put RATE_LIMIT
# 입력 예: 5

# 이미지 1장 단가 원화 (기본 52)
npx wrangler secret put COST_PER_IMAGE_WON
# 입력 예: 52
```

---

## 4. wrangler.toml 갱신 예시 (기존 항목에 추가)

```toml
# 기존 CACHE_KV, RATE_LIMIT_KV 아래에 추가
[[kv_namespaces]]
binding = "USAGE_KV"
id      = "여기에_KV_ID_입력"
```

---

## 5. 배포 명령

```bash
cd C:\Claude\연라이프
npx wrangler deploy
```

---

## 6. 메인 클로드가 배포 후 호출할 엔드포인트 URL

```
POST https://연라이프-workers-도메인.workers.dev/api/image
GET  https://연라이프-workers-도메인.workers.dev/api/image/usage
```

실제 Workers 도메인은 `wrangler deploy` 완료 후 출력됩니다.

### 호출 예시 (메인 클로드가 내부적으로 사용)

```json
POST /api/image
{
  "prompt":     "한지 질감 위에 연필 드로잉 스타일로 책 표지...",
  "purpose":    "내 친구 인공지능 책자 1장 표지",
  "size":       "1024x1536",
  "auth_token": "CLAUDE_AGENT_TOKEN 에 등록한 값"
}
```

---

## 7. 기존 .env 키를 Workers 환경 변수로 옮기는 명령

로컬 `.env` 파일에 키가 있다면 다음 명령으로 Workers 비밀 변수로 이전합니다:

```bash
# .env 파일 예시 항목:
# GEMINI_IMAGE_API_KEY=AIza...

# Workers 비밀 변수로 등록 (입력 프롬프트가 뜨면 키 값을 붙여넣기)
npx wrangler secret put GEMINI_IMAGE_API_KEY

# 등록된 변수 목록 확인
npx wrangler secret list
```

---

## 8. 비용 가시화 (§10-45 의무 사항)

배포 후 메인 클로드가 이미지를 생성할 때마다 응답에 다음 정보가 포함됩니다:

```
cost_won:         52       ← 이 이미지 1장 비용
today_total_won:  156      ← 오늘 누적 비용
today_calls:      3        ← 오늘 호출 횟수
remaining_calls:  27       ← 오늘 남은 호출 수
```

메인 클로드는 이 정보를 받아 사용자에게 다음 형식으로 보고합니다:
```
🎨 나노바나나로 이미지 1장 생성 — 약 ₩52 (오늘 누적 ₩156 / 30회 한도 중 3회 사용)
```

---

## 9. 점검 체크리스트 (배포 전)

- [ ] `USAGE_KV` namespace 가 `wrangler.toml` 에 등록됐는가?
- [ ] `GEMINI_IMAGE_API_KEY` 가 `wrangler secret` 으로 등록됐는가?
- [ ] (선택) `CLAUDE_AGENT_TOKEN` 이 등록됐는가?
- [ ] `wrangler deploy` 가 오류 없이 완료됐는가?
- [ ] `POST /api/image` 테스트 호출이 성공하는가?
- [ ] `GET /api/image/usage` 가 JSON 을 반환하는가?
