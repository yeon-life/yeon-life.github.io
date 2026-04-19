/* ==========================================================================
   Y Life — 사용자 맞춤형 UI 적응 로직 (Adaptive UI)
   연(緣) 철학: "스스로 그러함" — 사용자 흐름에 따라 자연스럽게 적응

   작동:
   1) 4 관문 카드 클릭 빈도를 LocalStorage에 기록
   2) 누적 클릭 임계치 이상이 되면 자주 찾는 순으로 카드 자동 재배치
   3) 최다 방문 카드에 은은한 "자주 찾으심" 배지
   4) 재배치 후 하단에 투명성 안내 노트 ("처음으로" 초기화 링크)
   5) 연의 도구들(연플래너·수풀AI·스무고개·연그림도구)도 같은 방식 적용

   바닐라 JS · 외부 라이브러리 없음 · 서버 없음 · 100% 클라이언트
   데이터 저장 위치: 사용자 브라우저의 LocalStorage (`yLife_user_stats`)
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'yLife_user_stats';
  const VERSION = '1.0.0';

  // 임계치 (디자인 무결성 유지를 위해 신중하게 설정)
  const REORDER_THRESHOLD = 5;  // 총 클릭 5회 이상이면 재배치 시작
  const BADGE_THRESHOLD = 3;    // 단일 항목 3회 이상 방문 시 배지
  const REORDER_DELTA = 2;      // 1위와 2위 차이가 2 이상일 때만 재배치 (잦은 변동 방지)

  // ==========================================================================
  // 데이터 입출력
  // ==========================================================================
  function getStats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveStats(stats) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {}
  }

  function track(categoryKey) {
    const stats = getStats();
    stats[categoryKey] = (stats[categoryKey] || 0) + 1;
    stats._lastVisit = Date.now();
    saveStats(stats);
  }

  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    location.reload();
  }

  function getKeyFromCard(card, prefix) {
    // 카드의 영문 태그나 이름을 안정적인 키로 변환
    const tag = card.querySelector('.gate-en, .tool-num, .tool-name');
    const label = card.querySelector('h3, .tool-name');
    const id = (tag && tag.textContent) || (label && label.textContent) || '';
    return prefix + '_' + id.trim().toLowerCase().replace(/\s+/g, '-');
  }

  // ==========================================================================
  // 클릭 추적 바인딩
  // ==========================================================================
  function wireTracking() {
    // 4 관문
    document.querySelectorAll('.gates .gate-card').forEach((card) => {
      const key = getKeyFromCard(card, 'gate');
      card.dataset.adaptiveKey = key;
      card.addEventListener('click', () => track(key), { passive: true });
    });

    // 연의 도구들
    document.querySelectorAll('.tools-grid .tool-card').forEach((card) => {
      const key = getKeyFromCard(card, 'tool');
      card.dataset.adaptiveKey = key;
      card.addEventListener('click', () => track(key), { passive: true });
    });

    // 최근 칼럼
    document.querySelectorAll('.columns-grid .column-card').forEach((card, i) => {
      const title = card.querySelector('.col-title');
      const key = 'column_' + ((title && title.textContent) || 'untitled').trim().toLowerCase().slice(0, 32);
      card.dataset.adaptiveKey = key;
      card.addEventListener('click', () => track(key), { passive: true });
    });
  }

  // ==========================================================================
  // 그리드 재배치 (4 관문 · 도구들)
  // ==========================================================================
  function reorderGrid(selector, keyPrefix) {
    const container = document.querySelector(selector);
    if (!container) return { reordered: false, topCard: null, topCount: 0 };

    const cards = Array.from(container.children).filter(
      (el) => el.classList.contains('gate-card') || el.classList.contains('tool-card')
    );
    if (cards.length === 0) return { reordered: false, topCard: null, topCount: 0 };

    const stats = getStats();
    const scored = cards.map((card) => {
      const key = card.dataset.adaptiveKey || getKeyFromCard(card, keyPrefix);
      const count = stats[key] || 0;
      return { card, count, key };
    });

    const totalVisits = scored.reduce((s, x) => s + x.count, 0);
    if (totalVisits < REORDER_THRESHOLD) {
      return { reordered: false, topCard: null, topCount: 0, totalVisits };
    }

    // 현재 순서 그대로 복사해서 기준 삼기
    const originalOrder = scored.map((s, i) => ({ ...s, origIdx: i }));
    const sorted = [...originalOrder].sort((a, b) => b.count - a.count);

    // 1위와 2위 차이가 너무 작으면 재배치 안 함 (잔잔함 유지)
    if (sorted.length >= 2 && (sorted[0].count - sorted[1].count) < REORDER_DELTA) {
      // 배지만 줄 수 있음
      return {
        reordered: false,
        topCard: sorted[0].card,
        topCount: sorted[0].count,
        totalVisits,
      };
    }

    // 이미 정렬된 상태면 재배치 스킵
    const alreadyOrdered = sorted.every((s, i) => s.origIdx === i);
    if (alreadyOrdered) {
      return {
        reordered: false,
        topCard: sorted[0].card,
        topCount: sorted[0].count,
        totalVisits,
      };
    }

    // 부드러운 전환: fade out → 재배치 → fade in
    container.style.transition = 'opacity 0.45s ease';
    container.style.opacity = '0';

    setTimeout(() => {
      sorted.forEach((s) => container.appendChild(s.card));
      requestAnimationFrame(() => {
        container.style.opacity = '1';
      });
    }, 450);

    return {
      reordered: true,
      topCard: sorted[0].card,
      topCount: sorted[0].count,
      totalVisits,
    };
  }

  // ==========================================================================
  // 배지 표시 (최다 방문 카드에)
  // ==========================================================================
  function showFrequentBadge(card) {
    if (!card) return;
    if (card.querySelector('.ad-freq-badge')) return;
    const stats = getStats();
    const key = card.dataset.adaptiveKey;
    if (!key || (stats[key] || 0) < BADGE_THRESHOLD) return;

    const badge = document.createElement('span');
    badge.className = 'ad-freq-badge';
    badge.textContent = '자주 찾으심';
    badge.style.cssText = [
      'position: absolute',
      'top: 14px',
      'right: 14px',
      "font-family: 'Playfair Display', serif",
      'font-size: 0.66rem',
      'letter-spacing: 0.18em',
      'text-transform: none',
      'color: #B08E61',
      'padding: 3px 9px',
      'border: 1px solid rgba(176, 142, 97, 0.5)',
      'background: rgba(176, 142, 97, 0.06)',
      'pointer-events: none',
      'opacity: 0',
      'transition: opacity 0.6s ease 0.8s',
    ].join(';');

    // 카드가 position 상대가 아니면 보정
    const cs = window.getComputedStyle(card);
    if (cs.position === 'static') card.style.position = 'relative';

    card.appendChild(badge);
    requestAnimationFrame(() => {
      badge.style.opacity = '1';
    });
  }

  // ==========================================================================
  // 투명성 안내 노트
  // ==========================================================================
  function showAdaptiveNote(container, totalVisits) {
    if (!container) return;
    if (container.parentElement.querySelector('.ad-note')) return;
    if (totalVisits < REORDER_THRESHOLD) return;

    const note = document.createElement('div');
    note.className = 'ad-note';
    note.style.cssText = [
      'text-align: center',
      "font-family: 'Playfair Display', serif",
      'font-size: 0.7rem',
      'letter-spacing: 0.22em',
      'color: #B08E61',
      'margin-top: 28px',
      'font-style: italic',
      'opacity: 0',
      'transition: opacity 0.9s ease 1.2s',
    ].join(';');
    note.innerHTML =
      '✿ 당신이 자주 찾으시는 순서로 인사드려요 · ' +
      '<a href="#" class="ad-reset" style="color: inherit; border-bottom: 1px dotted; padding-bottom: 1px;">처음으로</a>';

    container.parentElement.insertBefore(note, container.nextSibling);

    note.querySelector('.ad-reset').addEventListener('click', (e) => {
      e.preventDefault();
      reset();
    });

    requestAnimationFrame(() => {
      note.style.opacity = '0.8';
    });
  }

  // ==========================================================================
  // 초기화
  // ==========================================================================
  function init() {
    wireTracking();

    // 관문 재배치
    const gateResult = reorderGrid('.gates', 'gate');
    if (gateResult.topCard) showFrequentBadge(gateResult.topCard);
    if (gateResult.totalVisits) {
      const gatesContainer = document.querySelector('.gates');
      showAdaptiveNote(gatesContainer, gateResult.totalVisits);
    }

    // 도구들 재배치
    const toolResult = reorderGrid('.tools-grid', 'tool');
    if (toolResult.topCard) showFrequentBadge(toolResult.topCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==========================================================================
  // 공개 API
  // ==========================================================================
  window.YLifeAdaptive = {
    version: VERSION,
    track: track,
    getStats: getStats,
    reset: reset,
    // 디버깅용: 데모 데이터 주입
    _seedDemo: function () {
      saveStats({
        gate_witnessing: 8,
        gate_thinking: 3,
        gate_guiding: 5,
        gate_connecting: 1,
        tool_02: 4,
        tool_01: 2,
        _lastVisit: Date.now(),
      });
      location.reload();
    },
  };

  // 콘솔 도장
  try {
    console.log(
      '%c緣 %cYLife Adaptive UI v' + VERSION + ' · 재배치 활성',
      'color: #5D4037; font-family: serif; font-size: 16px; font-weight: 700;',
      'color: #B08E61; font-size: 11px;'
    );
  } catch (e) {}
})();
