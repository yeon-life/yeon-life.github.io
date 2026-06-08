/* ───────────────────────────────────────────────────────────────
   연라이프 안내 챗봇 "연이" · yeon-chatbot.js   (전 페이지 공통)
   ───────────────────────────────────────────────────────────────
   - 우측 하단 떠 있는 둥근 버튼(FAB) — 드래그해서 어디든 옮길 수 있음(위치 저장)
   - 누르면 채팅 패널 — 연라이프 안의 모든 것을 친절·상세히 안내
   - 음성 입력(연속 누적, 1.8초 무음 자동 종료)
   - 백엔드: POST /api/ai  { message, mode:'yeonlife' } → { text }
     (Vercel 서버리스 + Gemini. 키는 서버 환경변수에만 — 프론트 노출 없음)
   - 백엔드가 없으면(정적 호스팅) 깨지지 않고 안내 메시지로 폴백
   삽입: <script src="/yeon-chatbot.js" defer></script>  한 줄
   ─────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (window.__yeonChat) return; window.__yeonChat = true;

  var API = (window.YEON_CHAT_API || '/api/ai');
  var POSKEY = 'yeon_chat_fab_pos';
  var SVG = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };

  /* ── CSS ── */
  var css = document.createElement('style'); css.id = 'yeonChatCss';
  css.textContent = [
    '.yc-fab{position:fixed;right:20px;bottom:22px;width:58px;height:58px;border-radius:50%;z-index:9500;cursor:grab;border:none;',
    'background:linear-gradient(150deg,#2f5d62,#427a71);color:#fff;box-shadow:0 8px 22px rgba(20,40,40,.32);display:flex;align-items:center;justify-content:center;touch-action:none;transition:transform .15s,box-shadow .15s}',
    '.yc-fab:hover{transform:scale(1.06);box-shadow:0 10px 26px rgba(20,40,40,.4)}',
    '.yc-fab.drag{cursor:grabbing;transform:scale(1.04)}',
    '.yc-fab svg{width:26px;height:26px}',
    '.yc-fab .badge{position:absolute;top:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:#e2554a;border:2px solid #fff;display:none}',
    '.yc-fab .badge.on{display:block}',
    '.yc-panel{position:fixed;z-index:9499;width:min(94vw,366px);height:min(78vh,560px);background:#fffdf8;border:1px solid rgba(31,42,42,.12);border-radius:18px;',
    'box-shadow:0 18px 54px rgba(20,40,40,.30);display:none;flex-direction:column;overflow:hidden;font-family:Pretendard,system-ui,sans-serif}',
    '.yc-panel.on{display:flex}',
    '.yc-head{display:flex;align-items:center;gap:10px;padding:13px 14px;background:linear-gradient(150deg,#2f5d62,#427a71);color:#fff;cursor:grab}',
    '.yc-head.drag{cursor:grabbing}',
    '.yc-ava{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-family:"Noto Serif KR",serif;font-size:17px;flex:none}',
    '.yc-head .t{flex:1;line-height:1.25}.yc-head .t b{font-size:14.5px}.yc-head .t span{display:block;font-size:11px;opacity:.85}',
    '.yc-head .x{background:none;border:none;color:#fff;cursor:pointer;font-size:20px;line-height:1;padding:4px;border-radius:8px;opacity:.9}',
    '.yc-head .x:hover{background:rgba(255,255,255,.15)}',
    '.yc-body{flex:1;overflow-y:auto;padding:14px;background:#f7f4ee;display:flex;flex-direction:column;gap:10px}',
    '.yc-msg{max-width:84%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.62;white-space:pre-wrap;word-break:break-word}',
    '.yc-msg.ai{align-self:flex-start;background:#e7f0ec;color:#243a3a;border-bottom-left-radius:5px}',
    '.yc-msg.me{align-self:flex-end;background:#2f5d62;color:#fff;border-bottom-right-radius:5px}',
    '.yc-msg.ai a{color:#2f5d62;font-weight:700}',
    '.yc-msg.err{background:#fbeae8;color:#a23b30}',
    '.yc-load{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:#e7f0ec;border-radius:14px;border-bottom-left-radius:5px}',
    '.yc-load i{width:7px;height:7px;border-radius:50%;background:#7da89e;animation:ycb 1s infinite}',
    '.yc-load i:nth-child(2){animation-delay:.15s}.yc-load i:nth-child(3){animation-delay:.3s}',
    '@keyframes ycb{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}',
    '.yc-chips{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 8px;background:#f7f4ee}',
    '.yc-chips button{border:1px solid rgba(31,42,42,.14);background:#fffdf8;border-radius:999px;padding:6px 11px;font:inherit;font-size:12px;color:#3a4953;cursor:pointer}',
    '.yc-chips button:hover{border-color:#427a71;color:#2f5d62}',
    '.yc-in{display:flex;align-items:flex-end;gap:8px;padding:10px;border-top:1px solid rgba(31,42,42,.1);background:#fffdf8}',
    '.yc-in textarea{flex:1;border:1px solid rgba(31,42,42,.16);border-radius:12px;padding:9px 11px;font:inherit;font-size:14px;resize:none;max-height:96px;line-height:1.5;outline:none}',
    '.yc-in textarea:focus{border-color:#427a71}',
    '.yc-in button{flex:none;width:40px;height:40px;border-radius:11px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center}',
    '.yc-mic{background:#eef4f1;color:#2f5d62}.yc-mic.rec{background:#e2554a;color:#fff;animation:ycp 1s infinite}',
    '@keyframes ycp{50%{opacity:.6}}',
    '.yc-send{background:#2f5d62;color:#fff}.yc-send:hover{background:#274c50}',
    '.yc-toast{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:9600;background:#2f5d62;color:#fff;padding:9px 16px;border-radius:999px;font:600 13px Pretendard,sans-serif;box-shadow:0 8px 22px rgba(20,40,40,.3);display:none}',
    '.yc-toast.on{display:block}',
    '@media print{.yc-fab,.yc-panel,.yc-toast{display:none!important}}'
  ].join('');
  document.head.appendChild(css);

  /* ── 엘리먼트 ── */
  var fab = document.createElement('button');
  fab.className = 'yc-fab'; fab.setAttribute('aria-label', '연라이프 안내 챗봇 열기');
  fab.innerHTML = SVG('<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 11.5h7M8.5 14.5h4"/>') + '<span class="badge"></span>';
  document.body.appendChild(fab);

  var panel = document.createElement('div');
  panel.className = 'yc-panel';
  panel.innerHTML =
    '<div class="yc-head" id="ycHead"><div class="yc-ava">緣</div><div class="t"><b>연이</b><span>연라이프 안내 도우미</span></div><button class="x" id="ycClose" aria-label="닫기">×</button></div>' +
    '<div class="yc-body" id="ycBody"></div>' +
    '<div class="yc-chips" id="ycChips"></div>' +
    '<div class="yc-in"><textarea id="ycInput" rows="1" placeholder="연라이프에 대해 무엇이든 물어보세요"></textarea>' +
    '<button class="yc-mic" id="ycMic" aria-label="음성 입력">' + SVG('<path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10a7 7 0 0 1-14 0M12 17v4"/>') + '</button>' +
    '<button class="yc-send" id="ycSend" aria-label="보내기">' + SVG('<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>') + '</button></div>';
  document.body.appendChild(panel);

  var toast = document.createElement('div'); toast.className = 'yc-toast'; document.body.appendChild(toast);
  var toastT;
  function showToast(m) { toast.textContent = m; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('on'); }, 2000); }

  var body = panel.querySelector('#ycBody');
  var input = panel.querySelector('#ycInput');
  var chips = panel.querySelector('#ycChips');

  /* ── FAB 위치(저장) + 패널 위치 ── */
  function loadPos() { try { return JSON.parse(localStorage.getItem(POSKEY)); } catch (e) { return null; } }
  function savePos(p) { try { localStorage.setItem(POSKEY, JSON.stringify(p)); } catch (e) {} }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function applyFabPos() {
    var p = loadPos(); if (!p) return; // 기본 = CSS(right/bottom)
    fab.style.right = 'auto'; fab.style.bottom = 'auto';
    fab.style.left = clamp(p.x, 6, innerWidth - 64) + 'px';
    fab.style.top = clamp(p.y, 6, innerHeight - 64) + 'px';
  }
  function positionPanel() {
    var r = fab.getBoundingClientRect();
    var pw = Math.min(innerWidth * 0.94, 366), ph = Math.min(innerHeight * 0.78, 560);
    var left = r.right - pw; if (left < 8) left = 8; if (left + pw > innerWidth - 8) left = innerWidth - 8 - pw;
    var top = r.top - ph - 12; if (top < 8) top = r.bottom + 12; if (top + ph > innerHeight - 8) top = Math.max(8, innerHeight - 8 - ph);
    panel.style.left = left + 'px'; panel.style.top = top + 'px';
  }
  applyFabPos();
  window.addEventListener('resize', function () { applyFabPos(); if (panel.classList.contains('on')) positionPanel(); });

  /* ── 드래그 (FAB + 패널 헤더) ── */
  function makeDraggable(handle, moveFab) {
    var sx, sy, ox, oy, moved, dragging = false;
    handle.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.x')) return;
      dragging = true; moved = false; sx = e.clientX; sy = e.clientY;
      var r = fab.getBoundingClientRect(); ox = r.left; oy = r.top;
      handle.classList.add('drag'); handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      var nx = clamp(ox + dx, 6, innerWidth - 64), ny = clamp(oy + dy, 6, innerHeight - 64);
      fab.style.right = 'auto'; fab.style.bottom = 'auto'; fab.style.left = nx + 'px'; fab.style.top = ny + 'px';
      if (panel.classList.contains('on')) positionPanel();
    });
    handle.addEventListener('pointerup', function (e) {
      if (!dragging) return; dragging = false; handle.classList.remove('drag');
      var r = fab.getBoundingClientRect(); savePos({ x: r.left, y: r.top });
      if (!moved && handle === fab) toggle(); // FAB은 안 움직였으면 클릭으로 처리
    });
  }
  makeDraggable(fab, true);
  makeDraggable(panel.querySelector('#ycHead'), false);

  /* ── 채팅 ── */
  var history = [], busy = false, greeted = false;
  function addMsg(role, text) {
    var d = document.createElement('div'); d.className = 'yc-msg ' + role;
    if (role === 'ai') d.innerHTML = linkify(esc(text)); else d.textContent = text;
    body.appendChild(d); body.scrollTop = body.scrollHeight; return d;
  }
  function linkify(s) { return s.replace(/(https?:\/\/[^\s<]+)/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener">' + u + '</a>'; }); }
  function addLoading() { var d = document.createElement('div'); d.className = 'yc-load'; d.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(d); body.scrollTop = body.scrollHeight; return d; }

  var SUGGEST = ['연라이프가 뭐야?', '초대 필자가 누구야?', '잡지는 어떤 게 있어?', '윤창영 작가 블로그 알려줘'];
  function renderChips() { chips.innerHTML = SUGGEST.map(function (s) { return '<button>' + esc(s) + '</button>'; }).join(''); Array.prototype.forEach.call(chips.querySelectorAll('button'), function (b) { b.onclick = function () { input.value = b.textContent; send(); }; }); }

  function greet() {
    if (greeted) return; greeted = true;
    addMsg('ai', '안녕하세요 🌿 저는 연라이프 안내 도우미 연이예요.\n작가·기자, 블로그, 잡지 등 연라이프 안에서 궁금한 걸 무엇이든 친절히 알려드릴게요.');
    renderChips();
  }

  function send() {
    var q = (input.value || '').trim(); if (!q || busy) return;
    input.value = ''; input.style.height = 'auto';
    chips.innerHTML = '';
    addMsg('me', q); history.push({ role: 'user', text: q });
    busy = true; var load = addLoading();
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, mode: 'yeonlife' }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        load.remove(); busy = false;
        if (res.ok && res.j && res.j.text) { addMsg('ai', res.j.text); history.push({ role: 'ai', text: res.j.text }); }
        else { addMsg('err', (res.j && res.j.error) || '지금은 답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.'); }
      })
      .catch(function () {
        load.remove(); busy = false;
        addMsg('err', 'AI 도우미가 아직 연결되지 않았어요. (서버 연결 후 이용 가능)\n그동안 상단 메뉴나 "작가와 기자"에서 둘러보실 수 있어요.');
      });
  }

  /* ── 열고 닫기 ── */
  function open() { positionPanel(); panel.classList.add('on'); fab.querySelector('.badge').classList.remove('on'); greet(); setTimeout(function () { input.focus(); }, 50); }
  function close() { panel.classList.remove('on'); }
  function toggle() { panel.classList.contains('on') ? close() : open(); }
  panel.querySelector('#ycClose').onclick = close;
  panel.querySelector('#ycSend').onclick = send;
  input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(96, input.scrollHeight) + 'px'; });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('on')) close(); });

  /* ── 음성 입력 (연속 누적 + 1.8초 무음 자동 종료) ── */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var mic = panel.querySelector('#ycMic'), rec = null, recOn = false, finalText = '', silenceT;
  if (!SR) { mic.style.display = 'none'; }
  else mic.onclick = function () {
    if (recOn) { stopRec(); return; }
    try {
      rec = new SR(); rec.lang = 'ko-KR'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
      finalText = (input.value ? input.value + ' ' : '');
      rec.onresult = function (e) {
        var interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t; else interim += t;
        }
        input.value = (finalText + interim).trim();
        clearTimeout(silenceT); silenceT = setTimeout(stopRec, 1800);
      };
      rec.onerror = function (ev) { showToast(ev.error === 'not-allowed' ? '마이크 권한을 허용해 주세요' : '음성 인식 오류'); stopRec(); };
      rec.onend = function () { recOn = false; mic.classList.remove('rec'); var v = (finalText || input.value).trim(); if (v) { input.value = v; send(); } };
      rec.start(); recOn = true; mic.classList.add('rec'); showToast('듣고 있어요…');
    } catch (e) { showToast('음성 인식을 시작할 수 없어요'); }
  };
  function stopRec() { clearTimeout(silenceT); if (rec && recOn) { try { rec.stop(); } catch (e) {} } }
})();
