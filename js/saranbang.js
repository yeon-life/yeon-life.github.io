/* ==========================================================================
   Y Life — 緣의 사랑방 프런트엔드 스켈레톤
   - 입력 후 다섯 겹 응답을 순차적으로 드러냄
   - 플로팅 버튼 + 모달 동작
   - 텍스트영역 자동 확장
   ========================================================================== */

(function () {
  'use strict';

  function autoResize(textarea) {
    textarea.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
  }

  function revealLayers(container) {
    const layers = container.querySelectorAll('.layer');
    layers.forEach((l) => l.classList.remove('show'));
    container.classList.add('active');
    layers.forEach((l, i) => {
      setTimeout(() => l.classList.add('show'), 300 + i * 400);
    });
  }

  function scrollToContainer(container) {
    setTimeout(() => {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }

  // 메인 섹션 (인라인 사랑방)
  function bindMainSarangbang() {
    const form = document.querySelector('[data-saranbang-form]');
    if (!form) return;
    const textarea = form.querySelector('textarea');
    if (textarea) autoResize(textarea);

    const container = document.querySelector('[data-saranbang-responses]');
    if (!container) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = (textarea.value || '').trim();
      if (!q && !container.classList.contains('active')) {
        // 질문 없이도 일단 한 번 볼 수 있게 (데모 목적)
      }
      revealLayers(container);
      scrollToContainer(container);
    });
  }

  // 모달 응답 영역 템플릿 복제
  function cloneResponsesForModal() {
    const main = document.querySelector('[data-saranbang-responses]');
    const modalResp = document.querySelector('[data-saranbang-modal-responses]');
    if (!main || !modalResp) return;
    if (modalResp.children.length === 0) {
      modalResp.innerHTML = main.innerHTML;
    }
  }

  // 플로팅 버튼 + 모달
  function bindFloating() {
    const btn = document.querySelector('[data-saranbang-float]');
    const modal = document.querySelector('[data-saranbang-modal]');
    if (!btn || !modal) return;

    const closeBtn = modal.querySelector('[data-saranbang-close]');
    const modalForm = modal.querySelector('form');
    const modalTextarea = modal.querySelector('textarea');
    if (modalTextarea) autoResize(modalTextarea);
    const modalResp = modal.querySelector('[data-saranbang-modal-responses]');

    function open() {
      cloneResponsesForModal();
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => modalTextarea && modalTextarea.focus(), 180);
    }
    function close() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      if (modalResp) {
        modalResp.classList.remove('active');
        modalResp.querySelectorAll('.layer').forEach((l) => l.classList.remove('show'));
      }
      if (modalTextarea) modalTextarea.value = '';
    }

    btn.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });

    modalForm && modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      revealLayers(modalResp);
    });
  }

  function init() {
    bindMainSarangbang();
    bindFloating();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
