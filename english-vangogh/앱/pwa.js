/* 연수학꾸러미 앱 설치(PWA) 도우미 v1.0
 * 각 꾸러미 hub\ 폴더에 manifest.webmanifest · sw.js · 아이콘과 함께 놓인다(공용부품\메뉴판셋\pwa 가 정본 · pwa_달기.py 가 복사).
 * 하는 일: ① 서비스워커 등록 ② 설치 단추용 상태 제공(window.KkureomiPWA) ③ 머리 태그가 빠진 쪽에 보충.
 * 서버 신호·학생 정보 없음. 서비스워커는 이 꾸러미 폴더(scope) 안만 다룬다. */
(function () {
  "use strict";
  if (window.KkureomiPWA) return;
  var cs = document.currentScript;
  var base = cs && cs.src ? new URL(".", cs.src).href : location.href;

  function isStandalone() {
    try { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; } catch (e) { return false; }
  }
  function isIOS() {
    var ua = navigator.userAgent || "";
    return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  var P = window.KkureomiPWA = {
    base: base, deferred: null, canInstall: false, standalone: isStandalone(), ios: isIOS(), listeners: [],
    onchange: function (fn) { P.listeners.push(fn); },
    install: function () {
      if (!P.deferred) return Promise.resolve("none");
      P.deferred.prompt();
      return P.deferred.userChoice.then(function (r) { P.deferred = null; P.canInstall = false; notify(); return r && r.outcome; });
    }
  };
  /* 앱 아이콘 배지(숫자·점) — 운영체제가 그린다(깜박임은 못 정함). 지원 안 하면 조용히 넘어간다. */
  P.badge = function (n) {
    try {
      n = +n || 0;
      if (n > 0 && navigator.setAppBadge) navigator.setAppBadge(n).catch(function () {});
      else if (n <= 0 && navigator.clearAppBadge) navigator.clearAppBadge().catch(function () {});
    } catch (e) {}
  };
  /* «다 본 것» 목록을 서비스워커가 읽을 수 있게 캐시 저장소에 거울로 둔다 */
  P.mirrorSeen = function (map) {
    try {
      if (!window.caches) return;
      caches.open("kkstate:" + base).then(function (c) { return c.put(base + "seen.json", new Response(JSON.stringify(map || {}), { headers: { "Content-Type": "application/json" } })); }).catch(function () {});
    } catch (e) {}
  };
  function notify() { P.listeners.forEach(function (f) { try { f(P); } catch (e) {} }); }

  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); P.deferred = e; P.canInstall = true; notify(); });
  window.addEventListener("appinstalled", function () { P.deferred = null; P.canInstall = false; P.standalone = true; notify(); });

  function ensureHead() {
    var h = document.head;
    if (!document.querySelector('link[rel="manifest"]')) { var l = document.createElement("link"); l.rel = "manifest"; l.href = base + "manifest.webmanifest"; h.appendChild(l); }
    if (!document.querySelector('meta[name="theme-color"]')) { var m = document.createElement("meta"); m.name = "theme-color"; m.content = "#115e59"; h.appendChild(m); }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) { var a = document.createElement("link"); a.rel = "apple-touch-icon"; a.href = base + "apple-touch-icon.png"; h.appendChild(a); }
    [["apple-mobile-web-app-capable", "yes"], ["mobile-web-app-capable", "yes"], ["apple-mobile-web-app-title", "영어 예술가 교재 1"]].forEach(function (kv) {
      if (!document.querySelector('meta[name="' + kv[0] + '"]')) { var x = document.createElement("meta"); x.name = kv[0]; x.content = kv[1]; h.appendChild(x); }
    });
  }
  ensureHead();

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", function () {
      try {
        navigator.serviceWorker.register(base + "sw.js", { scope: base }).then(function () { return navigator.serviceWorker.ready; }).then(function (reg) {
          if (reg && reg.periodicSync && navigator.permissions) {
            navigator.permissions.query({ name: "periodic-background-sync" }).then(function (s) {
              if (s.state === "granted") reg.periodicSync.register("kkureomi-new", { minInterval: 12 * 3600 * 1000 }).catch(function () {});
            }).catch(function () {});
          }
        }).catch(function () {});
      } catch (e) {}
    });
  }
})();
