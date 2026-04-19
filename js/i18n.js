/* ==========================================================================
   Y Life — 다국어(i18n) 시스템
   - window.YLifeLocales에서 사전을 가져옴 (locales/locales.js 먼저 로드)
   - data-i18n="key.path" 로 텍스트 교체
   - data-i18n-html="key.path" 로 HTML(innerHTML) 교체 (조심)
   - data-i18n-attr="attr:key,attr2:key2" 로 속성 교체
   - 언어 전환 버튼: KO <-> EN
   ========================================================================== */

(function () {
  'use strict';

  const SUPPORTED_LANGS = ['ko', 'en'];
  const DEFAULT_LANG = 'ko';

  function detectLang() {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('lang');
      if (q && SUPPORTED_LANGS.includes(q)) return q;
    } catch (e) {}
    const htmlLang = document.documentElement.lang;
    if (htmlLang && SUPPORTED_LANGS.includes(htmlLang.split('-')[0])) return htmlLang.split('-')[0];
    return DEFAULT_LANG;
  }

  function getByPath(obj, path) {
    return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined) ? acc[k] : undefined, obj);
  }

  function getDict(lang) {
    if (!window.YLifeLocales) return null;
    return window.YLifeLocales[lang] || window.YLifeLocales[DEFAULT_LANG] || null;
  }

  function applyTranslations(dict) {
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = getByPath(dict, key);
      if (value !== undefined) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      const value = getByPath(dict, key);
      if (value !== undefined) el.innerHTML = value;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const config = el.getAttribute('data-i18n-attr');
      config.split(',').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        const value = getByPath(dict, key);
        if (value !== undefined) el.setAttribute(attr, value);
      });
    });

    const title = getByPath(dict, 'meta.title');
    if (title) document.title = title;

    const desc = getByPath(dict, 'meta.description');
    if (desc) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', desc);
    }

    document.documentElement.lang = (dict.meta && dict.meta.lang) || DEFAULT_LANG;

    document.querySelectorAll('[data-lang-toggle-label]').forEach((el) => {
      const current = (dict.meta && dict.meta.lang) || DEFAULT_LANG;
      el.textContent = current === 'ko' ? 'KOREAN / ENGLISH' : 'ENGLISH / KOREAN';
    });
  }

  function switchLang(nextLang) {
    if (!SUPPORTED_LANGS.includes(nextLang)) return;
    document.documentElement.setAttribute('data-switching', 'true');

    const dict = getDict(nextLang);
    if (dict) {
      applyTranslations(dict);
      try {
        const url = new URL(window.location.href);
        if (nextLang === DEFAULT_LANG) url.searchParams.delete('lang');
        else url.searchParams.set('lang', nextLang);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
    }

    requestAnimationFrame(() => {
      setTimeout(() => document.documentElement.removeAttribute('data-switching'), 120);
    });
  }

  function bindToggle() {
    document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.lang || DEFAULT_LANG;
        switchLang(current === 'ko' ? 'en' : 'ko');
      });
    });
  }

  function init() {
    const lang = detectLang();
    const dict = getDict(lang);
    if (dict) applyTranslations(dict);
    bindToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.YLifeI18n = { switchLang, detectLang };
})();
