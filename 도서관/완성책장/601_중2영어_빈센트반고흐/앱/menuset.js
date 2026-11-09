/* 메뉴판셋 v1.1 (연수학꾸러미 공용) — ☰ 상단 메뉴판 · ⚙ 우측 상단 옵션 · 왼쪽 목차 패널
 * v1.1 (2026-11-05) : «보기 전환 쪽»(.magazine-section[id] + goSection) 갈래 추가 — 월간지(사진의 결)용 · data-ms-title / data-ms-home / data-ms-home-label 로 제목·돌아갈 곳 지정. 기존 꾸러미 쪽 동작은 그대로.
 * 페이지 구조(대문 .unit-card / 단원 li.card·.subunit-card / .stage-section)를 읽어 목차를 스스로 만든다.
 * 학생 이름·책 이름을 쓰지 않는다(화면 제목은 페이지의 h1 그대로). 서버 신호 없음. 기록은 이 기기 localStorage 에만.
 * 표준: _규칙\개념북_제작표준 §2 · 연수학꾸러미_표준 §2. 한 곳(공용부품\메뉴판셋)에서 고치고 tool 로 각 꾸러미에 복사한다. */
(function () {
  "use strict";
  if (window.__메뉴판셋) return;
  window.__메뉴판셋 = "1.1";

  var LS = "menuset.v1";
  function load() { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {} }
  var pref = load();

  var IC = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    left: '<path d="M15 18l-6-6 6-6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="7"/><path d="M6 17H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    note: '<path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h5"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'
  };
  function svg(n) { return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || "") + "</svg>"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  var CSS = [
    ":root{--ms-ink:#2a2e2c;--ms-pri:#0f766e;--ms-pri-dk:#115e59;--ms-bg:#f3faf8;--ms-line:#c7e6e0;--ms-card:#fff}",
    "html[data-ms-dark='1']{filter:invert(1) hue-rotate(180deg)}",
    "html[data-ms-dark='1'] img,html[data-ms-dark='1'] video,html[data-ms-dark='1'] iframe,html[data-ms-dark='1'] canvas,html[data-ms-dark='1'] svg image{filter:invert(1) hue-rotate(180deg)}",
    ".ms-btn{position:fixed;top:10px;z-index:9000;width:44px;height:44px;border-radius:8px;border:1px solid var(--ms-line);background:var(--ms-card);color:var(--ms-pri-dk);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(42,46,44,.14);padding:0}",
    ".ms-btn:hover,.ms-btn:focus-visible{background:var(--ms-bg);outline:2px solid var(--ms-pri);outline-offset:1px}",
    "#ms-menu-btn{left:10px}#ms-opt-btn{right:10px}",
    "#ms-rail{position:fixed;left:0;top:0;bottom:0;width:64px;background:var(--ms-bg);border-right:1px solid var(--ms-line);z-index:8990;overflow:hidden;transition:width .18s ease,box-shadow .18s,transform .18s;color:var(--ms-ink);font-family:'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif;font-size:14px;line-height:1.4}",
    "#ms-rail:hover,#ms-rail:focus-within,#ms-rail.open{width:340px;overflow-y:auto;box-shadow:4px 0 24px rgba(42,46,44,.18)}",
    "#ms-rail .ms-top{height:64px;display:flex;align-items:center;gap:14px;padding:0 21px;white-space:nowrap;color:var(--ms-pri-dk);font-weight:700;font-size:15px}",
    "#ms-rail .ms-lb{opacity:0;transition:opacity .12s;white-space:nowrap}#ms-rail:hover .ms-lb,#ms-rail:focus-within .ms-lb,#ms-rail.open .ms-lb{opacity:1}",
    "#ms-rail .ms-body{display:none;padding:0 12px 24px}#ms-rail:hover .ms-body,#ms-rail:focus-within .ms-body,#ms-rail.open .ms-body{display:block}",
    "#ms-rail .ms-pos{margin:0 4px 8px;padding:8px 10px;background:var(--ms-card);border:1px solid var(--ms-line);border-radius:12px;font-size:13px}",
    "#ms-rail .ms-pos b{display:block;color:var(--ms-pri-dk);font-size:14px}",
    "#ms-rail .ms-nav{display:flex;gap:6px;margin:0 4px 8px}#ms-rail .ms-nav button{flex:1;min-height:44px;border:1px solid var(--ms-line);border-radius:8px;background:var(--ms-card);color:var(--ms-ink);font:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px}",
    "#ms-rail .ms-nav button:disabled{opacity:.4;cursor:default}",
    "#ms-rail .ms-sec{margin:10px 4px 2px;font-size:12px;font-weight:700;color:var(--ms-pri);letter-spacing:.02em}",
    "#ms-rail a.ms-it{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;color:var(--ms-ink);text-decoration:none;min-height:44px;cursor:pointer}",
    "#ms-rail a.ms-it:hover{background:var(--ms-line)}#ms-rail a.ms-it.on{background:var(--ms-pri-dk);color:#fff;font-weight:700}",
    "#ms-rail a.ms-it .ms-no{flex:0 0 auto;min-width:24px;font-size:12px;opacity:.75}",
    "#ms-rail .ms-sub{display:none;padding-left:26px}#ms-rail .ms-grp.on .ms-sub{display:block}",
    "#ms-rail .ms-sub a.ms-it{min-height:36px;padding:4px 10px;font-size:13px}",
    "#ms-veil{display:none;position:fixed;inset:0;background:rgba(42,46,44,.35);z-index:8980}#ms-veil.on{display:block}",
    "#ms-opt{display:none;position:fixed;top:60px;right:10px;width:288px;max-width:calc(100vw - 20px);background:var(--ms-card);color:var(--ms-ink);border:1px solid var(--ms-line);border-radius:12px;box-shadow:0 8px 28px rgba(42,46,44,.22);z-index:9100;padding:12px;font-family:'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif;font-size:14px}",
    "#ms-opt.on{display:block}#ms-opt h3{margin:0 0 8px;font-size:15px;color:var(--ms-pri-dk);display:flex;justify-content:space-between;align-items:center}",
    "#ms-opt .ms-row{margin:8px 0}#ms-opt .ms-row>span{display:block;font-size:12px;font-weight:700;color:var(--ms-pri);margin-bottom:4px}",
    "#ms-opt .ms-seg{display:flex;gap:6px}#ms-opt button.ms-o{flex:1;min-height:44px;border:1px solid var(--ms-line);border-radius:8px;background:var(--ms-card);color:var(--ms-ink);font:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;padding:4px 8px}",
    "#ms-opt button.ms-o[aria-pressed='true']{background:var(--ms-pri-dk);color:#fff;border-color:var(--ms-pri-dk)}",
    "#ms-opt a.ms-o{flex:1;min-height:44px;border:1px solid var(--ms-line);border-radius:8px;color:var(--ms-ink);text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px}",
    "#ms-opt .ms-x{border:0;background:transparent;width:44px;height:44px;margin:-8px -8px -8px 0;cursor:pointer;color:var(--ms-ink)}",
    "body.ms-pad{padding-top:56px}","@media (min-width:900px){body.ms-pad{padding-left:64px}}",
    "@media (max-width:899px){#ms-rail{transform:translateX(-100%);width:min(86vw,340px)}#ms-rail.open{transform:none;overflow-y:auto}#ms-rail:hover{width:min(86vw,340px)}#ms-menu-btn{left:10px}}",
    "@keyframes msled{0%,100%{opacity:1}50%{opacity:.2}}",
    "#ms-opt-btn.ms-led::after{content:'';position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px 1px rgba(34,197,94,.85);animation:msled 1.4s ease-in-out infinite}",
    "#ms-install.ms-led-in::before{content:'';display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:7px;background:#22c55e;box-shadow:0 0 6px 1px rgba(34,197,94,.85);animation:msled 1.4s ease-in-out infinite}",
    "@media (prefers-reduced-motion:reduce){#ms-opt-btn.ms-led::after,#ms-install.ms-led-in::before{animation:none}}",
    "@media print{#ms-rail,#ms-menu-btn,#ms-opt-btn,#ms-opt,#ms-veil{display:none!important}body.ms-pad{padding-left:0!important;padding-top:0!important}}"
  ].join("\n");

  /* ── 페이지 읽기 ─────────────────────────────────────── */
  function pageKind() {
    if (document.querySelector(".magazine-section[id]")) return "views";
    if (document.querySelector("#subunits-root")) return "unit";
    if (document.querySelector(".unit-card[onclick], .unit-list .unit-card")) return "gate";
    return "other";
  }
  function bookTitle() {
    var t = document.querySelector("[data-ms-title]");
    if (t) return t.getAttribute("data-ms-title");
    var h = document.querySelector("header h1, h1");
    return txt(h) || document.title || "영어 예술가 교재 1";
  }
  function homeLabel() { var h = document.querySelector("[data-ms-home-label]"); return h ? h.getAttribute("data-ms-home-label") : "교재 처음"; }
  function homeHref() {
    var d = document.querySelector("[data-ms-home]");
    if (d) return d.getAttribute("data-ms-home");
    if (pageKind() === "views") return null;
    var a = document.querySelector('a[href="../index.html"], a[href^="../index.html?"]');
    if (a) return a.getAttribute("href");
    return document.querySelector(".unit-card") ? null : null;
  }
  function cardTitle(li) {
    var t = li.querySelector(".ttl");
    if (t) return txt(t);
    var h = li.querySelector("h2, h3, summary, .t, button");
    return txt(h).slice(0, 40);
  }
  function stageList(li) {
    var out = [];
    li.querySelectorAll(".stage-section[id], .test-section[id], section[id]").forEach(function (s) {
      var h = s.querySelector("h2, h3");
      var name = txt(h).replace(/\s*(핵심 강의.*|문제지.*|확인.*)?$/, "");
      var full = txt(h);
      var m = full.match(/^[①②③④⑤⑥⑦⑧]\s*[^\s]+(?:\s[^\s]+)?/);
      name = m ? m[0] : full.slice(0, 14);
      if (!m && s.classList.contains("test-section")) name = "⑥ 테스트";
      if (name) out.push({ id: s.id, name: name });
    });
    return out;
  }
  function activeCard() {
    var c = document.querySelector("#subunits-root > li.on, #subunits-root > li.open, #subunits-root > li.active");
    if (c) return c;
    var all = document.querySelectorAll("#subunits-root > li.card");
    for (var i = 0; i < all.length; i++) { if (all[i].querySelector(".hold") && all[i].offsetHeight > 160) return all[i]; }
    return all[0] || null;
  }
  function openCard(li) {
    if (!li) return;
    var code = (li.id || "").replace(/^(subunit-card|card)-/, "");
    try { if (typeof window.switchSubunit === "function") { window.switchSubunit(code); return; } } catch (e) {}
    var b = li.querySelector("button.hit, button.sub-tab-btn, .hit");
    if (b && !li.classList.contains("on")) b.click();
  }
  function goto(el) {
    if (!el) return;
    setTimeout(function () { try { el.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { el.scrollIntoView(); } }, 60);
  }

  /* ── 만들기 ─────────────────────────────────────────── */
  function build() {
    var kind = pageKind();
    var style = document.createElement("style"); style.id = "ms-style"; style.textContent = CSS; document.head.appendChild(style);
    document.body.classList.add("ms-pad");

    var menuBtn = el("button", { id: "ms-menu-btn", className: "ms-btn", type: "button", title: "목차", "aria-label": "목차 열기" }, svg("menu"));
    var optBtn = el("button", { id: "ms-opt-btn", className: "ms-btn", type: "button", title: "옵션", "aria-label": "옵션 열기" }, svg("gear"));
    var veil = el("div", { id: "ms-veil" });
    var rail = el("nav", { id: "ms-rail", "aria-label": "목차" });
    var opt = el("div", { id: "ms-opt", role: "dialog", "aria-label": "옵션" });
    document.body.appendChild(rail); document.body.appendChild(veil); document.body.appendChild(menuBtn); document.body.appendChild(optBtn); document.body.appendChild(opt);

    var top = '<div class="ms-top"><span>' + svg("menu") + '</span><span class="ms-lb">목차</span></div>';
    var body = '<div class="ms-body" id="ms-body"></div>';
    rail.innerHTML = top + body;
    var bodyEl = rail.querySelector("#ms-body");

    var html = '<div class="ms-pos"><span class="ms-lb">' + esc(bookTitle()) + '</span><b id="ms-where">학습 단계</b></div>';
    html += '<div class="ms-nav"><button type="button" id="ms-prev">' + svg("left") + '이전</button><button type="button" id="ms-next">다음' + svg("right") + "</button></div>";

    var home = homeHref();
    if (kind === "unit") {
      html += '<div class="ms-sec">처음으로</div>';
      if (home) html += '<a class="ms-it" href="' + esc(home) + '">' + svg("home") + "<span>전체 목록</span></a>";
      var ord = document.querySelector(".order-panel, #top-fold-panel");
      if (ord) html += '<a class="ms-it" data-t="order">' + svg("list") + "<span>순서표 · 다음에 할 일</span></a>";
    } else if (kind === "views") {
      var secs = Array.prototype.slice.call(document.querySelectorAll(".magazine-section[id]"));
      var secTitle = function (s, i) { if (i === 0) return "표지 · 목차"; var h = s.querySelector(".sec-header h2, h2"); return txt(h).slice(0, 40) || s.id; };
      var secIndex = function () { for (var k = 0; k < secs.length; k++) { if (secs[k].classList.contains("active")) return k; } return 0; };
      var showSec = function (k) {
        if (k < 0 || k >= secs.length) return;
        if (typeof window.goSection === "function") window.goSection(secs[k].id);
        else { secs.forEach(function (s, j) { s.classList.toggle("active", j === k); }); window.scrollTo(0, 0); }
        setTimeout(markV, 40);
      };
      var markV = function () {
        var k = secIndex();
        bodyEl.querySelectorAll("a.ms-it[data-v]").forEach(function (a) { a.classList.toggle("on", +a.getAttribute("data-v") === k); });
        var w = rail.querySelector("#ms-where"); if (w) w.textContent = (k + 1) + "/" + secs.length + " · " + secTitle(secs[k], k);
        rail.querySelector("#ms-prev").disabled = k <= 0;
        rail.querySelector("#ms-next").disabled = k >= secs.length - 1;
      };
      html += '<div class="ms-sec">읽을거리</div>';
      secs.forEach(function (s, i) { html += '<a class="ms-it" data-v="' + i + '">' + (i === 0 ? svg("home") : "") + "<span>" + esc(secTitle(s, i)) + "</span></a>"; });
      bodyEl.innerHTML = html;
      bodyEl.addEventListener("click", function (e) {
        var a = e.target.closest("a.ms-it[data-v]"); if (!a) return; e.preventDefault();
        showSec(+a.getAttribute("data-v")); closeRail();
      });
      rail.querySelector("#ms-prev").addEventListener("click", function () { showSec(secIndex() - 1); });
      rail.querySelector("#ms-next").addEventListener("click", function () { showSec(secIndex() + 1); });
      try { var mo = new MutationObserver(markV); secs.forEach(function (s) { mo.observe(s, { attributes: true, attributeFilter: ["class"] }); }); } catch (x) {}
      markV();
    } else {
      /* 그 밖의 쪽: 제목(h2/h3 + id 또는 .stage-section[id])로 목차 */
      html += '<div class="ms-sec">학습 순서</div>';
      var hs = document.querySelectorAll(".stage-section[id], .sv-unit[id], main h2[id], h2[id], section[id] > h2");
      var seenIds = {};
      hs.forEach(function (el) {
        var sec = el.classList.contains("stage-section") ? el : el.closest(".stage-section") || (el.parentElement && el.parentElement.id ? el.parentElement : el);
        var id = sec.id || el.id;
        if (!id || seenIds[id]) return;
        seenIds[id] = true;
        var h = sec.querySelector("h2, h3") || el;
        var tt = txt(h);
        html += '<a class="ms-it" data-h="' + esc(id) + '"><span>' + esc(tt.slice(0, 36)) + "</span></a>";
      });
      bodyEl.innerHTML = html;
      rail.querySelector("#ms-where").textContent = "학습 순서 목차";
      rail.querySelector("#ms-prev").style.display = "none"; rail.querySelector("#ms-next").style.display = "none";
      bodyEl.addEventListener("click", function (e) { var a = e.target.closest("a.ms-it[data-h]"); if (!a) return; e.preventDefault(); goto(document.getElementById(a.getAttribute("data-h"))); closeRail(); });
    }

    /* ── 옵션 ⚙ ─────────────────────────────────────── */
    var optHtml = '<h3>옵션<button type="button" class="ms-x" id="ms-optx" aria-label="닫기">' + svg("close") + "</button></h3>" +
      '<div class="ms-row"><span>글자 크기</span><div class="ms-seg" id="ms-fs"><button type="button" class="ms-o" data-v="1">보통</button><button type="button" class="ms-o" data-v="1.12">크게</button><button type="button" class="ms-o" data-v="1.25">더 크게</button></div></div>' +
      '<div class="ms-row"><span>화면 색</span><div class="ms-seg"><button type="button" class="ms-o" id="ms-dk" aria-pressed="false">어둡게 보기</button></div></div>' +
      '<div class="ms-row"><span>인쇄 (원본 인쇄 / 절약 인쇄)</span><div class="ms-seg"><button type="button" class="ms-o" id="ms-p1">' + svg("print") + '원본 인쇄</button><button type="button" class="ms-o" id="ms-p2">절약 인쇄</button></div></div>';
    var PW = window.KkureomiPWA;
    if (PW && !PW.standalone) {
      optHtml += '<div class="ms-row" id="ms-pwa-row"><span>앱</span><div class="ms-seg"><button type="button" class="ms-o" id="ms-install">앱으로 설치하기</button></div><p id="ms-pwa-note" style="display:none;margin:6px 2px 0;font-size:13px;line-height:1.5;color:#5a6a6e"></p></div>';
    }
    opt.innerHTML = optHtml;
    var LEDK = "menuset.install.seen";
    function ledSeen() { try { return !!localStorage.getItem(LEDK); } catch (e) { return false; } }
    function ledOn() { return !!(PW && !PW.standalone && (PW.canInstall || PW.ios) && !ledSeen()); }
    function ledRefresh() {
      optBtn.classList.toggle("ms-led", ledOn());
      var b0 = opt.querySelector("#ms-install"); if (b0) b0.classList.toggle("ms-led-in", ledOn());
    }
    if (PW && !PW.standalone) {
      var ib = opt.querySelector("#ms-install"), nt = opt.querySelector("#ms-pwa-note");
      var guide = function () {
        return PW.ios ? "아이폰·아이패드: Safari 아래쪽 공유 단추(네모에서 화살표가 위로)를 누르고 «홈 화면에 추가»를 고르세요." : "주소창 오른쪽의 «설치» 아이콘, 또는 브라우저 메뉴(⋮)의 «앱 설치»·«홈 화면에 추가»를 누르세요.";
      };
      ib.addEventListener("click", function () {
        try { localStorage.setItem(LEDK, "1"); } catch (e) {} ledRefresh();
        if (PW.canInstall) { PW.install().then(function (o) { if (o === "accepted") { nt.style.display = "block"; nt.textContent = "설치했어요! 홈 화면(또는 바탕화면)에서 «영어 예술가 교재 1»을 눌러 열어요."; } }); return; }
        nt.style.display = nt.style.display === "block" ? "none" : "block"; nt.textContent = guide();
      });
      PW.onchange(function () { if (PW.standalone) { var r = opt.querySelector("#ms-pwa-row"); if (r) r.remove(); } ledRefresh(); });
      ledRefresh();
    }

    function applyFs(v) {
      var t = document.querySelector("body > .wrap") || document.body;
      t.style.zoom = v && +v !== 1 ? v : "";
      opt.querySelectorAll("#ms-fs button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === String(v))); });
    }
    function applyDk(on) {
      if (on) document.documentElement.setAttribute("data-ms-dark", "1"); else document.documentElement.removeAttribute("data-ms-dark");
      opt.querySelector("#ms-dk").setAttribute("aria-pressed", String(!!on));
    }
    applyFs(pref.fs || "1"); applyDk(!!pref.dk);
    opt.querySelector("#ms-fs").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; pref.fs = b.getAttribute("data-v"); save(pref); applyFs(pref.fs); });
    opt.querySelector("#ms-dk").addEventListener("click", function () { pref.dk = !pref.dk; save(pref); applyDk(pref.dk); });
    opt.querySelector("#ms-p1").addEventListener("click", function () { opt.classList.remove("on"); setTimeout(function () { window.print(); }, 50); });
    opt.querySelector("#ms-p2").addEventListener("click", function () {
      opt.classList.remove("on");
      setTimeout(function () { if (typeof window.ecoPrint === "function") window.ecoPrint(); else { document.body.classList.add("eco"); window.print(); setTimeout(function () { document.body.classList.remove("eco"); }, 800); } }, 50);
    });

    function closeRail() { rail.classList.remove("open"); veil.classList.remove("on"); }
    function toggleRail() { var o = rail.classList.toggle("open"); veil.classList.toggle("on", o && window.innerWidth < 900); opt.classList.remove("on"); }
    function toggleOpt() { opt.classList.toggle("on"); }
    menuBtn.addEventListener("click", toggleRail);
    optBtn.addEventListener("click", toggleOpt);
    opt.querySelector("#ms-optx").addEventListener("click", function () { opt.classList.remove("on"); });
    veil.addEventListener("click", closeRail);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeRail(); opt.classList.remove("on"); } });
    document.addEventListener("click", function (e) { if (opt.classList.contains("on") && !opt.contains(e.target) && e.target !== optBtn && !optBtn.contains(e.target)) opt.classList.remove("on"); });
  }

  function el(tag, attrs, inner) {
    var e = document.createElement(tag);
    for (var k in attrs) { if (k === "className") e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (inner) e.innerHTML = inner;
    return e;
  }

  function start() {
    try { build(); } catch (err) { if (window.console) console.error("메뉴판셋", err); }
  }
  function ready() {
    var CARD = "#subunits-root > li.card, #subunits-root > li.subunit-card";
    if (document.getElementById("subunits-root") && !document.querySelector(CARD)) {
      var n = 0, t = setInterval(function () { n++; if (document.querySelector(CARD) || n > 60) { clearInterval(t); start(); } }, 100);
    } else start();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
})();
