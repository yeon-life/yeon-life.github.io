# 챗봇 클라이언트 연동 예시

> `시안_v5_통합.html` 챗봇 박스에서 `/api/chat` 를 호출하는 방법

---

## 1. 구독 상태 판별 함수

```javascript
// localStorage 구독 토큰을 확인해 tier 를 자동 결정
function getChatTier() {
  const token     = localStorage.getItem('ylife_sub_token');
  const expiresAt = localStorage.getItem('ylife_sub_expires');

  if (token && expiresAt && new Date(expiresAt) > new Date()) {
    return { tier: 'subscriber', token };
  }
  return { tier: 'free', token: null };
}
```

---

## 2. 챗봇 메시지 전송 함수

```javascript
async function sendChatMessage(userMessage, conversationHistory) {
  const { tier, token } = getChatTier();

  // 대화 히스토리에 새 메시지 추가
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, tier }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '일시적인 오류가 발생했습니다.');
  }

  const data = await res.json();
  // data.reply      — 응답 텍스트
  // data.truncated  — true면 무료 한도로 잘린 것 (구독 안내 포함됨)
  return data;
}
```

---

## 3. 구독 코드 검증 함수

```javascript
async function verifySubscriptionCode(code) {
  // 기기 식별자 생성 (없으면 새로 발급)
  let deviceId = localStorage.getItem('ylife_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('ylife_device_id', deviceId);
  }

  const res = await fetch('/api/subscription/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, deviceId }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || '코드를 다시 확인해 주세요.');
  }

  // 토큰 저장 (24h)
  localStorage.setItem('ylife_sub_token',   data.token);
  localStorage.setItem('ylife_sub_expires', data.expiresAt);

  return data;
}
```

---

## 4. 챗봇 UI 통합 예시 (시안_v5_통합.html 삽입용)

```javascript
// 챗봇 박스의 전송 버튼 클릭 핸들러
async function onChatSend() {
  const input   = document.getElementById('chat-input');
  const userMsg = input.value.trim();
  if (!userMsg) return;

  input.value = '';
  appendMessage('user', userMsg);

  const loadingEl = appendMessage('assistant', '...');

  try {
    const { reply, truncated } = await sendChatMessage(userMsg, chatHistory);

    loadingEl.textContent = reply;
    chatHistory.push({ role: 'user',      content: userMsg });
    chatHistory.push({ role: 'assistant', content: reply  });

    // 대화 히스토리 최대 20개 유지 (컨텍스트 비용 절감)
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

  } catch (err) {
    loadingEl.textContent = err.message || '잠시 후 다시 시도해 주세요.';
  }
}

function appendMessage(role, text) {
  const el = document.createElement('div');
  el.className = `chat-bubble ${role}`;
  el.textContent = text;
  document.getElementById('chat-messages').appendChild(el);
  el.scrollIntoView({ behavior: 'smooth' });
  return el;
}

let chatHistory = [];
```

---

## 주의사항

- **tier 판별은 항상 클라이언트가 자동으로** — 사용자에게 "tier", "무료/유료" 같은 용어 노출 자제
- **토큰 만료 감지** — `ylife_sub_expires` 가 과거면 `tier='free'` 로 자동 전환됨
- **CORS** — `localhost` 에서 호출하면 CORS 오류 발생. 로컬 테스트는 `wrangler dev` 로 프록시 사용
- **대화 히스토리** — 최대 20개 메시지만 유지 (캐시 효율 + 비용 절감)
