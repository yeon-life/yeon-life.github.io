# 챗봇 백엔드 배포 안내

> 연라이프(y-life.kr) 챗봇 — Cloudflare Workers + Gemini API

---

## 필요 환경 변수 (Cloudflare Dashboard → Workers → Settings → Variables)

| 변수명 | 종류 | 설명 |
|---|---|---|
| `GEMINI_API_KEY` | Secret | Google Gemini API 키 (본점만 보관) |
| `CACHE_KV` | KV Binding | 질문-응답 캐시 (1시간) |
| `RATE_LIMIT_KV` | KV Binding | IP별 분당 요청 수 추적 |
| `SUBSCRIPTION_KV` | KV Binding | 구독 토큰 저장 (24h TTL) |
| `SUBSCRIBER_CODES_KV` | KV Binding | 유효 구독 코드 목록 |

---

## KV Namespace 생성 (Cloudflare 대시보드)

1. Cloudflare 대시보드 → Workers & Pages → KV
2. "Create a Namespace" 클릭
3. 다음 4개를 각각 생성:
   - `ylife-chat-cache`
   - `ylife-rate-limit`
   - `ylife-subscription`
   - `ylife-subscriber-codes`
4. 각 namespace ID를 wrangler.toml의 [[kv_namespaces]] 에 입력

---

## wrangler.toml KV 바인딩 추가 (생성 후)

```toml
[[kv_namespaces]]
binding = "CACHE_KV"
id = "여기에_namespace_ID_입력"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "여기에_namespace_ID_입력"

[[kv_namespaces]]
binding = "SUBSCRIPTION_KV"
id = "여기에_namespace_ID_입력"

[[kv_namespaces]]
binding = "SUBSCRIBER_CODES_KV"
id = "여기에_namespace_ID_입력"
```

---

## 환경 변수 등록 (터미널)

```bash
wrangler secret put GEMINI_API_KEY --env production
```

---

## 구독 코드 등록 방법 (SUBSCRIBER_CODES_KV)

KV에 직접 키-값 입력:
- 키: `390000` (6자리 구독 코드)
- 값(JSON):
```json
{
  "tier": "subscriber",
  "expiresAt": "2027-12-31T23:59:59Z"
}
```

Cloudflare 대시보드 → KV → `ylife-subscriber-codes` → Add entry

---

## 배포 명령

```bash
# 로그인 (최초 1회)
wrangler login

# 프로덕션 배포
wrangler deploy --env production

# 개발 환경 테스트
wrangler dev
```

---

## 엔드포인트 목록

| 경로 | 메서드 | 기능 |
|---|---|---|
| `/api/chat` | POST | 챗봇 대화 |
| `/api/subscription/verify` | POST | 구독 코드 검증 |
| `/api/health` | GET | 서비스 상태 확인 |

---

## 클라이언트 호출 주의사항

- `tier` 값은 클라이언트에서 `localStorage` 구독 토큰 유무로 자동 판별
- 토큰은 서버 검증 후 받은 값만 사용 (클라이언트 임의 생성 불가)
- CORS는 `y-life.kr` 도메인만 허용됨 (로컬 개발 시 `wrangler dev` 사용)
