/* 영어 예술가 교재 1권(반 고흐) 서비스워커 v1.0 — 이 앱 폴더(scope) 안만 맡는다.
 * 화면·자료(.html .js .json .css)는 «네트워크 먼저»(항상 최신, 끊기면 마지막으로 본 것) · 아이콘·그림은 «캐시 먼저».
 */
var V = "eng-gogh-v1.4:" + self.registration.scope;
var CORE = ["./", "./index.html", "./manifest.webmanifest", "./data.js", "./app.js", "./app.css"];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(function (c) { return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); })); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf("eng-gogh-") === 0 && k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.indexOf(new URL(self.registration.scope).pathname) !== 0) return;
  var live = r.mode === "navigate" || /\.(html|js|json|css|webmanifest)$/i.test(u.pathname) || /\/$/.test(u.pathname);
  if (live) {
    e.respondWith(fetch(r).then(function (res) {
      if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); }
      return res;
    }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match("./index.html"); }); }));
  } else {
    e.respondWith(caches.match(r).then(function (m) {
      return m || fetch(r).then(function (res) {
        if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); }
        return res;
      });
    }));
  }
});
