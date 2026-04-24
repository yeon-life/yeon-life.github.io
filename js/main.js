/* ==========================================================================
   Y Life — 공통 동작 스크립트
   - 모바일 메뉴 토글
   - 스크롤 시 앱바 스타일 변경
   ========================================================================== */

(function () {
  'use strict';

  // 모바일 메뉴 드로어
  function setupMobileMenu() {
    const btn = document.querySelector('[data-menu-btn]');
    const drawer = document.querySelector('[data-mobile-drawer]');
    if (!btn || !drawer) return;

    btn.addEventListener('click', () => {
      drawer.classList.toggle('open');
    });

    // 링크 클릭 시 자동으로 닫기
    drawer.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => drawer.classList.remove('open'));
    });
  }

  // 스크롤 감지 (선택적 효과용)
  function setupScrollEffects() {
    const appBar = document.querySelector('.app-bar');
    if (!appBar) return;

    const onScroll = () => {
      if (window.scrollY > 10) {
        appBar.classList.add('scrolled');
      } else {
        appBar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function init() {
    setupMobileMenu();
    setupScrollEffects();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
