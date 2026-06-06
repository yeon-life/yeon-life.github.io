/* ════════════════════════════════════════════════════════════════
   yeon-thinkmap exporters — 내보내기 규칙 v1.1.10
   yuv3.2 §5-2 (내보내기 표준)에 맞춘 6가지 형식 변환
   ────────────────────────────────────────────────────────────────
   여기서 쓴 모든 것은 당신의 자산입니다.

   파일명 규칙: <title>_<도메인>_<YYYY-MM-DD>.<ext>
   ════════════════════════════════════════════════════════════════ */

(function (global) {
  'use strict';

  const YEON_EXPORT_VERSION = 'v1.1.10';

  /* ── 공통: 파일명 ───────────────────────────────────────── */
  function buildFileName(title, domain, ext) {
    const safe = (s) => String(s || '').replace(/[^\w가-힣]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const d = new Date().toISOString().slice(0, 10);
    const base = safe(title || '생각지도');
    const dom = domain ? '_' + safe(domain) : '';
    return base + dom + '_' + d + '.' + ext;
  }

  /* ── 공통: 다운로드 ─────────────────────────────────────── */
  function downloadBlob(content, filename, mime) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  /* ── 공통: ASCII 숙달도·응답 크기 바 ─────────────────────── */
  function asciiBar(value, max, length) {
    length = length || 20;
    max = max || 100;
    const v = Math.max(0, Math.min(max, value || 0));
    const filled = Math.round((v / max) * length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
  }

  /* ── 공통: HTML 이스케이프 ───────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* ── 공통: 노드 그룹화 (cat 또는 subject) ─────────────────── */
  function groupBy(nodes, key) {
    const groups = {};
    for (const n of nodes) {
      const k = n[key] || '기타';
      if (!groups[k]) groups[k] = [];
      groups[k].push(n);
    }
    return groups;
  }

  /* ── 공통: 노드 데이터 → 본문 한 줄 ───────────────────────── */
  function nodeSummaryLine(n) {
    const parts = [];
    if (n.by) parts.push(n.by);
    if (n.time) parts.push(n.time);
    else if (n.lastSeen) parts.push(String(n.lastSeen).slice(0, 10));
    if (n.depth !== undefined) parts.push('◐ ' + n.depth);
    if (n.comments !== undefined) parts.push('댓글 ' + n.comments);
    if (n.views !== undefined) parts.push('조회 ' + n.views);
    return parts.join(' · ');
  }

  /* ════════════════════════════════════════════════════════
     1. JSON — 완전 백업 / 재가져오기 가능
     ════════════════════════════════════════════════════════ */
  function exportToJSON(map) {
    const data = {
      _meta: {
        yeon_thinkmap_version: '1.0',
        yeon_export_version: YEON_EXPORT_VERSION,
        exported_at: new Date().toISOString(),
        title: map.config.options.title,
        tagline: map.config.options.tagline,
        node_count: map.nodes.length,
        edge_count: map.edges.length,
      },
      categories: map.config.categories,
      nodes: map.nodes.map(n => {
        const o = Object.assign({}, n);
        delete o._x; delete o._y; delete o._vx; delete o._vy; delete o._radius;
        return o;
      }),
      edges: map.edges.slice(),
      settings: { view: Object.assign({}, map.state.view) },
    };
    return JSON.stringify(data, null, 2);
  }

  /* ════════════════════════════════════════════════════════
     2. Markdown — YAML frontmatter + Wiki Link
     ════════════════════════════════════════════════════════ */
  function exportToMarkdown(map, opts) {
    opts = opts || {};
    const o = map.config.options;
    const cats = map.config.categories;
    const today = new Date().toISOString().slice(0, 10);

    const tags = ['생각의지도', 'yeon-thinkmap'];
    for (const k of Object.keys(cats)) tags.push(k);

    const lines = [];
    // YAML frontmatter
    lines.push('---');
    lines.push('title: ' + (o.title || '생각의 지도'));
    if (opts.domain) lines.push('domain: ' + opts.domain);
    lines.push('exported_at: ' + new Date().toISOString());
    lines.push('node_count: ' + map.nodes.length);
    lines.push('edge_count: ' + map.edges.length);
    lines.push('tags: [' + tags.map(t => '"' + t + '"').join(', ') + ']');
    lines.push('---');
    lines.push('');
    // 본문
    lines.push('# ' + (o.title || '생각의 지도'));
    lines.push('');
    lines.push('> ' + (o.tagline || '내 생각을 키워보세요'));
    lines.push('');
    lines.push('내보낸 날짜: **' + today + '**  ·  생각 **' + map.nodes.length + '개**  ·  연결 **' + map.edges.length + '개**');
    lines.push('');

    // 카테고리별 그룹
    for (const [key, info] of Object.entries(cats)) {
      const inCat = map.nodes.filter(n => n.cat === key);
      if (!inCat.length) continue;
      lines.push('## ' + (info.label || key) + ' (' + inCat.length + ')');
      lines.push('');
      for (const n of inCat) {
        lines.push('#### [[' + (n.label || '제목 없음') + ']]');
        const meta = nodeSummaryLine(n);
        if (meta) lines.push('*' + meta + '*');
        lines.push('');
        if (n.body) {
          lines.push('> ' + n.body.replace(/\n/g, '\n> '));
          lines.push('');
        }
        // 응답 크기 또는 숙달도 ASCII 바
        if (n.size !== undefined) {
          const pct = Math.round(((n.size - 0.5) / 1.5) * 100);
          lines.push('- 응답 크기: ' + asciiBar(pct, 100, 20) + ' ' + n.size.toFixed(2));
        }
        if (n.mastery !== undefined) {
          lines.push('- 숙달도: ' + asciiBar(n.mastery, 100, 20) + ' ' + Math.round(n.mastery));
        }
        if (n.depth !== undefined) lines.push('- ◐ 좋은물음: ' + n.depth);
        if (n.comments !== undefined) lines.push('- 댓글: ' + n.comments);
        if (n.views !== undefined) lines.push('- 조회: ' + n.views);
        if (n.attempts !== undefined) lines.push('- 시도: ' + n.attempts + '회');

        // 연결된 노드 (wiki link)
        const neighbors = [];
        for (const e of map.edges) {
          const a = e.from != null ? e.from : (e.a != null ? e.a : e[0]);
          const b = e.to != null ? e.to : (e.b != null ? e.b : e[1]);
          if (a === n.id) neighbors.push(b);
          else if (b === n.id) neighbors.push(a);
        }
        if (neighbors.length) {
          const labels = neighbors
            .map(id => map.nodes.find(x => x.id === id))
            .filter(Boolean)
            .map(t => '[[' + (t.label || '제목 없음') + ']]');
          if (labels.length) lines.push('- 연결: ' + labels.join(', '));
        }
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('*yeon-thinkmap export ' + YEON_EXPORT_VERSION + '*');
    return lines.join('\n');
  }

  /* ════════════════════════════════════════════════════════
     3. HTML — 인라인 스타일, 폰트 CDN, 인쇄 최적화
     ════════════════════════════════════════════════════════ */
  function buildHTMLDocument(map, opts) {
    opts = opts || {};
    const o = map.config.options;
    const cats = map.config.categories;
    const today = new Date().toISOString().slice(0, 10);

    const sections = [];
    for (const [key, info] of Object.entries(cats)) {
      const inCat = map.nodes.filter(n => n.cat === key);
      if (!inCat.length) continue;
      const col = info.color || '#888';
      const nodeBlocks = inCat.map(n => {
        const meta = nodeSummaryLine(n);
        const bodyHtml = n.body ? '<blockquote>' + esc(n.body).replace(/\n/g, '<br>') + '</blockquote>' : '';
        const statsList = [];
        if (n.size !== undefined) statsList.push('응답 크기 ' + n.size.toFixed(2));
        if (n.mastery !== undefined) statsList.push('숙달도 ' + Math.round(n.mastery));
        if (n.depth !== undefined) statsList.push('◐ 좋은물음 ' + n.depth);
        if (n.comments !== undefined) statsList.push('댓글 ' + n.comments);
        if (n.views !== undefined) statsList.push('조회 ' + n.views);
        if (n.attempts !== undefined) statsList.push('시도 ' + n.attempts);
        const statsHtml = statsList.length
          ? '<p class="stats">' + statsList.map(esc).join(' · ') + '</p>' : '';
        return `
          <article class="node" style="border-left-color:${col}">
            <h3>${esc(n.label || '제목 없음')}</h3>
            ${meta ? '<p class="meta">' + esc(meta) + '</p>' : ''}
            ${bodyHtml}
            ${statsHtml}
          </article>`;
      }).join('');
      sections.push(`
        <section>
          <h2 style="color:${col}">${esc(info.label || key)} <span class="count">(${inCat.length})</span></h2>
          ${nodeBlocks}
        </section>`);
    }

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${esc(o.title || '생각의 지도')} — ${today}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet">
<style>
  body { font-family: 'Pretendard', sans-serif; max-width: 760px; margin: 40px auto; padding: 0 24px; line-height: 1.7; color: #1a2326; }
  h1 { font-family: 'Noto Serif KR', serif; font-size: 30px; margin-bottom: 4px; }
  .tagline { color: #6e7378; font-family: 'Noto Serif KR', serif; font-size: 14px; margin-bottom: 8px; }
  .summary { color: #888; font-size: 13px; padding-bottom: 24px; border-bottom: 1px solid #e0ddd2; margin-bottom: 32px; }
  h2 { font-family: 'Noto Serif KR', serif; font-size: 22px; margin: 36px 0 14px; padding-bottom: 6px; border-bottom: 2px solid currentColor; }
  .count { color: #999; font-size: 14px; font-weight: 400; }
  .node { border-left: 4px solid #ddd; padding: 12px 16px; margin: 14px 0; background: #faf8f3; border-radius: 0 6px 6px 0; break-inside: avoid; page-break-inside: avoid; }
  .node h3 { font-family: 'Noto Serif KR', serif; font-size: 17px; margin: 0 0 6px; }
  .meta { color: #888; font-size: 12px; margin: 0 0 8px; font-style: italic; }
  blockquote { margin: 8px 0; padding: 8px 14px; background: white; border-left: 3px solid #ccc; font-size: 14px; }
  .stats { font-size: 12px; color: #666; margin: 6px 0 0; font-family: ui-monospace, monospace; }
  footer { margin-top: 50px; padding-top: 16px; border-top: 1px solid #e0ddd2; color: #999; font-size: 11px; text-align: center; }
  @media print {
    body { max-width: 100%; padding: 0; margin: 0; font-size: 11pt; }
    .node { background: none; }
    h2 { page-break-after: avoid; }
  }
</style>
</head>
<body>
  <h1>${esc(o.title || '생각의 지도')}</h1>
  <div class="tagline">${esc(o.tagline || '')}</div>
  <p class="summary">내보낸 날짜: <strong>${today}</strong>  ·  생각 <strong>${map.nodes.length}개</strong>  ·  연결 <strong>${map.edges.length}개</strong></p>
  ${sections.join('')}
  <footer>yeon-thinkmap export ${YEON_EXPORT_VERSION} · y-life.kr</footer>
</body>
</html>`;
  }

  function exportToHTML(map) {
    return buildHTMLDocument(map);
  }

  /* ════════════════════════════════════════════════════════
     4. Word (.doc) — HTML + MS Word XMLNS
     ════════════════════════════════════════════════════════ */
  function exportToWord(map) {
    const html = buildHTMLDocument(map);
    // <html> 태그에 MS Word 네임스페이스 추가 — 더블클릭 시 워드(한글)에서 자동 인식
    return html.replace(
      '<html lang="ko">',
      '<html lang="ko" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
    );
  }

  /* ════════════════════════════════════════════════════════
     5. PDF — 새 창에서 HTML 렌더 → 자동 인쇄 다이얼로그
     ════════════════════════════════════════════════════════ */
  function exportToPDF(map) {
    const html = buildHTMLDocument(map);
    const win = window.open('', '_blank');
    if (!win) {
      alert('팝업 차단 해제 후 다시 시도해 주세요. 새 창에서 PDF로 저장 다이얼로그가 떠야 합니다.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    // 폰트 로드 시간 확보 후 인쇄 다이얼로그
    setTimeout(() => {
      try { win.focus(); win.print(); } catch (e) {}
    }, 800);
  }

  /* ════════════════════════════════════════════════════════
     6. Obsidian Vault — 도메인(카테고리)별 .md + index.md
        JSZip 필요 — 없으면 첫 페이지(index.md) + 합본 .md 폴백
     ════════════════════════════════════════════════════════ */
  function exportToVault(map) {
    const o = map.config.options;
    const cats = map.config.categories;
    const today = new Date().toISOString().slice(0, 10);
    const safe = (s) => String(s || '').replace(/[^\w가-힣]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const vaultName = safe(o.title || '생각지도') + '_vault_' + today;

    // ── 카테고리별 .md 내용 만들기 ──
    const files = {}; // path → content
    const indexLinks = [];

    for (const [key, info] of Object.entries(cats)) {
      const inCat = map.nodes.filter(n => n.cat === key);
      if (!inCat.length) continue;
      const lines = [];
      lines.push('---');
      lines.push('title: ' + (info.label || key));
      lines.push('cat: ' + key);
      lines.push('node_count: ' + inCat.length);
      lines.push('tags: ["' + key + '", "yeon-thinkmap"]');
      lines.push('---');
      lines.push('');
      lines.push('# ' + (info.label || key));
      lines.push('');
      lines.push('← [[index]]');
      lines.push('');
      for (const n of inCat) {
        lines.push('## ' + (n.label || '제목 없음'));
        const meta = nodeSummaryLine(n);
        if (meta) lines.push('*' + meta + '*');
        lines.push('');
        if (n.body) { lines.push('> ' + n.body.replace(/\n/g, '\n> ')); lines.push(''); }
        if (n.mastery !== undefined) lines.push('- 숙달도: ' + asciiBar(n.mastery, 100, 20) + ' ' + Math.round(n.mastery));
        if (n.size !== undefined) lines.push('- 응답 크기: ' + n.size.toFixed(2));
        if (n.depth !== undefined) lines.push('- ◐ 좋은물음: ' + n.depth);
        if (n.comments !== undefined) lines.push('- 댓글: ' + n.comments);
        if (n.views !== undefined) lines.push('- 조회: ' + n.views);

        // 백링크
        const neighbors = [];
        for (const e of map.edges) {
          const a = e.from != null ? e.from : (e.a != null ? e.a : e[0]);
          const b = e.to != null ? e.to : (e.b != null ? e.b : e[1]);
          if (a === n.id) neighbors.push(b);
          else if (b === n.id) neighbors.push(a);
        }
        if (neighbors.length) {
          const labels = neighbors
            .map(id => map.nodes.find(x => x.id === id))
            .filter(Boolean)
            .map(t => '[[' + (t.label || '제목 없음') + ']]');
          if (labels.length) { lines.push(''); lines.push('연결: ' + labels.join(', ')); }
        }
        lines.push('');
      }
      const fname = safe(info.label || key) + '.md';
      files[fname] = lines.join('\n');
      indexLinks.push({ name: info.label || key, file: fname, count: inCat.length, color: info.color });
    }

    // ── index.md ──
    const indexLines = [];
    indexLines.push('---');
    indexLines.push('title: ' + (o.title || '생각의 지도'));
    indexLines.push('exported_at: ' + new Date().toISOString());
    indexLines.push('node_count: ' + map.nodes.length);
    indexLines.push('edge_count: ' + map.edges.length);
    indexLines.push('tags: ["yeon-thinkmap", "index"]');
    indexLines.push('---');
    indexLines.push('');
    indexLines.push('# ' + (o.title || '생각의 지도'));
    indexLines.push('');
    indexLines.push('> ' + (o.tagline || '내 생각을 키워보세요'));
    indexLines.push('');
    indexLines.push('생각 **' + map.nodes.length + '개** · 연결 **' + map.edges.length + '개** · 내보낸 날짜 **' + today + '**');
    indexLines.push('');
    indexLines.push('## 카테고리');
    indexLines.push('');
    for (const il of indexLinks) {
      indexLines.push('- [[' + il.file.replace(/\.md$/, '') + ']] (' + il.count + ')');
    }
    indexLines.push('');
    indexLines.push('---');
    indexLines.push('*yeon-thinkmap vault export ' + YEON_EXPORT_VERSION + '*');
    files['index.md'] = indexLines.join('\n');

    // ── ZIP 묶기 (JSZip 있으면) ──
    if (global.JSZip) {
      const zip = new global.JSZip();
      const folder = zip.folder(vaultName);
      for (const [name, content] of Object.entries(files)) {
        folder.file(name, content);
      }
      zip.generateAsync({ type: 'blob' }).then(blob => {
        downloadBlob(blob, vaultName + '.zip', 'application/zip');
      });
    } else {
      // ── 폴백: 모든 .md 를 한 파일로 합쳐서 안내 ──
      const combined = Object.entries(files)
        .map(([name, c]) => `\n\n<!-- FILE: ${name} -->\n\n` + c)
        .join('\n\n----\n\n');
      const note = '<!-- JSZip이 로드되지 않아 한 파일로 합쳤습니다. 원하시면 페이지에 JSZip CDN을 추가하세요. -->\n\n';
      downloadBlob(note + combined, vaultName + '_합본.md', 'text/markdown');
    }
  }

  /* ════════════════════════════════════════════════════════
     공개 API — 통합 진입점
     ════════════════════════════════════════════════════════ */
  function exportAndDownload(map, format, opts) {
    opts = opts || {};
    const title = map.config.options.title || '생각지도';
    const domain = opts.domain || '광장';

    if (format === 'json') {
      downloadBlob(exportToJSON(map), buildFileName(title, domain, 'json'), 'application/json');
    } else if (format === 'md' || format === 'markdown') {
      downloadBlob(exportToMarkdown(map, { domain: domain }), buildFileName(title, domain, 'md'), 'text/markdown');
    } else if (format === 'html') {
      downloadBlob(exportToHTML(map), buildFileName(title, domain, 'html'), 'text/html');
    } else if (format === 'doc' || format === 'word') {
      downloadBlob(exportToWord(map), buildFileName(title, domain, 'doc'), 'application/msword');
    } else if (format === 'pdf') {
      exportToPDF(map);
    } else if (format === 'vault' || format === 'obsidian') {
      exportToVault(map);
    } else {
      throw new Error('Unknown export format: ' + format);
    }
  }

  /* ── 글로벌 노출 ─────────────────────────────────────────── */
  global.YeonExporters = {
    VERSION: YEON_EXPORT_VERSION,
    exportAndDownload: exportAndDownload,
    exportToJSON: exportToJSON,
    exportToMarkdown: exportToMarkdown,
    exportToHTML: exportToHTML,
    exportToWord: exportToWord,
    exportToPDF: exportToPDF,
    exportToVault: exportToVault,
    buildFileName: buildFileName,
  };
})(window);
