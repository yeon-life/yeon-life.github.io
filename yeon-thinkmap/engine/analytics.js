/* ════════════════════════════════════════════════════════════════
   YeonAnalytics — 연라이프 광장 분석 대시보드
   ────────────────────────────────────────────────────────────────
   학습 지도와 절대 헷갈리지 말 것:
   여기는 광장(공개 공간) 분석이다. 사람·만남·관심·반응의 풍경.
   시험·숙달도·망각 같은 개념 금지.

   9가지 차트:
   1. 카테고리 분포 도넛  — 마을 글 종류 비중
   2. 인기 있는 글 트리맵 — 마을이 가장 응답한 글들
   3. 활발한 작성자 막대   — 이 기간에 글 많이 쓴 사람
   4. 가장 깊은 토론 막대  — 댓글·좋은물음 종합
   5. 광장의 한 주 라인    — 일별 새 글 추이 (예시)
   6. 화두 응답 분포 도넛  — 이번 주 화두에 어떻게 응답했나
   7. 내가 본 글들 캘린더  — 내 광장 발자취 (예시)
   8. 내가 관심 가진 도넛  — 스크랩·좋은물음 누른 글 분포 (예시)
   9. 내가 받은 반응 막대  — 내 글이 받은 좋은물음·댓글 (예시)

   외부 의존성: Chart.js (CDN으로 미리 로드)
   ════════════════════════════════════════════════════════════════ */

(function(global) {
  'use strict';

  const TEXT_COLOR = '#f0ede2';
  const MUTED = 'rgba(240,237,226,.55)';
  const GRID = 'rgba(255,255,255,.06)';

  function setChartDefaults() {
    if (!global.Chart) return;
    Chart.defaults.color = MUTED;
    Chart.defaults.borderColor = GRID;
    Chart.defaults.font.family = '"Pretendard","Apple SD Gothic Neo",sans-serif';
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.legend.labels.boxWidth = 10;
    Chart.defaults.plugins.legend.labels.padding = 8;
  }

  class YeonAnalytics {
    static mount(selector, config) {
      const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!el) throw new Error('[YeonAnalytics] container not found');
      return new YeonAnalytics(el, config || {});
    }

    constructor(container, config) {
      this.container = container;
      this.nodes = config.nodes || [];
      this.edges = config.edges || [];
      this.categories = config.categories || {};
      this.options = Object.assign({
        title: '광장 활동 분석',
        tagline: '오직 진실과 진리를 찾는 곳',
        myName: '본인',
      }, config.options || {});
      this._charts = [];

      setChartDefaults();
      this._buildDOM();
      this._render();
    }

    _buildDOM() {
      this.container.classList.add('yta-root');
      this.container.innerHTML = `
        <div class="yta-head">
          <div class="yta-title">${esc(this.options.title)}</div>
          <div class="yta-tagline">${esc(this.options.tagline)}</div>
        </div>
        <div class="yta-grid">

          <div class="yta-card yta-col-4">
            <div class="yta-card-head">
              <div class="yta-card-title">광장 글 카테고리 분포</div>
              <span class="yta-card-sub">전체 ${this.nodes.length}개</span>
            </div>
            <div class="yta-canvas-wrap yta-canvas-wrap--md">
              <canvas data-chart="cat-donut" role="img" aria-label="광장 카테고리 분포 도넛"></canvas>
            </div>
          </div>

          <div class="yta-card yta-col-5">
            <div class="yta-card-head">
              <div class="yta-card-title">주제별 부피</div>
              <span class="yta-card-sub">사각형 면적 = 글 수</span>
            </div>
            <div class="yta-treemap" data-treemap></div>
          </div>

          <div class="yta-card yta-col-3">
            <div class="yta-card-head">
              <div class="yta-card-title">이번 주 화두 응답</div>
              <span class="yta-card-sub">화두에 닿은 글들</span>
            </div>
            <div class="yta-canvas-wrap yta-canvas-wrap--md">
              <canvas data-chart="hwadu-donut" role="img" aria-label="이번 주 화두에 응답한 글 분포"></canvas>
            </div>
          </div>

          <div class="yta-card yta-col-7">
            <div class="yta-card-head">
              <div class="yta-card-title">마을의 인기 글</div>
              <span class="yta-card-sub">응답 크기순 (좋은물음·댓글·조회 종합)</span>
            </div>
            <div class="yta-canvas-wrap yta-canvas-wrap--md">
              <canvas data-chart="popular" role="img" aria-label="인기 글 막대 차트"></canvas>
            </div>
          </div>

          <div class="yta-card yta-col-5">
            <div class="yta-card-head">
              <div class="yta-card-title">활발한 작성자</div>
              <span class="yta-card-sub">최근 글 수</span>
            </div>
            <div class="yta-canvas-wrap yta-canvas-wrap--md">
              <canvas data-chart="active-authors" role="img" aria-label="활발한 작성자 막대 차트"></canvas>
            </div>
          </div>

          <div class="yta-card yta-col-8">
            <div class="yta-card-head">
              <div class="yta-card-title">
                광장의 한 주
                <span class="yta-badge-example">예시</span>
              </div>
              <span class="yta-card-sub">일별 새 글 추이</span>
            </div>
            <div class="yta-canvas-wrap yta-canvas-wrap--md">
              <canvas data-chart="weekly-line" role="img" aria-label="광장 한 주 추이"></canvas>
            </div>
          </div>

          <div class="yta-card yta-col-4">
            <div class="yta-card-head">
              <div class="yta-card-title">
                내가 관심 가진 것
                <span class="yta-badge-example">예시</span>
              </div>
              <span class="yta-card-sub">스크랩·좋은물음 누른 글</span>
            </div>
            <div class="yta-canvas-wrap yta-canvas-wrap--md">
              <canvas data-chart="my-interest" role="img" aria-label="내가 관심 가진 카테고리 분포"></canvas>
            </div>
          </div>

          <div class="yta-card yta-col-7">
            <div class="yta-card-head">
              <div class="yta-card-title">
                내 글이 받은 반응
                <span class="yta-badge-example">예시</span>
              </div>
              <span class="yta-card-sub">내가 쓴 글에 달린 좋은물음·댓글</span>
            </div>
            <div class="yta-canvas-wrap yta-canvas-wrap--md">
              <canvas data-chart="my-response" role="img" aria-label="내 글이 받은 반응"></canvas>
            </div>
          </div>

          <div class="yta-card yta-col-5">
            <div class="yta-card-head">
              <div class="yta-card-title">
                내가 광장에 머문 날
                <span class="yta-badge-example">예시</span>
              </div>
              <span class="yta-card-sub">지난 60일</span>
            </div>
            <div class="yta-calendar" data-calendar></div>
          </div>

        </div>

        <aside class="yta-drill" hidden>
          <button class="yta-drill-close" aria-label="닫기">×</button>
          <div class="yta-drill-head">
            <div class="yta-drill-context"></div>
            <h2 class="yta-drill-title"></h2>
            <div class="yta-drill-count"></div>
          </div>
          <div class="yta-drill-list"></div>
          <div class="yta-drill-detail" hidden></div>
        </aside>
      `;

      this.$drill = this.container.querySelector('.yta-drill');
      this.$drillContext = this.$drill.querySelector('.yta-drill-context');
      this.$drillTitle = this.$drill.querySelector('.yta-drill-title');
      this.$drillCount = this.$drill.querySelector('.yta-drill-count');
      this.$drillList = this.$drill.querySelector('.yta-drill-list');
      this.$drillDetail = this.$drill.querySelector('.yta-drill-detail');

      this.$drill.querySelector('.yta-drill-close')
        .addEventListener('click', () => this.closeDrill());
      this._escHandler = (e) => { if (e.key === 'Escape') this.closeDrill(); };
      document.addEventListener('keydown', this._escHandler);
    }

    /* ════════════════════════════════════════════════════════
       드릴다운 패널
       ════════════════════════════════════════════════════════ */

    showDrill(context, title, filterFn, opts) {
      opts = opts || {};
      let matched;
      if (opts.isExample) matched = [];
      else if (typeof filterFn === 'function') matched = this.nodes.filter(filterFn);
      else matched = filterFn || [];

      this.$drillContext.textContent = context;
      this.$drillTitle.textContent = title;
      this.$drillCount.textContent = matched.length + '개 글';

      if (opts.color) {
        this.$drillTitle.style.color = opts.color;
        this.$drillContext.style.color = opts.color;
      } else {
        this.$drillTitle.style.color = '';
        this.$drillContext.style.color = '';
      }

      if (opts.isExample) {
        this.$drillList.innerHTML = `
          <div class="yta-drill-example-note">
            이 차트는 <strong>예시 데이터</strong>로 그려졌어요.
            실제로 광장에서 본 글·스크랩·좋은물음·반응이 쌓이면
            본인 데이터로 자동 교체됩니다. 그때부터 이 자리에 진짜 글 목록이 나타나요.
          </div>`;
      } else if (!matched.length) {
        this.$drillList.innerHTML = '<div class="yta-drill-empty">해당하는 글이 없습니다</div>';
      } else {
        const cats = this.categories;
        this.$drillList.innerHTML = matched.map(n => {
          const c = cats[n.cat] || {};
          const sizeTxt = n.size !== undefined ? '◐ ' + Math.round((n.depth || 0)) : '';
          const metaParts = [];
          if (n.by) metaParts.push(esc(n.by));
          if (n.time) metaParts.push(esc(n.time));
          else if (n.lastSeen) metaParts.push(esc(String(n.lastSeen).slice(0, 10)));
          return `
            <div class="yta-drill-item" data-id="${esc(n.id)}">
              <span class="yta-drill-item-dot" style="background:${c.color || '#888'};color:${c.color || '#888'};"></span>
              <div class="yta-drill-item-body">
                <div class="yta-drill-item-title">${esc(n.label || '(제목 없음)')}</div>
                <div class="yta-drill-item-meta">${esc(c.label || n.cat || '')} ${metaParts.length ? ' · ' + metaParts.join(' · ') : ''}</div>
                ${n.body ? `<div class="yta-drill-item-snippet">${esc(n.body)}</div>` : ''}
              </div>
              ${sizeTxt ? `<div class="yta-drill-item-mastery">${esc(sizeTxt)}</div>` : ''}
            </div>`;
        }).join('');

        this.$drillList.querySelectorAll('.yta-drill-item').forEach(el => {
          el.addEventListener('click', () => {
            this.$drillList.querySelectorAll('.yta-drill-item').forEach(x => x.classList.remove('active'));
            el.classList.add('active');
            const node = this.nodes.find(x => x.id === el.dataset.id);
            if (node) this.showNodeDetail(node);
          });
        });
      }

      this.$drillDetail.hidden = true;
      this.$drillDetail.innerHTML = '';
      this.$drill.hidden = false;
      requestAnimationFrame(() => this.$drill.classList.add('open'));
    }

    showNodeDetail(node) {
      const cats = this.categories;
      const cat = cats[node.cat] || {};
      const col = cat.color || '#888';

      // 광장 정서에 맞는 통계 (학습 점수 아님 — 마을 응답)
      const stats = [];
      if (node.depth !== undefined)    stats.push({ l: '좋은물음 ◐', v: node.depth });
      if (node.comments !== undefined) stats.push({ l: '댓글',         v: node.comments });
      if (node.views !== undefined)    stats.push({ l: '조회',         v: node.views });
      if (node.size !== undefined)     stats.push({ l: '응답 크기',     v: node.size.toFixed(2) });

      const metaParts = [];
      if (node.by) metaParts.push(esc(node.by));
      if (node.time) metaParts.push(esc(node.time));
      else if (node.lastSeen) metaParts.push(esc(String(node.lastSeen).slice(0, 10)));
      if (node.subject && node.subject !== node.cat) metaParts.push(esc(node.subject));

      this.$drillDetail.innerHTML = `
        <button class="yta-drill-detail-back">← 목록으로</button>
        <span class="yta-drill-detail-cat" style="background:${col}22;color:${col};">${esc(cat.label || node.cat)}</span>
        <h3 class="yta-drill-detail-title">${esc(node.label || '(제목 없음)')}</h3>
        <div class="yta-drill-detail-meta">${metaParts.join(' · ')}</div>
        ${node.body ? `<div class="yta-drill-detail-body">${esc(node.body)}</div>` : ''}
        ${stats.length ? `
          <div class="yta-drill-detail-stats">
            ${stats.map(s => `
              <div class="yta-drill-stat">
                <div class="yta-drill-stat-label">${esc(s.l)}</div>
                <div class="yta-drill-stat-val">${esc(String(s.v))}</div>
              </div>`).join('')}
          </div>` : ''}
        ${node.url ? `<div style="margin-top:14px;"><a href="${esc(node.url)}" style="color:#3aa0a8;font-size:13px;">원글로 가기 →</a></div>` : ''}
      `;

      this.$drillDetail.querySelector('.yta-drill-detail-back')
        .addEventListener('click', () => {
          this.$drillDetail.hidden = true;
          this.$drillDetail.innerHTML = '';
          this.$drillList.querySelectorAll('.yta-drill-item').forEach(x => x.classList.remove('active'));
        });

      this.$drillDetail.hidden = false;
      this.$drillDetail.scrollTop = 0;
    }

    closeDrill() {
      if (!this.$drill) return;
      this.$drill.classList.remove('open');
      setTimeout(() => {
        this.$drill.hidden = true;
        this.$drillList.innerHTML = '';
        this.$drillDetail.hidden = true;
        this.$drillDetail.innerHTML = '';
      }, 340);
    }

    /* ════════════════════════════════════════════════════════
       9가지 차트 렌더
       ════════════════════════════════════════════════════════ */

    _render() {
      this._renderCatDonut();
      this._renderSubjectTreemap();
      this._renderHwaduDonut();
      this._renderPopular();
      this._renderActiveAuthors();
      this._renderWeeklyLine();
      this._renderMyInterest();
      this._renderMyResponse();
      this._renderMyCalendar();
    }

    /* 1. 카테고리 분포 도넛 — 마을 글 종류 비중 */
    _renderCatDonut() {
      const cats = this.categories;
      const keys = [], colors = [], labels = [], data = [];
      for (const [key, info] of Object.entries(cats)) {
        const c = this.nodes.filter(n => n.cat === key).length;
        if (!c) continue;
        keys.push(key); labels.push(info.label || key); data.push(c); colors.push(info.color);
      }
      const canvas = this.container.querySelector('[data-chart="cat-donut"]');
      if (!canvas || !global.Chart) return;
      const self = this;
      this._charts.push(new Chart(canvas, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: 'rgba(0,0,0,0)', borderWidth: 2 }] },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '62%',
          plugins: {
            legend: { position: 'right', labels: { color: TEXT_COLOR, boxWidth: 10, padding: 8 } },
            tooltip: { callbacks: { label: ctx => ctx.label + ' ' + ctx.parsed + '개' } },
          },
          onClick: (e, els) => {
            if (!els.length) return;
            const k = keys[els[0].index];
            const info = cats[k] || {};
            self.showDrill('분류', (info.label || k) + ' 글', n => n.cat === k, { color: info.color });
          },
        },
      }));
    }

    /* 2. 주제별 트리맵 — subject 그룹별 부피 */
    _renderSubjectTreemap() {
      const wrap = this.container.querySelector('[data-treemap]');
      if (!wrap) return;
      const cats = this.categories;
      const bySubject = {};
      for (const n of this.nodes) {
        const s = n.subject || n.cat || '기타';
        if (!bySubject[s]) bySubject[s] = [];
        bySubject[s].push(n);
      }
      const entries = Object.entries(bySubject).map(([name, ns]) => {
        const counts = {};
        for (const n of ns) counts[n.cat] = (counts[n.cat] || 0) + 1;
        let topCat = ns[0].cat, max = 0;
        for (const k in counts) if (counts[k] > max) { max = counts[k]; topCat = k; }
        const totalDepth = ns.reduce((s, n) => s + (n.depth || 0), 0);
        return { name, count: ns.length, depth: totalDepth, color: (cats[topCat] || {}).color || '#888' };
      }).sort((a, b) => b.count - a.count);

      const total = entries.reduce((s, e) => s + e.count, 0);
      wrap.innerHTML = entries.map(e => {
        const flex = Math.max(0.4, e.count / Math.max(1, total) * 10);
        return `
          <div class="yta-treemap-cell"
               data-subject="${esc(e.name)}"
               data-color="${e.color}"
               style="flex: ${flex.toFixed(2)} 1 80px; background: ${e.color}33; border: 1px solid ${e.color}66;"
               title="${esc(e.name)} · 글 ${e.count}개 · 좋은물음 ${e.depth}">
            <div class="yta-treemap-cell-label" style="color: var(--yta-ink-primary);">${esc(e.name)}</div>
            <div class="yta-treemap-cell-num" style="color: ${e.color};">${e.count}</div>
            <div class="yta-treemap-cell-bar" style="background: ${e.color};"></div>
          </div>`;
      }).join('');

      const self = this;
      wrap.querySelectorAll('.yta-treemap-cell').forEach(el => {
        el.addEventListener('click', () => {
          const subj = el.dataset.subject;
          const col = el.dataset.color;
          self.showDrill('주제', subj + ' 주제의 글', n => (n.subject || n.cat || '기타') === subj, { color: col });
        });
      });
    }

    /* 3. 이번 주 화두 응답 도넛 — 어떤 카테고리 글이 화두에 응답했나 */
    _renderHwaduDonut() {
      // 가장 큰 화두 노드(=이번 주 화두) 찾기
      const hwadus = this.nodes.filter(n => n.cat === '화두').sort((a, b) => (b.size || 0) - (a.size || 0));
      const mainHwadu = hwadus[0];
      if (!mainHwadu) return;

      // 그 화두에 연결된 노드들 + 카테고리별 카운트
      const neighbors = new Set();
      for (const e of this.edges) {
        const a = e.from != null ? e.from : (e.a != null ? e.a : e[0]);
        const b = e.to != null ? e.to : (e.b != null ? e.b : e[1]);
        if (a === mainHwadu.id) neighbors.add(b);
        if (b === mainHwadu.id) neighbors.add(a);
      }

      const cats = this.categories;
      const counts = {};
      for (const id of neighbors) {
        const n = this.nodes.find(x => x.id === id);
        if (n) counts[n.cat] = (counts[n.cat] || 0) + 1;
      }

      const keys = [], colors = [], labels = [], data = [];
      for (const [key, c] of Object.entries(counts)) {
        const info = cats[key] || {};
        keys.push(key); labels.push(info.label || key); data.push(c); colors.push(info.color || '#888');
      }

      const canvas = this.container.querySelector('[data-chart="hwadu-donut"]');
      if (!canvas || !global.Chart) return;
      const self = this;
      this._charts.push(new Chart(canvas, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: 'rgba(0,0,0,0)', borderWidth: 2 }] },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '62%',
          plugins: {
            legend: { position: 'right', labels: { color: TEXT_COLOR, boxWidth: 10, padding: 8 } },
            tooltip: { callbacks: { label: ctx => ctx.label + ' ' + ctx.parsed + '개' } },
          },
          onClick: (e, els) => {
            if (!els.length) return;
            const k = keys[els[0].index];
            const info = cats[k] || {};
            self.showDrill('이번 주 화두 응답', '"' + (mainHwadu.label || '화두') + '"에 응답한 ' + (info.label || k),
              n => neighbors.has(n.id) && n.cat === k, { color: info.color });
          },
        },
      }));
    }

    /* 4. 인기 글 막대 — size (응답 크기) 순 */
    _renderPopular() {
      const cats = this.categories;
      const top = this.nodes.slice()
        .sort((a, b) => (b.size || 0) - (a.size || 0))
        .slice(0, 8);
      const labels = top.map(n => (n.label || '').slice(0, 18));
      const data = top.map(n => Math.round((n.size || 0) * 50));  // 시각 위해 스케일
      const colors = top.map(n => (cats[n.cat] || {}).color || '#888');
      const ids = top.map(n => n.id);
      const sizes = top.map(n => (n.size || 0).toFixed(2));

      const canvas = this.container.querySelector('[data-chart="popular"]');
      if (!canvas || !global.Chart) return;
      const self = this;
      this._charts.push(new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4, barPercentage: 0.75 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => '응답 크기 ' + sizes[ctx.dataIndex] } },
          },
          scales: {
            x: { grid: { color: GRID }, ticks: { color: MUTED } },
            y: { grid: { display: false }, ticks: { color: TEXT_COLOR, font: { size: 11 } } },
          },
          onClick: (e, els) => {
            if (!els.length) return;
            const nodeId = ids[els[0].index];
            const node = self.nodes.find(n => n.id === nodeId);
            if (!node) return;
            const info = (self.categories[node.cat] || {});
            self.showDrill('인기 글', node.label || '(제목 없음)', n => n.id === nodeId, { color: info.color });
            setTimeout(() => self.showNodeDetail(node), 50);
          },
        },
      }));
    }

    /* 5. 활발한 작성자 막대 */
    _renderActiveAuthors() {
      const byAuthor = {};
      for (const n of this.nodes) {
        if (!n.by) continue;
        byAuthor[n.by] = (byAuthor[n.by] || 0) + 1;
      }
      const entries = Object.entries(byAuthor).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const labels = entries.map(e => e[0]);
      const data = entries.map(e => e[1]);
      const colors = labels.map((_, i) => ['#3aa0a8', '#c4923e', '#c05040', '#6858c0', '#4a9060', '#8888aa', '#aa6655', '#557788'][i % 8]);

      const canvas = this.container.querySelector('[data-chart="active-authors"]');
      if (!canvas || !global.Chart) return;
      const self = this;
      this._charts.push(new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4, barPercentage: 0.75 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ctx.parsed.x + '개 글' } },
          },
          scales: {
            x: { grid: { color: GRID }, ticks: { color: MUTED, stepSize: 1 } },
            y: { grid: { display: false }, ticks: { color: TEXT_COLOR } },
          },
          onClick: (e, els) => {
            if (!els.length) return;
            const author = labels[els[0].index];
            self.showDrill('작성자', author + '의 글', n => n.by === author);
          },
        },
      }));
    }

    /* 6. 광장의 한 주 라인 (예시) — 일별 새 글 추이 */
    _renderWeeklyLine() {
      const days = 14;
      const labels = [];
      const data = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        labels.push((d.getMonth() + 1) + '/' + d.getDate());
        // 예시 분포: 주말 살짝 낮음, 주중 활발
        const dow = d.getDay();
        const base = dow === 0 || dow === 6 ? 3 : 6;
        const wobble = Math.round(Math.abs(Math.sin(i * 0.7) * 4) + Math.cos(i * 0.4) * 2);
        data.push(Math.max(0, base + wobble));
      }

      const canvas = this.container.querySelector('[data-chart="weekly-line"]');
      if (!canvas || !global.Chart) return;
      const self = this;
      this._charts.push(new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: '새 글',
            data,
            borderColor: '#3aa0a8',
            backgroundColor: 'rgba(58,160,168,.12)',
            fill: true, tension: 0.32, borderWidth: 2,
            pointRadius: 0, pointHoverRadius: 5,
            pointBackgroundColor: '#3aa0a8',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: GRID }, ticks: { color: MUTED, maxRotation: 0, autoSkipPadding: 16 } },
            y: { min: 0, grid: { color: GRID }, ticks: { color: MUTED, stepSize: 2 } },
          },
          onClick: () => self.showDrill('광장의 한 주', '일별 새 글 추이', null, { isExample: true }),
        },
      }));
    }

    /* 7. 내가 관심 가진 도넛 (예시) — 스크랩·좋은물음 누른 글 분포 */
    _renderMyInterest() {
      // 예시 분포 — 실제로는 본인이 누른 ◐·스크랩 누적
      const labels = ['화두', '아곤란', '아골라', '칼럼', '연마을'];
      const data = [45, 22, 18, 10, 5];
      const cats = this.categories;
      const colors = labels.map(k => (cats[k] || {}).color || '#888');

      const canvas = this.container.querySelector('[data-chart="my-interest"]');
      if (!canvas || !global.Chart) return;
      const self = this;
      this._charts.push(new Chart(canvas, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: 'rgba(0,0,0,0)', borderWidth: 2 }] },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '62%',
          plugins: {
            legend: { position: 'right', labels: { color: TEXT_COLOR, boxWidth: 10, padding: 8 } },
            tooltip: { callbacks: { label: ctx => ctx.label + ' ' + ctx.parsed + '%' } },
          },
          onClick: () => self.showDrill('내가 관심 가진 것', '스크랩·좋은물음 누른 글', null, { isExample: true }),
        },
      }));
    }

    /* 8. 내 글이 받은 반응 (예시) — 좋은물음·댓글 막대 */
    _renderMyResponse() {
      // 예시 — 본인이 작성자인 글 가정. 실제로는 by===본인 필터
      const labels = ['"좋은 질문이란 무엇인가"', '"멈춤이라는 자유"', '"기록하지 않은 생각"', '"느린 것의 힘"', '내 다른 글'];
      const depth = [28, 22, 16, 14, 8];
      const comments = [12, 9, 6, 5, 3];

      const canvas = this.container.querySelector('[data-chart="my-response"]');
      if (!canvas || !global.Chart) return;
      const self = this;
      this._charts.push(new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels.map(l => l.length > 18 ? l.slice(0, 17) + '…' : l),
          datasets: [
            { label: '좋은물음 ◐', data: depth, backgroundColor: '#3aa0a8', borderRadius: 4, barPercentage: 0.8 },
            { label: '댓글', data: comments, backgroundColor: '#c4923e', borderRadius: 4, barPercentage: 0.8 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { position: 'top', labels: { color: TEXT_COLOR, boxWidth: 10, padding: 8 } },
          },
          scales: {
            x: { stacked: false, grid: { color: GRID }, ticks: { color: MUTED } },
            y: { stacked: true, grid: { display: false }, ticks: { color: TEXT_COLOR, font: { size: 10 } } },
          },
          onClick: () => self.showDrill('내 글이 받은 반응', '내가 광장에 올린 글들이 받은 좋은물음·댓글', null, { isExample: true }),
        },
      }));
    }

    /* 9. 내 광장 발자취 캘린더 (예시) */
    _renderMyCalendar() {
      const wrap = this.container.querySelector('[data-calendar]');
      if (!wrap) return;
      const days = 70;
      const today = new Date();
      const cells = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayOfWeek = d.getDay();
        const recencyFactor = (days - i) / days;
        const seed = i * 13 + dayOfWeek * 5;
        const baseV = Math.abs(Math.sin(seed)) * recencyFactor;
        const intensity = dayOfWeek === 0 ? baseV * 0.3 : baseV;
        const alpha = intensity > 0.05 ? 0.15 + intensity * 0.7 : 0;
        const color = alpha > 0 ? 'rgba(58,160,168,' + alpha.toFixed(2) + ')' : 'rgba(255,255,255,.04)';
        cells.push('<div class="yta-cal-cell" style="background:' + color + ';" title="' + (d.getMonth()+1) + '/' + d.getDate() + ' · ' + Math.round(intensity*10) + '개 글 봄"></div>');
      }
      wrap.innerHTML =
        '<div class="yta-cal-rows">' + cells.join('') + '</div>' +
        '<div class="yta-cal-scale">' +
          '<span>적게</span>' +
          '<div class="yta-cal-scale-row">' +
            '<div class="yta-cal-cell" style="background:rgba(255,255,255,.04);"></div>' +
            '<div class="yta-cal-cell" style="background:rgba(58,160,168,.25);"></div>' +
            '<div class="yta-cal-cell" style="background:rgba(58,160,168,.5);"></div>' +
            '<div class="yta-cal-cell" style="background:rgba(58,160,168,.75);"></div>' +
            '<div class="yta-cal-cell" style="background:rgba(58,160,168,1);"></div>' +
          '</div>' +
          '<span>자주</span>' +
        '</div>';
      const self = this;
      wrap.addEventListener('click', () =>
        self.showDrill('내가 광장에 머문 날', '광장에서 본 글들의 흔적', null, { isExample: true }));
    }

    destroy() {
      this._charts.forEach(c => c.destroy && c.destroy());
      this._charts = [];
      if (this._escHandler) document.removeEventListener('keydown', this._escHandler);
      this.container.innerHTML = '';
      this.container.classList.remove('yta-root');
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  global.YeonAnalytics = YeonAnalytics;
})(window);
