/* 연수학꾸러미 «학습 활동 기록» 공용 부품 v2 (2026-11-07 연소사 «학생이 어떤 기록을 하더라도 서버에 기록이 되게 해서, 내가 학생들의 학습 사항을 알 수 있어야 해»)
 · 학생이 이 꾸러미에서 남기는 «모든 기록»(본 횟수·이해도·회독 체크·영상 본 횟수·점수·푼 답·서술·일지·열람)을 기기(localStorage)에 쓰는 즉시 서버(student_marks/{uid}__{pid}.known)로 올린다.
 · 올리는 방법 : 짧은 값(40자 이하)은 키마다 따로, 긴 글은 `_long`(JSON) 한 칸에 모아서(서버 규칙 «known 400칸 이하» 안에서).
 · 서버 규칙은 student_marks 를 학생 본인만 쓰고 선생님만 읽게 해 둔다(규칙 변경 없음). 이 기기에서 로그인한 학생이 아니면 올라가지 않는다(student-gate.js 가 맡음).
 · 올리지 않는 것 : 로그인·토큰·비밀번호·기기 설정 같은 이름의 키(EXCL).
 · student-gate.js 보다 «먼저» 싣는다(window.__AS_STORE 를 게이트가 store 로 쓴다).
 설정(선택) : window.ACTIVITY_PREFIXES = ['명제허브/']  (이 꾸러미가 localStorage 에 쓰는 이름의 앞머리들. 옛 설정 window.ACTIVITY_PREFIX 도 읽는다) */
(function () {
  var PFXS = window.ACTIVITY_PREFIXES || [window.ACTIVITY_PREFIX || 'eng-gogh/'];
  var EXCL = /(token|passw|pwd|secret|auth|login|firebase|student-gate|yk_|^known$|__as|sw-|install)/i;
  var LONG_MAX = 600000, N_MAX = 360;
  function allowed(k) {
    if (typeof k !== 'string' || EXCL.test(k)) return false;
    for (var i = 0; i < PFXS.length; i++) if (k.indexOf(PFXS[i]) === 0) return true;
    return false;
  }
  function fk(k) { return k.replace(/\//g, '|').replace(/\./g, '·'); }   // 서버 칸 이름(빗금·점 없이)
  var applying = false, t = null;

  function build() {
    var known = {}, longs = {}, n = 0, size = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!allowed(k)) continue;
        var v = localStorage.getItem(k);
        if (v === null) continue;
        if (v.length <= 40 && n < N_MAX) { known[fk(k)] = /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v; n++; }
        else if (size + v.length + k.length < LONG_MAX) { longs[k] = v; size += v.length + k.length; }
      }
    } catch (e) {}
    if (size) known._long = JSON.stringify(longs);
    known._t = Date.now();            // 마지막으로 바꾼 때(선생님이 «꾸준히 하나» 보는 데 쓴다)
    return known;
  }
  function put(k, sv) {                // 서버에서 온 값 합치기: 숫자는 큰 쪽, 없던 것은 채움
    var cur = localStorage.getItem(k);
    if (cur === null || cur === '') { localStorage.setItem(k, String(sv)); return; }
    if (typeof sv === 'number' && /^-?\d+(\.\d+)?$/.test(cur) && sv > Number(cur)) localStorage.setItem(k, String(sv));
  }
  function apply(v) {
    if (!v) return;
    applying = true;
    try {
      // 칸 이름의 «|»·«·» 는 원래 키로 되돌릴 수 없어 localStorage 쪽 키 목록과 맞춰 본다
      var map = {};
      for (var i = 0; i < localStorage.length; i++) { var lk = localStorage.key(i); if (allowed(lk)) map[fk(lk)] = lk; }
      Object.keys(v).forEach(function (kk) {
        if (kk === '_t' || kk === '_long') return;
        var k = map[kk] || kk.replace(/\|/g, '/').replace(/·/g, '.');
        if (allowed(k)) put(k, v[kk]);
      });
      if (typeof v._long === 'string') {
        var L = JSON.parse(v._long);
        Object.keys(L).forEach(function (k) { if (allowed(k)) { var c = localStorage.getItem(k); if (c === null || c === '') localStorage.setItem(k, L[k]); } });
      }
    } catch (e) {}
    applying = false;
  }
  var store = { get: function (k, d) { return k === 'known' ? build() : d; }, set: function (k, v) { if (k === 'known') apply(v); } };
  window.__AS_STORE = store;

  function schedule() { if (applying) return; clearTimeout(t); t = setTimeout(function () { try { store.set('known', build()); } catch (e) {} }, 600); }
  try {
    var _set = Storage.prototype.setItem, _rm = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (k) {
      _set.apply(this, arguments);
      try { if (this === window.localStorage && allowed(k)) schedule(); } catch (e) {}
    };
    Storage.prototype.removeItem = function (k) {
      _rm.apply(this, arguments);
      try { if (this === window.localStorage && allowed(k)) schedule(); } catch (e) {}
    };
  } catch (e) {}

  // ① 숫자 올리기/내리기(학생이 직접 누르는 «본 횟수»)
  function bump(key, delta, max) {
    var cur = 0; try { cur = parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch (e) {}
    var v = Math.max(0, Math.min(max || 999, cur + delta));
    try { localStorage.setItem(key, String(v)); } catch (e) {}
    return v;
  }
  // ② 열어 본 횟수(링크를 누르면 +1 — 같은 자료는 30초 안에 또 눌러도 한 번)
  var 마지막 = {};
  var KIND = [[/book\/index\.html/, '개념북'], [/복습\//, '복습'], [/golttae|골때/, '골때'], [/문제지\//, '문제지'], [/y-life\.kr\/jdb/, '비법서'],
              [/특강\//, '강의'], [/yeon-math-book\.web\.app\/고1_/, '교과서'], [/만지는수학\//, '만지는수학'], [/wangsu|왕수/, '왕수']];
  function codeNear(a) { var m = (a.closest && a.closest('[id^="unit-"],[id^="sub-"],[data-code],[id^="card-"]')); var id = m ? (m.getAttribute('data-code') || m.id || '') : '';
    var c = /\d\d-\d/.exec(id) || /\d\d-\d/.exec(a.getAttribute('onclick') || '') || /[#=?&]c?(\d\d-\d)/.exec(a.getAttribute('href') || '');
    return c ? (c[1] || c[0]) : (window.location.hash.replace('#', '').match(/\d\d-\d/) || ['00-0'])[0]; }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
    var h = a.getAttribute('href') || ''; var kind = null;
    for (var i = 0; i < KIND.length; i++) if (KIND[i][0].test(h)) { kind = KIND[i][1]; break; }
    if (!kind) return;
    var key = PFXS[0] + (PFXS[0].slice(-1) === '/' ? '' : '/') + codeNear(a) + '/열람/' + kind, now = Date.now();
    if (now - (마지막[key] || 0) < 30000) return; 마지막[key] = now; bump(key, 1);
  }, true);

  window.ActivitySync = { bump: bump, build: build, apply: apply, allowed: allowed, PFX: PFXS[0], PFXS: PFXS };
})();
