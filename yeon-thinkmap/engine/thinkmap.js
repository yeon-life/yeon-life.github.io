/* ════════════════════════════════════════════════════════════════
   YeonThinkMap — 연 생각·학습 지도 엔진
   ────────────────────────────────────────────────────────────────
   광장 생각의 지도 / 학생 학습 지도 / 독서 지도 / 연플래너 등
   여러 도메인에서 공통으로 쓰이는 캔버스 기반 그래프 시각화.

   기본 사용법:
     YeonThinkMap.mount('#map', {
       nodes: [...],
       edges: [...],
       categories: {...},
       options: { title:'내 학습 지도', tagline:'내 생각을 키워보세요' },
       onNodeClick: (node) => {...}
     });

   백업·복원:
     map.export('json')   // JSON 문자열 반환
     map.export('md')     // Markdown 문자열 반환
     map.export('png')    // 캔버스 dataURL 반환
     map.import(jsonString, { mode:'merge' | 'replace' })

   상태 갱신 (망각곡선 등):
     map.refreshStates()  // mastery + 시간 → cat 자동 재분류
   ════════════════════════════════════════════════════════════════ */

(function (global) {
  'use strict';

  const VERSION = '1.0';
  const DEFAULT_CATEGORIES = {
    '새것':       { color: '#3aa0a8', label: '새것',       tooltip: '오늘 새로 만났구나' },
    '잘모름':     { color: '#c05040', label: '잘 모름',    tooltip: '여기 손볼 자리가 있구나' },
    '복습필요':   { color: '#c4923e', label: '복습 필요',  tooltip: '이거 잊고 있었네' },
    '완전학습':   { color: '#4a9060', label: '완전 학습',  tooltip: '여긴 든든하구나' },
    '응용':       { color: '#6858c0', label: '응용·연결',  tooltip: '다른 것과 이어졌구나' },
  };
  const ZOOM_MIN = 0.05, ZOOM_MAX = 16, ZOOM_STEP = 1.2;

  /* ──────────────────────────────────────────────────────────────
     숙달도·학습 상태 계산 (망각곡선 포함)
     ────────────────────────────────────────────────────────────── */
  const Mastery = {
    daysBetween(d1, d2) {
      return Math.max(0, (new Date(d2) - new Date(d1)) / (1000 * 60 * 60 * 24));
    },
    retention(daysSince, repetition) {
      const halfLife = 1 + Math.pow(repetition || 0, 0.6) * 3;
      return Math.exp(-daysSince / halfLife);
    },
    autoCat(node, now) {
      now = now || new Date().toISOString();
      const days = node.lastSeen ? Mastery.daysBetween(node.lastSeen, now) : 0;
      const m = node.mastery ?? 50;
      const attempts = node.attempts ?? 0;

      if (attempts <= 1 && days <= 3) return '새것';
      if (m < 40 && attempts >= 2) return '잘모름';
      if (m >= 80 && days <= 14) return '완전학습';
      if ((node.connections ?? 0) >= 5 && m >= 60) return '응용';
      return '복습필요';
    },
    autoSize(node) {
      const f = {
        attempts: Math.min(1, Math.sqrt(node.attempts || 0) / 5),
        importance: node.importance ?? 0.5,
        notes: Math.min(1, (node.notesLength || 0) / 500),
        connections: Math.min(1, (node.connections || 0) / 8),
        time: Math.min(1, (node.totalSeconds || 0) / 600),
      };
      const score = (
        f.attempts * 0.20 + f.importance * 0.30 +
        f.notes * 0.15 + f.connections * 0.20 + f.time * 0.15
      );
      return 0.5 + score * 1.5;
    },
  };

  /* ──────────────────────────────────────────────────────────────
     YeonThinkMap 클래스
     ────────────────────────────────────────────────────────────── */
  class YeonThinkMap {
    static mount(selector, config) {
      const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!el) throw new Error('[YeonThinkMap] container not found: ' + selector);
      return new YeonThinkMap(el, config || {});
    }

    constructor(container, config) {
      this.container = container;
      this.config = this._normalizeConfig(config);
      this.nodes = [];
      this.edges = [];
      this.state = {
        activeCat: 'all',
        search: '',
        hover: null,
        selected: null,
        view: { scale: 1, ox: 0, oy: 0 },
        tick: 0,
      };
      this._panState = null;
      this._touchState = null;
      this._animId = null;
      this._dpr = window.devicePixelRatio || 1;

      this._buildDOM();
      this._loadData();
      this._wireEvents();
      this._loop();
    }

    _normalizeConfig(c) {
      return {
        nodes: c.nodes || [],
        edges: c.edges || [],
        categories: c.categories || DEFAULT_CATEGORIES,
        options: Object.assign({
          title: '생각의 지도',
          tagline: '내 생각을 키워보세요',
          subtitle: '',
          showHeader: true,
          showLegend: true,
          showSearch: true,
          showStats: true,
          showZoom: true,
          showBackup: true,
          showCategoryFilters: true,
          autoCategorize: false,    // 자동 망각곡선 적용 여부
          autoSize: false,           // 자동 크기 계산 여부
          emptyMessage: '아직 생각이 모이지 않았습니다',
        }, c.options || {}),
        onNodeClick: c.onNodeClick || null,
        onEdgeClick: c.onEdgeClick || null,
        onExport: c.onExport || null,
        onImport: c.onImport || null,
      };
    }

    /* ── DOM 골격 만들기 ─────────────────────────────────────── */
    _buildDOM() {
      this.container.classList.add('ytm-root');
      const opt = this.config.options;
      const cats = this.config.categories;

      this.container.innerHTML = `
        ${opt.showHeader ? `
        <header class="ytm-header">
          <div class="ytm-brand-block">
            <div class="ytm-page-title">${escapeHtml(opt.title)}</div>
            ${opt.subtitle ? `<div class="ytm-page-sub">${escapeHtml(opt.subtitle)}</div>` : ''}
          </div>
          ${opt.showSearch ? `
          <div class="ytm-search">
            <span class="ytm-search-ico">⌕</span>
            <input class="ytm-search-input" type="text" placeholder="${escapeHtml(opt.tagline)}…" />
          </div>` : ''}
          ${opt.showCategoryFilters ? `
          <div class="ytm-filters">
            <button class="ytm-filter active" data-cat="all">전체</button>
            ${Object.entries(cats).map(([k]) => `
              <button class="ytm-filter" data-cat="${escapeHtml(k)}">${escapeHtml(k)}</button>`).join('')}
          </div>` : ''}
          ${opt.showStats ? `
          <div class="ytm-stats">
            <div class="ytm-stat"><span class="ytm-stat-num ytm-count-nodes">0</span><span>생각</span></div>
            <div class="ytm-stat"><span class="ytm-stat-num ytm-count-edges">0</span><span>연결</span></div>
          </div>` : ''}
          ${opt.showBackup ? `
          <div class="ytm-backup">
            <button class="ytm-backup-btn" title="내 지도 백업·복원">⤓</button>
            <div class="ytm-backup-menu" hidden>
              <button data-action="export-md">📝 Markdown (.md) — 옵시디언·노션·깃허브용</button>
              <button data-action="export-html">🌐 HTML (.html) — 모든 브라우저</button>
              <button data-action="export-doc">📄 Word (.doc) — 워드·한글</button>
              <button data-action="export-pdf">📕 PDF (.pdf) — 최종 보고서</button>
              <button data-action="export-json">📦 JSON (.json) — 완전 백업 / 재가져오기</button>
              <button data-action="export-vault">📚 옵시디언 vault — 도메인별 + index.md</button>
              <button data-action="export-png">🖼 PNG — 지도 화면 그림</button>
              <hr/>
              <button data-action="import">📂 JSON 가져오기…</button>
              <input type="file" accept="application/json" class="ytm-import-input" hidden />
              <hr/>
              <span class="ytm-backup-hint">여기서 쓴 모든 것은<br/>당신의 자산입니다<br/><small style="opacity:.6">내보내기 규칙 v1.1.10</small></span>
            </div>
          </div>` : ''}
        </header>` : ''}

        <div class="ytm-stage">
          <canvas class="ytm-canvas"></canvas>
        </div>

        <div class="ytm-empty-hint" hidden>
          <div class="ytm-empty-icon">◯</div>
          <div class="ytm-empty-text"></div>
        </div>

        ${opt.showLegend ? `
        <aside class="ytm-legend">
          <div class="ytm-legend-title">분류</div>
          <div class="ytm-legend-rows"></div>
        </aside>` : ''}

        ${opt.showZoom ? `
        <div class="ytm-zoom-hint">휠로 확대·축소 / 끌어서 이동</div>
        <div class="ytm-zoom">
          <button class="ytm-zoom-btn" data-z="in" title="확대 (+)">+</button>
          <div class="ytm-zoom-level">100%</div>
          <button class="ytm-zoom-btn" data-z="out" title="축소 (−)">−</button>
          <button class="ytm-zoom-btn" data-z="reset" title="원래대로 (0)">⊙</button>
        </div>` : ''}

        <aside class="ytm-detail" hidden>
          <button class="ytm-detail-close">×</button>
          <span class="ytm-detail-cat"></span>
          <h2 class="ytm-detail-title"></h2>
          <div class="ytm-detail-meta"></div>
          <div class="ytm-detail-mastery" hidden>
            <div class="ytm-mastery-label">숙달도</div>
            <div class="ytm-mastery-bar"><div class="ytm-mastery-fill"></div></div>
            <div class="ytm-mastery-num">0</div>
          </div>
          <p class="ytm-detail-body"></p>
          <div class="ytm-detail-related">
            <div class="ytm-detail-related-label">연결된 생각</div>
            <div class="ytm-detail-related-list"></div>
          </div>
          <div class="ytm-detail-actions"></div>
        </aside>

        <aside class="ytm-deep-detail" hidden>
          <button class="ytm-deep-back" title="요약 보기로" aria-label="요약 보기로">←</button>
          <button class="ytm-deep-close" title="닫기 (ESC)" aria-label="닫기">×</button>
          <span class="ytm-deep-cat"></span>
          <h2 class="ytm-deep-title"></h2>
          <div class="ytm-deep-meta"></div>
          <div class="ytm-deep-content"></div>
        </aside>

        ${opt.tagline ? `<footer class="ytm-footer">${escapeHtml(opt.tagline)}</footer>` : ''}
      `;

      // 자주 쓰는 노드 참조 미리 잡아두기
      this.$ = {
        canvas:       this.container.querySelector('.ytm-canvas'),
        search:       this.container.querySelector('.ytm-search-input'),
        filters:      this.container.querySelector('.ytm-filters'),
        countNodes:   this.container.querySelector('.ytm-count-nodes'),
        countEdges:   this.container.querySelector('.ytm-count-edges'),
        backupBtn:    this.container.querySelector('.ytm-backup-btn'),
        backupMenu:   this.container.querySelector('.ytm-backup-menu'),
        importInput:  this.container.querySelector('.ytm-import-input'),
        emptyHint:    this.container.querySelector('.ytm-empty-hint'),
        emptyText:    this.container.querySelector('.ytm-empty-text'),
        legendRows:   this.container.querySelector('.ytm-legend-rows'),
        zoomLevel:    this.container.querySelector('.ytm-zoom-level'),
        zoomHint:     this.container.querySelector('.ytm-zoom-hint'),
        detail:       this.container.querySelector('.ytm-detail'),
        deepDetail:   this.container.querySelector('.ytm-deep-detail'),
      };
      this.ctx = this.$.canvas.getContext('2d');

      if (this.$.emptyText) this.$.emptyText.textContent = this.config.options.emptyMessage;
      this._resize();
    }

    _resize() {
      const rect = this.$.canvas.getBoundingClientRect();
      this.W = rect.width;
      this.H = rect.height;
      this.$.canvas.width = this.W * this._dpr;
      this.$.canvas.height = this.H * this._dpr;
      this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    }

    /* ── 데이터 적재 ─────────────────────────────────────────── */
    _loadData() {
      const opts = this.config.options;
      this.edges = (this.config.edges || []).slice();

      this.nodes = (this.config.nodes || []).map((n, i) => {
        const node = Object.assign({}, n);

        // ID 자동 발급
        if (!node.id) node.id = 'n-' + (i + 1);

        // 자동 분류·크기 계산 (옵션 활성 시)
        if (opts.autoCategorize && node.mastery !== undefined) {
          node.cat = Mastery.autoCat(node);
        }
        if (opts.autoSize) {
          node.size = Mastery.autoSize(node);
        }

        // 기본 시각 속성
        const sizeR = node.size ?? node.r ?? 1.0;
        return Object.assign(node, {
          _x: (node.x ?? Math.random()) * this.W + (Math.random() - .5) * 12,
          _y: (node.y ?? Math.random()) * this.H + (Math.random() - .5) * 12,
          _vx: (Math.random() - .5) * .5,
          _vy: (Math.random() - .5) * .5,
          _radius: sizeR * 16,
        });
      });

      this._buildLegend();
      this._updateCounts();
    }

    /* ── 좌표 변환 ───────────────────────────────────────────── */
    _screenToWorld(sx, sy) {
      return { x: (sx - this.state.view.ox) / this.state.view.scale,
               y: (sy - this.state.view.oy) / this.state.view.scale };
    }
    _worldToScreen(wx, wy) {
      return { x: wx * this.state.view.scale + this.state.view.ox,
               y: wy * this.state.view.scale + this.state.view.oy };
    }
    _clampScale(s) { return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, s)); }
    _zoomAt(cx, cy, newScale) {
      newScale = this._clampScale(newScale);
      const before = this._screenToWorld(cx, cy);
      this.state.view.scale = newScale;
      this.state.view.ox = cx - before.x * newScale;
      this.state.view.oy = cy - before.y * newScale;
      this._updateZoomLevel();
    }
    _zoomBy(factor) { this._zoomAt(this.W / 2, this.H / 2, this.state.view.scale * factor); }
    _resetView() {
      this.state.view = { scale: 1, ox: 0, oy: 0 };
      this._updateZoomLevel();
    }
    _updateZoomLevel() {
      if (this.$.zoomLevel) this.$.zoomLevel.textContent = Math.round(this.state.view.scale * 100) + '%';
    }
    _flashZoomHint() {
      if (!this.$.zoomHint) return;
      this.$.zoomHint.classList.add('show');
      clearTimeout(this._zoomHintTimer);
      this._zoomHintTimer = setTimeout(() => this.$.zoomHint.classList.remove('show'), 1500);
    }

    /* ── 필터·검색·범례 ──────────────────────────────────────── */
    _filteredIds() {
      const ids = new Set();
      for (const n of this.nodes) {
        if (this.state.activeCat !== 'all' && n.cat !== this.state.activeCat) continue;
        if (this.state.search && !(n.label || '').toLowerCase().includes(this.state.search.toLowerCase())) continue;
        ids.add(n.id);
      }
      return ids;
    }
    _neighborIds(nodeId) {
      const set = new Set();
      for (const e of this.edges) {
        const a = e.from ?? e.a ?? e[0];
        const b = e.to ?? e.b ?? e[1];
        if (a === nodeId) set.add(b);
        if (b === nodeId) set.add(a);
      }
      return set;
    }
    _buildLegend() {
      if (!this.$.legendRows) return;
      const cats = this.config.categories;
      const counts = {};
      for (const k of Object.keys(cats)) counts[k] = 0;
      for (const n of this.nodes) counts[n.cat] = (counts[n.cat] || 0) + 1;

      this.$.legendRows.innerHTML = Object.entries(cats).map(([key, info]) => `
        <div class="ytm-legend-row" data-cat="${escapeHtml(key)}">
          <span class="ytm-legend-dot" style="background:${info.color};color:${info.color};"></span>
          <span class="ytm-legend-label" title="${escapeHtml(info.tooltip || '')}">${escapeHtml(info.label || key)}</span>
          <span class="ytm-legend-count">${counts[key] || 0}</span>
        </div>`).join('');
    }
    _updateCounts() {
      const ids = this._filteredIds();
      const visEdges = this.edges.filter(e => {
        const a = e.from ?? e.a ?? e[0];
        const b = e.to ?? e.b ?? e[1];
        return ids.has(a) && ids.has(b);
      });
      if (this.$.countNodes) this.$.countNodes.textContent = ids.size;
      if (this.$.countEdges) this.$.countEdges.textContent = visEdges.length;
    }
    _setActiveCat(cat) {
      this.state.activeCat = cat;
      this.container.querySelectorAll('.ytm-filter').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === cat);
      });
      this._updateCounts();
    }

    /* ── 이벤트 ──────────────────────────────────────────────── */
    _wireEvents() {
      const $ = this.$;
      const canvas = $.canvas;

      window.addEventListener('resize', () => this._resize());

      // 필터
      if ($.filters) $.filters.addEventListener('click', e => {
        const btn = e.target.closest('.ytm-filter');
        if (btn) this._setActiveCat(btn.dataset.cat);
      });
      // 검색
      if ($.search) $.search.addEventListener('input', e => {
        this.state.search = e.target.value.trim();
        this._updateCounts();
      });
      // 범례
      this.container.addEventListener('click', e => {
        const row = e.target.closest('.ytm-legend-row');
        if (row) {
          const cat = row.dataset.cat;
          this._setActiveCat(this.state.activeCat === cat ? 'all' : cat);
        }
      });

      // 줌 버튼
      this.container.addEventListener('click', e => {
        const z = e.target.closest('.ytm-zoom-btn');
        if (!z) return;
        if (z.dataset.z === 'in') this._zoomBy(ZOOM_STEP);
        else if (z.dataset.z === 'out') this._zoomBy(1 / ZOOM_STEP);
        else if (z.dataset.z === 'reset') this._resetView();
      });
      // 휠
      canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
        const factor = Math.exp(-e.deltaY * 0.0015);
        this._zoomAt(cx, cy, this.state.view.scale * factor);
        this._flashZoomHint();
      }, { passive: false });

      // 드래그 + 클릭
      canvas.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        const rect = canvas.getBoundingClientRect();
        this._panState = {
          sx: e.clientX - rect.left, sy: e.clientY - rect.top,
          ox: this.state.view.ox, oy: this.state.view.oy, moved: 0,
        };
        canvas.classList.add('panning');
      });
      window.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
        if (this._panState) {
          const dx = sx - this._panState.sx, dy = sy - this._panState.sy;
          this._panState.moved = Math.max(this._panState.moved, Math.abs(dx) + Math.abs(dy));
          this.state.view.ox = this._panState.ox + dx;
          this.state.view.oy = this._panState.oy + dy;
          return;
        }
        if (sx < 0 || sx > this.W || sy < 0 || sy > this.H) {
          this.state.hover = null;
          canvas.classList.remove('over-node');
          return;
        }
        const n = this._findNodeAt(sx, sy);
        this.state.hover = n;
        canvas.classList.toggle('over-node', !!n);
      });
      window.addEventListener('mouseup', e => {
        if (!this._panState) return;
        canvas.classList.remove('panning');
        if (this._panState.moved < 4) {
          const n = this._findNodeAt(this._panState.sx, this._panState.sy);
          if (n) this.openDetail(n); else this.closeDetail();
        }
        this._panState = null;
      });

      // 키보드
      document.addEventListener('keydown', e => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        if (e.key === '+' || e.key === '=') { this._zoomBy(ZOOM_STEP); this._flashZoomHint(); }
        else if (e.key === '-' || e.key === '_') { this._zoomBy(1 / ZOOM_STEP); this._flashZoomHint(); }
        else if (e.key === '0') { this._resetView(); this._flashZoomHint(); }
        else if (e.key === 'Escape') {
          // 전체 기록 패널이 열려 있으면 그것부터 닫음
          if (this.$.deepDetail && !this.$.deepDetail.hidden) this.closeFullDetail();
          else this.closeDetail();
        }
      });

      // 상세 닫기
      this.container.querySelector('.ytm-detail-close')
        .addEventListener('click', () => this.closeDetail());

      // 전체 기록: ← 요약으로 돌아가기, × 완전히 닫기
      const $back = this.container.querySelector('.ytm-deep-back');
      if ($back) $back.addEventListener('click', () => this.closeFullDetail());
      const $deepClose = this.container.querySelector('.ytm-deep-close');
      if ($deepClose) $deepClose.addEventListener('click', () => {
        this.closeFullDetail();
        this.closeDetail();
      });

      // 백업 메뉴
      if ($.backupBtn) {
        $.backupBtn.addEventListener('click', () => {
          $.backupMenu.hidden = !$.backupMenu.hidden;
        });
        document.addEventListener('click', e => {
          if (!e.target.closest('.ytm-backup')) $.backupMenu.hidden = true;
        });
        $.backupMenu.addEventListener('click', e => {
          const btn = e.target.closest('button[data-action]');
          if (!btn) return;
          const action = btn.dataset.action;
          // 새 표준: YeonExporters 사용 (v1.1.10 규칙)
          if (window.YeonExporters && /^export-(md|html|doc|pdf|json|vault)$/.test(action)) {
            const format = action.replace('export-', '');
            try { window.YeonExporters.exportAndDownload(this, format, { domain: this.config.options.domain || '광장' }); }
            catch (err) { alert('내보내기 실패: ' + err.message); }
          }
          // PNG는 기존 방식 (캔버스 dataURL)
          else if (action === 'export-png') this._downloadDataURL(this.export('png'), this._fileName('png'));
          // 폴백: YeonExporters 미로드 시 기존 export 사용
          else if (action === 'export-json') this._downloadFile(this.export('json'), this._fileName('json'), 'application/json');
          else if (action === 'export-md') this._downloadFile(this.export('md'), this._fileName('md'), 'text/markdown');
          else if (action === 'import') $.importInput.click();
          $.backupMenu.hidden = true;
        });
        $.importInput.addEventListener('change', async e => {
          const file = e.target.files[0];
          if (!file) return;
          const txt = await file.text();
          try { this.import(txt, { mode: 'replace' }); }
          catch (err) { alert('가져오기 실패: ' + err.message); }
          e.target.value = '';
        });
      }

      // 터치
      this._wireTouchEvents();
    }

    _wireTouchEvents() {
      const canvas = this.$.canvas;
      canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
          const t = e.touches[0];
          const rect = canvas.getBoundingClientRect();
          this._touchState = {
            kind: 'pan',
            sx: t.clientX - rect.left, sy: t.clientY - rect.top,
            ox: this.state.view.ox, oy: this.state.view.oy, moved: 0,
          };
        } else if (e.touches.length === 2) {
          const t1 = e.touches[0], t2 = e.touches[1];
          this._touchState = {
            kind: 'pinch',
            dist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
            scale: this.state.view.scale,
          };
        }
      }, { passive: false });
      canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        if (!this._touchState) return;
        const rect = canvas.getBoundingClientRect();
        if (this._touchState.kind === 'pan' && e.touches.length === 1) {
          const t = e.touches[0];
          const sx = t.clientX - rect.left, sy = t.clientY - rect.top;
          const dx = sx - this._touchState.sx, dy = sy - this._touchState.sy;
          this._touchState.moved = Math.max(this._touchState.moved, Math.abs(dx) + Math.abs(dy));
          this.state.view.ox = this._touchState.ox + dx;
          this.state.view.oy = this._touchState.oy + dy;
        } else if (this._touchState.kind === 'pinch' && e.touches.length === 2) {
          const t1 = e.touches[0], t2 = e.touches[1];
          const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
          const cx = (t1.clientX + t2.clientX) / 2 - rect.left;
          const cy = (t1.clientY + t2.clientY) / 2 - rect.top;
          this._zoomAt(cx, cy, this._touchState.scale * (dist / this._touchState.dist));
        }
      }, { passive: false });
      canvas.addEventListener('touchend', e => {
        if (this._touchState && this._touchState.kind === 'pan' && this._touchState.moved < 4) {
          const n = this._findNodeAt(this._touchState.sx, this._touchState.sy);
          if (n) this.openDetail(n); else this.closeDetail();
        }
        if (e.touches.length === 0) this._touchState = null;
      });
    }

    /* ── 노드 찾기 ───────────────────────────────────────────── */
    _findNodeAt(sx, sy) {
      const w = this._screenToWorld(sx, sy);
      const slop = 4 / this.state.view.scale;
      for (let i = this.nodes.length - 1; i >= 0; i--) {
        const n = this.nodes[i];
        const dx = w.x - n._x, dy = w.y - n._y;
        const r = n._radius + slop;
        if (dx * dx + dy * dy <= r * r) return n;
      }
      return null;
    }

    /* ── 상세 패널 ───────────────────────────────────────────── */
    openDetail(node) {
      this.state.selected = node;
      const cats = this.config.categories;
      const catInfo = cats[node.cat] || { color: '#888', label: node.cat };

      const $detail = this.$.detail;
      const catEl = $detail.querySelector('.ytm-detail-cat');
      catEl.textContent = catInfo.label || node.cat;
      catEl.style.background = catInfo.color + '22';
      catEl.style.color = catInfo.color;

      $detail.querySelector('.ytm-detail-title').textContent = node.label || '(제목 없음)';

      const metaParts = [];
      if (node.by) metaParts.push(escapeHtml(node.by));
      if (node.time) metaParts.push(escapeHtml(node.time));
      if (node.lastSeen) metaParts.push('마지막 학습 ' + escapeHtml(node.lastSeen.slice(0, 10)));
      $detail.querySelector('.ytm-detail-meta').innerHTML =
        metaParts.join(' <span class="ytm-dot">·</span> ');

      // 숙달도 바
      const $mWrap = $detail.querySelector('.ytm-detail-mastery');
      if (node.mastery !== undefined) {
        $mWrap.hidden = false;
        $mWrap.querySelector('.ytm-mastery-fill').style.width = node.mastery + '%';
        $mWrap.querySelector('.ytm-mastery-fill').style.background = catInfo.color;
        $mWrap.querySelector('.ytm-mastery-num').textContent = Math.round(node.mastery);
      } else {
        $mWrap.hidden = true;
      }

      $detail.querySelector('.ytm-detail-body').textContent = node.body || node.deck || '';

      // 연결된 노드
      const neighbors = [...this._neighborIds(node.id)]
        .map(id => this.nodes.find(x => x.id === id)).filter(Boolean);
      const $list = $detail.querySelector('.ytm-detail-related-list');
      $list.innerHTML = neighbors.length
        ? neighbors.map(r => {
            const c = cats[r.cat] || {};
            return `
              <div class="ytm-related-item" data-id="${escapeHtml(r.id)}">
                <span class="ytm-related-dot" style="background:${c.color || '#888'};"></span>
                <div class="ytm-related-item-content">
                  <div class="ytm-related-item-title">${escapeHtml(r.label || '(제목 없음)')}</div>
                  <div class="ytm-related-item-cat">${escapeHtml(c.label || r.cat || '')}${r.by ? ' · ' + escapeHtml(r.by) : ''}</div>
                </div>
                <button class="ytm-related-item-detail" data-id="${escapeHtml(r.id)}" title="전체 기록 보기" aria-label="${escapeHtml(r.label || '')} 전체 기록 보기">›</button>
              </div>`;
          }).join('')
        : '<div class="ytm-no-related">연결된 생각이 아직 없습니다</div>';
      $list.querySelectorAll('.ytm-related-item-content').forEach(el => {
        el.addEventListener('click', () => {
          const id = el.closest('.ytm-related-item').dataset.id;
          const t = this.nodes.find(x => x.id === id);
          if (t) this.openDetail(t);
        });
      });
      $list.querySelectorAll('.ytm-related-item-detail').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const t = this.nodes.find(x => x.id === btn.dataset.id);
          if (t) this.openFullDetail(t);
        });
      });

      $detail.hidden = false;
      $detail.classList.add('open');

      if (this.config.onNodeClick) this.config.onNodeClick(node);
    }
    closeDetail() {
      this.state.selected = null;
      this.$.detail.classList.remove('open');
      setTimeout(() => { if (!this.state.selected) this.$.detail.hidden = true; }, 320);
    }

    /* ── 전체 기록 보기 ─────────────────────────────────────── */
    openFullDetail(node) {
      const cats = this.config.categories;
      const cat = cats[node.cat] || { color:'#888', label: node.cat };
      const $deep = this.$.deepDetail;

      const $catEl = $deep.querySelector('.ytm-deep-cat');
      $catEl.textContent = cat.label || node.cat;
      $catEl.style.background = cat.color + '22';
      $catEl.style.color = cat.color;

      $deep.querySelector('.ytm-deep-title').textContent = node.label || '(제목 없음)';

      const metaParts = [];
      if (node.domain)  metaParts.push(escapeHtml(node.domain));
      if (node.subject) metaParts.push(escapeHtml(node.subject));
      if (node.by)      metaParts.push(escapeHtml(node.by));
      $deep.querySelector('.ytm-deep-meta').innerHTML =
        metaParts.join(' <span class="ytm-dot">·</span> ');

      // 컨텐츠 영역 — 섹션별로 구성
      const sections = [];

      // 광장(plaza) vs 학습(study) 도메인 자동 감지
      // - depth/comments/views 같은 광장 필드가 있으면 plaza
      // - mastery/attempts/correct 같은 학습 필드가 있으면 study
      // - 둘 다 있을 수도 있고, 없을 수도 있음
      const isPlaza = node.depth !== undefined || node.comments !== undefined ||
                       node.views !== undefined || node.size !== undefined;
      const isStudy = node.mastery !== undefined || node.attempts !== undefined ||
                       node.correct !== undefined;

      // 1. 마을 응답 (광장) 또는 숙달도 (학습) — 상위 시각 지표
      if (isStudy && node.mastery !== undefined) {
        sections.push(`
          <div class="ytm-deep-section">
            <div class="ytm-deep-section-label">숙달도</div>
            <div class="ytm-detail-mastery" style="margin-bottom:0;padding-bottom:0;border:0;">
              <div class="ytm-mastery-bar"><div class="ytm-mastery-fill" style="width:${node.mastery}%;background:${cat.color};"></div></div>
              <div class="ytm-mastery-num">${Math.round(node.mastery)}</div>
            </div>
          </div>`);
      } else if (isPlaza && node.size !== undefined) {
        // 광장: 응답 크기를 시각 바로 (0.5~2.0 → 0~100%)
        const pct = Math.min(100, Math.max(0, ((node.size - 0.5) / 1.5) * 100));
        sections.push(`
          <div class="ytm-deep-section">
            <div class="ytm-deep-section-label">마을 응답 크기</div>
            <div class="ytm-detail-mastery" style="margin-bottom:0;padding-bottom:0;border:0;">
              <div class="ytm-mastery-bar"><div class="ytm-mastery-fill" style="width:${pct}%;background:${cat.color};"></div></div>
              <div class="ytm-mastery-num">${node.size.toFixed(2)}</div>
            </div>
          </div>`);
      }

      // 2. 활동 기록 — 도메인별로 다른 필드
      const stats = [];
      if (isPlaza) {
        // 광장: 좋은물음·댓글·조회
        if (node.depth !== undefined)    stats.push({ l:'좋은물음 ◐', v: node.depth });
        if (node.comments !== undefined) stats.push({ l:'댓글', v: node.comments });
        if (node.views !== undefined)    stats.push({ l:'조회', v: node.views });
      }
      if (isStudy) {
        // 학습: 시도·정답률·시간·풀이 요청
        if (node.attempts !== undefined) stats.push({ l:'시도', v: node.attempts + '회' });
        if (node.correct !== undefined && node.attempts) {
          const rate = Math.round((node.correct / node.attempts) * 100);
          stats.push({ l:'정답률', v: rate + '%' });
        }
        if (node.totalSeconds) stats.push({ l:'누적 학습', v: Math.round(node.totalSeconds / 60) + '분' });
        if (node.explanationRequests !== undefined) stats.push({ l:'풀이 요청', v: node.explanationRequests + '회' });
      }
      // 공통
      if (node.notesLength) stats.push({ l:'메모량', v: node.notesLength + '자' });
      if (node.connections !== undefined) stats.push({ l:'연결 수', v: node.connections + '개' });

      if (stats.length) {
        sections.push(`
          <div class="ytm-deep-section">
            <div class="ytm-deep-section-label">기록</div>
            <div class="ytm-deep-stats">
              ${stats.map(s => `
                <div class="ytm-deep-stat">
                  <div class="ytm-deep-stat-label">${escapeHtml(s.l)}</div>
                  <div class="ytm-deep-stat-num">${escapeHtml(String(s.v))}</div>
                </div>`).join('')}
            </div>
          </div>`);
      }

      // 3. 시간 흔적 — 도메인에 따라 라벨 다름
      const times = [];
      if (node.firstSeen) times.push({ l: isPlaza ? '처음 올린 날' : '처음 만난 날', v: String(node.firstSeen).slice(0,10) });
      if (node.lastSeen)  times.push({ l: isPlaza ? '마지막 활동'   : '마지막 학습',  v: String(node.lastSeen).slice(0,10) });
      else if (node.time && !node.firstSeen && !node.lastSeen) {
        // time 만 있는 경우 (광장 글의 표시용 시간)
        times.push({ l: '게시 시간', v: node.time });
      }
      if (node.lastReviewedAt) times.push({ l:'마지막 복습', v: String(node.lastReviewedAt).slice(0,10) });
      if (node.lastAnalyzedAt) times.push({ l:'마지막 들여다본 날', v: String(node.lastAnalyzedAt).slice(0,10) });
      if (times.length) {
        sections.push(`
          <div class="ytm-deep-section">
            <div class="ytm-deep-section-label">시간 흔적</div>
            <div class="ytm-deep-stats">
              ${times.map(s => `
                <div class="ytm-deep-stat">
                  <div class="ytm-deep-stat-label">${escapeHtml(s.l)}</div>
                  <div class="ytm-deep-stat-num" style="font-size:14px;">${escapeHtml(s.v)}</div>
                </div>`).join('')}
            </div>
          </div>`);
      }

      // 4. 풀이 분석 — 능동 데이터
      const approach = [];
      if (node.selfDiagnosis)     approach.push(`첫 진단: <strong>${escapeHtml(node.selfDiagnosis)}</strong>`);
      if (node.preferredApproach) approach.push(`선호 풀이법: <strong>${escapeHtml(node.preferredApproach)}</strong>`);
      if (Array.isArray(node.approachesViewed) && node.approachesViewed.length)
        approach.push(`본 풀이법: ${node.approachesViewed.map(escapeHtml).join(', ')}`);
      if (Array.isArray(node.liked) && node.liked.length)
        approach.push(`좋아한 풀이: ${node.liked.map(escapeHtml).join(', ')}`);
      if (approach.length) {
        sections.push(`
          <div class="ytm-deep-section">
            <div class="ytm-deep-section-label">풀이 분석</div>
            <div style="font-size:13px;line-height:1.7;color:var(--ytm-ink-soft);">
              ${approach.map(a => `<div>${a}</div>`).join('')}
            </div>
          </div>`);
      }

      // 5. 본문·메모
      if (node.body || node.notes) {
        sections.push(`
          <div class="ytm-deep-section">
            <div class="ytm-deep-section-label">메모와 본문</div>
            <p class="ytm-deep-body-text">${escapeHtml(node.body || node.notes)}</p>
          </div>`);
      }

      // 6. 연결된 생각 (엣지 타입별 그룹화)
      const connByType = {};
      const typeLabels = {
        prerequisite:'선수 학습', similar:'같은 유형', application:'응용', 'same-source':'같은 출처',
        'mistake-link':'같은 실수 패턴', connection:'본인 연결',
      };
      for (const e of this.edges) {
        const a = e.from ?? e.a ?? e[0];
        const b = e.to ?? e.b ?? e[1];
        if (a !== node.id && b !== node.id) continue;
        const other = a === node.id ? b : a;
        const t = e.type || 'connection';
        if (!connByType[t]) connByType[t] = [];
        const n = this.nodes.find(x => x.id === other);
        if (n) connByType[t].push(n);
      }
      const connKeys = Object.keys(connByType);
      if (connKeys.length) {
        sections.push(`
          <div class="ytm-deep-section">
            <div class="ytm-deep-section-label">연결된 생각</div>
            ${connKeys.map(t => `
              <div class="ytm-deep-conn-group">
                <div class="ytm-deep-conn-group-label">${escapeHtml(typeLabels[t] || t)} (${connByType[t].length})</div>
                ${connByType[t].map(r => {
                  const c = cats[r.cat] || {};
                  return `
                    <div class="ytm-deep-conn-item" data-id="${escapeHtml(r.id)}">
                      <span class="ytm-deep-conn-dot" style="background:${c.color || '#888'};"></span>
                      <span style="font-size:13px;">${escapeHtml(r.label || '(제목 없음)')}</span>
                      <span style="font-size:11px;color:var(--ytm-ink-mute);margin-left:auto;">${escapeHtml(c.label || r.cat || '')}</span>
                    </div>`;
                }).join('')}
              </div>`).join('')}
          </div>`);
      }

      // 출처·URL
      if (node.source || node.url) {
        const items = [];
        if (node.source) items.push(`출처: ${escapeHtml(node.source)}`);
        if (node.url)    items.push(`<a href="${escapeHtml(node.url)}" style="color:var(--ytm-teal);text-decoration:none;">원본으로 가기 →</a>`);
        sections.push(`
          <div class="ytm-deep-section">
            <div class="ytm-deep-section-label">출처·링크</div>
            <div style="font-size:13px;color:var(--ytm-ink-soft);line-height:1.7;">
              ${items.map(i => `<div>${i}</div>`).join('')}
            </div>
          </div>`);
      }

      // 비어 있는 경우 안내
      if (!sections.length) {
        sections.push(`
          <div class="ytm-deep-section">
            <p class="ytm-deep-empty">아직 이 생각에 대한 기록이 쌓이지 않았습니다. 학습 활동이 쌓이면 여기에 자세한 흔적이 보입니다.</p>
          </div>`);
      }

      $deep.querySelector('.ytm-deep-content').innerHTML = sections.join('');

      // 연결된 생각 클릭 → 같은 전체 기록 패널 안에서 그 노드로 갱신
      $deep.querySelectorAll('.ytm-deep-conn-item').forEach(el => {
        el.addEventListener('click', () => {
          const t = this.nodes.find(x => x.id === el.dataset.id);
          if (!t) return;
          // 상단 요약 패널도 그 노드로 갱신해서 ← 돌아가기 시 일관성 유지
          this.state.selected = t;
          this.openDetail(t);
          // 전체 기록 패널 재호출 — 닫지 않고 내용만 교체됨
          this.openFullDetail(t);
          // 패널 상단으로 스크롤
          $deep.scrollTop = 0;
        });
      });

      $deep.hidden = false;
      requestAnimationFrame(() => $deep.classList.add('open'));
    }

    closeFullDetail() {
      const $deep = this.$.deepDetail;
      $deep.classList.remove('open');
      setTimeout(() => { $deep.hidden = true; }, 340);
    }

    /* ════════════════════════════════════════════════════════
       공개 API
       ════════════════════════════════════════════════════════ */
    update({ nodes, edges, categories } = {}) {
      if (nodes) this.config.nodes = nodes;
      if (edges) this.config.edges = edges;
      if (categories) this.config.categories = categories;
      this._loadData();
    }

    refreshStates() {
      if (!this.config.options.autoCategorize) return;
      const now = new Date().toISOString();
      for (const n of this.nodes) {
        if (n.mastery !== undefined) n.cat = Mastery.autoCat(n, now);
        if (this.config.options.autoSize) {
          n.size = Mastery.autoSize(n);
          n._radius = n.size * 16;
        }
      }
      this._buildLegend();
      this._updateCounts();
    }

    addNode(node) {
      if (!node.id) node.id = 'n-' + Date.now();
      this.config.nodes.push(node);
      this._loadData();
    }
    removeNode(id) {
      this.config.nodes = this.config.nodes.filter(n => n.id !== id);
      this.config.edges = this.config.edges.filter(e => {
        const a = e.from ?? e.a ?? e[0], b = e.to ?? e.b ?? e[1];
        return a !== id && b !== id;
      });
      this._loadData();
    }
    addEdge(edge) {
      this.config.edges.push(edge);
      this._loadData();
    }

    /* ── 백업·내보내기 ─────────────────────────────────────── */
    export(format = 'json') {
      if (format === 'json') return this._exportJSON();
      if (format === 'md') return this._exportMarkdown();
      if (format === 'png') return this._exportPNG();
      throw new Error('Unknown format: ' + format);
    }

    _exportJSON() {
      const data = {
        _meta: {
          yeon_thinkmap_version: VERSION,
          exported_at: new Date().toISOString(),
          title: this.config.options.title,
          tagline: this.config.options.tagline,
          node_count: this.nodes.length,
          edge_count: this.edges.length,
        },
        categories: this.config.categories,
        nodes: this.nodes.map(n => {
          const o = Object.assign({}, n);
          delete o._x; delete o._y; delete o._vx; delete o._vy; delete o._radius;
          return o;
        }),
        edges: this.edges.slice(),
        settings: { view: Object.assign({}, this.state.view) },
      };
      return JSON.stringify(data, null, 2);
    }

    _exportMarkdown() {
      const opt = this.config.options;
      const cats = this.config.categories;
      const lines = [];
      lines.push('# ' + opt.title);
      lines.push('> ' + opt.tagline);
      lines.push('');
      lines.push('내보낸 날짜: ' + new Date().toLocaleString('ko-KR'));
      lines.push('생각 ' + this.nodes.length + '개 · 연결 ' + this.edges.length + '개');
      lines.push('');
      for (const [key, info] of Object.entries(cats)) {
        const inCat = this.nodes.filter(n => n.cat === key);
        if (!inCat.length) continue;
        lines.push('## ' + (info.label || key) + ' (' + inCat.length + ')');
        for (const n of inCat) {
          lines.push('- **' + n.label + '**' + (n.by ? ' — ' + n.by : '') + (n.lastSeen ? ' (' + n.lastSeen.slice(0, 10) + ')' : ''));
          if (n.body) lines.push('  > ' + n.body.replace(/\n/g, '\n  > '));
          if (n.mastery !== undefined) lines.push('  - 숙달도 ' + Math.round(n.mastery));
        }
        lines.push('');
      }
      return lines.join('\n');
    }

    _exportPNG() {
      return this.$.canvas.toDataURL('image/png');
    }

    import(jsonString, opts) {
      opts = opts || {};
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!data._meta || !data._meta.yeon_thinkmap_version) {
        throw new Error('유효한 yeon-thinkmap JSON이 아닙니다');
      }
      const mode = opts.mode || 'replace';
      if (mode === 'replace') {
        this.update({
          nodes: data.nodes || [],
          edges: data.edges || [],
          categories: data.categories || this.config.categories,
        });
      } else if (mode === 'merge') {
        const existing = new Set(this.config.nodes.map(n => n.id));
        const newNodes = (data.nodes || []).filter(n => !existing.has(n.id));
        const newEdges = data.edges || [];
        this.update({
          nodes: this.config.nodes.concat(newNodes),
          edges: this.config.edges.concat(newEdges),
        });
      }
      if (this.config.onImport) this.config.onImport(data);
    }

    _fileName(ext) {
      const t = (this.config.options.title || 'thinkmap').replace(/[^\w가-힣]/g, '-');
      const d = new Date().toISOString().slice(0, 10);
      return t + '-' + d + '.' + ext;
    }
    _downloadFile(text, filename, mime) {
      const blob = new Blob([text], { type: mime + ';charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    }
    _downloadDataURL(dataUrl, filename) {
      const a = document.createElement('a');
      a.href = dataUrl; a.download = filename; a.click();
    }

    destroy() {
      cancelAnimationFrame(this._animId);
      this.container.innerHTML = '';
      this.container.classList.remove('ytm-root');
    }

    /* ════════════════════════════════════════════════════════
       렌더 루프
       ════════════════════════════════════════════════════════ */
    _loop() {
      this._draw();
      this._animId = requestAnimationFrame(() => this._loop());
    }

    _draw() {
      this.state.tick++;
      const t = this.state.tick;
      const ctx = this.ctx;
      const view = this.state.view;
      const dpr = this._dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, this.W, this.H);

      if (!this.nodes.length) {
        if (this.$.emptyHint) this.$.emptyHint.hidden = false;
        return;
      }
      if (this.$.emptyHint) this.$.emptyHint.hidden = true;

      this.nodes.forEach((n, i) => {
        n._x += Math.sin(t * .007 + i * 2.1) * .22;
        n._y += Math.cos(t * .005 + i * 1.7) * .22;
        n._vx *= .97; n._vy *= .97;
        n._x += n._vx; n._y += n._vy;
        if (n._x < n._radius) n._vx += .3;
        if (n._x > this.W - n._radius) n._vx -= .3;
        if (n._y < n._radius) n._vy += .3;
        if (n._y > this.H - n._radius) n._vy -= .3;
      });

      const visibleIds = this._filteredIds();
      const focus = this.state.selected || this.state.hover;
      const focusNeighbors = focus ? this._neighborIds(focus.id) : null;
      const cats = this.config.categories;

      ctx.setTransform(view.scale * dpr, 0, 0, view.scale * dpr, view.ox * dpr, view.oy * dpr);
      const invS = 1 / view.scale;

      this.edges.forEach(e => {
        const aId = e.from != null ? e.from : (e.a != null ? e.a : e[0]);
        const bId = e.to != null ? e.to : (e.b != null ? e.b : e[1]);
        const na = this.nodes.find(x => x.id === aId);
        const nb = this.nodes.find(x => x.id === bId);
        if (!na || !nb) return;

        const isFocused = focus && (aId === focus.id || bId === focus.id);
        const bothVisible = visibleIds.has(aId) && visibleIds.has(bId);
        const dimMul = focus ? (isFocused ? 1.4 : 0.15) : (bothVisible ? 1 : 0.15);

        const pulse = (.12 + .08 * Math.sin(t * .02 + hashCode(aId) * .005)) * dimMul;
        const alpha = Math.min(1, pulse);
        const colA = (cats[na.cat] || {}).color || '#888';
        const colB = (cats[nb.cat] || {}).color || '#888';
        const g = ctx.createLinearGradient(na._x, na._y, nb._x, nb._y);
        g.addColorStop(0, colA + toHex(alpha));
        g.addColorStop(1, colB + toHex(alpha));
        ctx.beginPath();
        ctx.strokeStyle = g;
        ctx.lineWidth = (isFocused ? 1.4 : .8) * invS;
        ctx.moveTo(na._x, na._y); ctx.lineTo(nb._x, nb._y);
        ctx.stroke();

        if (dimMul > 0.5 && view.scale > 0.15) {
          const pt = ((t * .006 + hashCode(aId) * .003) % 1);
          const px = na._x + (nb._x - na._x) * pt;
          const py = na._y + (nb._y - na._y) * pt;
          ctx.beginPath();
          ctx.arc(px, py, 1.4 * invS, 0, Math.PI * 2);
          ctx.fillStyle = colA + '99';
          ctx.fill();
        }
      });

      this.nodes.forEach(n => {
        const isVisible = visibleIds.has(n.id);
        const isFocused = focus && (n.id === focus.id || (focusNeighbors && focusNeighbors.has(n.id)));
        const isDimmed = focus ? !isFocused : !isVisible;
        const baseAlpha = isDimmed ? 0.22 : 1;
        const col = (cats[n.cat] || {}).color || '#888';

        if (!isDimmed) {
          const glow = ctx.createRadialGradient(n._x, n._y, 0, n._x, n._y, n._radius * 2.2);
          glow.addColorStop(0, col + '40');
          glow.addColorStop(1, col + '00');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(n._x, n._y, n._radius * 2.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = baseAlpha;
        ctx.beginPath(); ctx.arc(n._x, n._y, n._radius, 0, Math.PI * 2);
        ctx.fillStyle = col + 'cc';
        ctx.fill();
        ctx.beginPath(); ctx.arc(n._x, n._y, n._radius * .28, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fill();
        if (focus && n.id === focus.id) {
          ctx.beginPath();
          ctx.arc(n._x, n._y, n._radius + 5 * invS, 0, Math.PI * 2);
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.8 * invS;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.globalAlpha = 1;
      });

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (view.scale > 0.35) {
        const labelAlpha = Math.min(1, (view.scale - 0.35) / 0.25);
        ctx.font = (view.scale > 2 ? 13 : 12.5) + "px 'Pretendard', 'Apple SD Gothic Neo', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        this.nodes.forEach(n => {
          const isFocused = focus && (n.id === focus.id || (focusNeighbors && focusNeighbors.has(n.id)));
          const isDimmed = focus ? !isFocused : !visibleIds.has(n.id);
          if (isDimmed) return;
          const lbl = (n.label || '').length > 14 ? n.label.slice(0, 13) + '…' : (n.label || '');
          if (!lbl) return;
          const s = this._worldToScreen(n._x, n._y);
          if (s.x < -100 || s.x > this.W + 100 || s.y < -50 || s.y > this.H + 50) return;
          // 테마에 따라 라벨 색 — 낮: 짙은 잉크 / 밤: 종이톤 흰
          const __isDay = (document.documentElement.getAttribute('data-theme') === 'day');
          ctx.fillStyle = __isDay
            ? 'rgba(31,42,42,' + Math.min(1, .98 * labelAlpha) + ')'
            : 'rgba(240,237,226,' + (.92 * labelAlpha) + ')';
          ctx.fillText(lbl, s.x, s.y + n._radius * view.scale + 6);
        });
      }
    }
  }

  function toHex(alpha) {
    return Math.round(Math.max(0, Math.min(1, alpha)) * 255)
      .toString(16).padStart(2, '0');
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function hashCode(s) {
    let h = 0; s = String(s == null ? '' : s);
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
  }

  global.YeonThinkMap = YeonThinkMap;
  global.YeonThinkMap.VERSION = VERSION;
  global.YeonThinkMap.Mastery = Mastery;
  global.YeonThinkMap.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
})(window);
