/*!
 * Yeon Focus Tracker v1.0
 * 연 학습 공통 스킬 · 학생 집중도 감지
 * 웹캠 없이 마우스·키보드·스크롤 입력만으로 집중 상태 추정
 *
 * 사용법:
 *   <script src="yeon-focus-tracker.js"></script>
 *   <script>
 *     YeonFocus.init({ app:'영풀', student:'student-001', thresholdSeconds:30 });
 *   </script>
 *
 * Copyright (c) 2026 연소사(이진우) · 교육·비상업 자유
 */
(function(window) {
  'use strict';

  const STORAGE_KEY_PREFIX = 'yeon-focus-';

  const YeonFocus = {
    _config: {},
    _state: {
      lastInteraction: Date.now(),
      sessionStart: Date.now(),
      isFocused: true,
      events: [],
      focusLostCount: 0,
      totalIdleMs: 0,
      lastLostAt: null
    },
    _timerId: null,

    init(options) {
      this._config = Object.assign({
        app: 'yeon-app',
        student: 'anon',
        thresholdSeconds: 30,
        checkInterval: 3000,
        nudgeMessage: '잠깐, 아직 집중하고 계세요?',
        nudgeButton: '네, 계속 할게요',
        nudgeEmoji: '🙂',
        language: 'ko',
        onFocusLost: null,
        onFocusRegained: null,
        firebase: null,
        showNudge: true
      }, options || {});

      // 학생 ID 자동 로드 (영풀/수풀 공통 세션 키에서)
      if (this._config.student === 'anon') {
        try {
          const sess = JSON.parse(
            sessionStorage.getItem('yeon_session') ||
            localStorage.getItem('yeon_auto_login') || '{}'
          );
          if (sess && (sess.id || sess.memberId)) {
            this._config.student = sess.id || sess.memberId;
          }
        } catch(e){}
      }

      this._injectStyles();
      this._attachInteractionListeners();
      this._startChecking();
      this._logEvent('session_start');

      console.log('[YeonFocus] 초기화 완료 — app:' + this._config.app + ', threshold:' + this._config.thresholdSeconds + 's');
      return this;
    },

    _injectStyles() {
      if (document.getElementById('yeon-focus-styles')) return;
      const css = document.createElement('style');
      css.id = 'yeon-focus-styles';
      css.textContent = '' +
        '#yeon-focus-nudge{position:fixed;bottom:30px;right:30px;z-index:99999;display:none;animation:yfSlideUp .4s ease;}' +
        '#yeon-focus-nudge.on{display:block;}' +
        '.yeon-focus-bubble{background:#fff;border:2px solid #B08E61;padding:20px 24px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.15);font-family:"Noto Serif KR","Noto Sans KR",serif;max-width:300px;}' +
        '.yeon-focus-bubble p{margin:0 0 14px;font-size:.95rem;color:#1D1D1B;line-height:1.6;}' +
        '.yeon-focus-bubble .yf-emoji{font-size:1.4rem;margin-right:8px;}' +
        '.yeon-focus-bubble button{background:#5D4037;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-family:"Nanum Myeongjo","Noto Serif KR",serif;font-weight:700;font-size:.88rem;cursor:pointer;transition:background .2s;}' +
        '.yeon-focus-bubble button:hover{background:#B08E61;}' +
        '@keyframes yfSlideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}';
      document.head.appendChild(css);
    },

    _attachInteractionListeners() {
      const self = this;
      const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
      const handler = function() {
        const now = Date.now();
        if (!self._state.isFocused) {
          const idleMs = now - self._state.lastLostAt;
          self._state.totalIdleMs += idleMs;
          self._state.isFocused = true;
          self._hideNudge();
          self._logEvent('focus_regained');
          if (self._config.onFocusRegained) self._config.onFocusRegained();
        }
        self._state.lastInteraction = now;
      };
      events.forEach(function(e){ document.addEventListener(e, handler, { passive: true }); });
    },

    _startChecking() {
      const self = this;
      this._timerId = setInterval(function() {
        const elapsed = (Date.now() - self._state.lastInteraction) / 1000;
        if (elapsed >= self._config.thresholdSeconds && self._state.isFocused) {
          self._state.isFocused = false;
          self._state.focusLostCount += 1;
          self._state.lastLostAt = Date.now();
          if (self._config.showNudge) self._showNudge();
          self._logEvent('focus_lost', { after: Math.round(elapsed) });
          if (self._config.onFocusLost) self._config.onFocusLost();
        }
      }, this._config.checkInterval);
    },

    _showNudge() {
      let el = document.getElementById('yeon-focus-nudge');
      if (!el) {
        el = document.createElement('div');
        el.id = 'yeon-focus-nudge';
        el.innerHTML =
          '<div class="yeon-focus-bubble">' +
            '<p><span class="yf-emoji">' + this._config.nudgeEmoji + '</span>' + this._config.nudgeMessage + '</p>' +
            '<button onclick="YeonFocus.dismiss()">' + this._config.nudgeButton + '</button>' +
          '</div>';
        document.body.appendChild(el);
      } else {
        el.querySelector('p').innerHTML =
          '<span class="yf-emoji">' + this._config.nudgeEmoji + '</span>' + this._config.nudgeMessage;
      }
      el.classList.add('on');
    },

    _hideNudge() {
      const el = document.getElementById('yeon-focus-nudge');
      if (el) el.classList.remove('on');
    },

    dismiss() {
      this._state.lastInteraction = Date.now();
      if (!this._state.isFocused) {
        const idleMs = Date.now() - this._state.lastLostAt;
        this._state.totalIdleMs += idleMs;
        this._state.isFocused = true;
        this._hideNudge();
        this._logEvent('focus_regained');
        if (this._config.onFocusRegained) this._config.onFocusRegained();
      }
    },

    _logEvent(type, extra) {
      const event = Object.assign({
        type: type,
        at: Date.now(),
        app: this._config.app,
        student: this._config.student
      }, extra || {});
      this._state.events.push(event);
      try {
        const key = STORAGE_KEY_PREFIX + this._config.student;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(event);
        if (existing.length > 1000) existing.shift();
        localStorage.setItem(key, JSON.stringify(existing));
      } catch(e) {}
      if (this._config.firebase && window.firebase) {
        try {
          window.firebase.firestore().collection('yeon-focus-logs').add(event);
        } catch(e) {}
      }
    },

    getStats() {
      const duration = (Date.now() - this._state.sessionStart) / 1000;
      const idleSec = this._state.totalIdleMs / 1000;
      const focusSec = Math.max(0, duration - idleSec);
      const percent = duration > 0 ? Math.round((focusSec / duration) * 1000) / 10 : 100;
      return {
        sessionDuration: Math.round(duration),
        focusLostCount: this._state.focusLostCount,
        totalIdleSeconds: Math.round(idleSec),
        focusPercent: percent,
        isFocused: this._state.isFocused
      };
    },

    getHistory() {
      try {
        const key = STORAGE_KEY_PREFIX + this._config.student;
        return JSON.parse(localStorage.getItem(key) || '[]');
      } catch(e) { return []; }
    },

    reset() {
      try {
        const key = STORAGE_KEY_PREFIX + this._config.student;
        localStorage.removeItem(key);
      } catch(e) {}
      this._state = {
        lastInteraction: Date.now(),
        sessionStart: Date.now(),
        isFocused: true,
        events: [],
        focusLostCount: 0,
        totalIdleMs: 0,
        lastLostAt: null
      };
    },

    destroy() {
      if (this._timerId) clearInterval(this._timerId);
      this._hideNudge();
    }
  };

  window.YeonFocus = YeonFocus;
})(window);
