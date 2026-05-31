/*
 * 연라이프 내보내기 — 6형식 (YLV-4 §23 = YUV4 §22 v1.1.10)
 * ───────────────────────────────────────────────────────────
 * 형식: 📝 Markdown · 🌐 HTML · 📄 Word · 📕 PDF · 📦 JSON · 📚 Obsidian Vault
 * 사용처: 칼럼 페이지·아골라 글·개인 스크랩북
 *
 * 사용법:
 *   <script src="data/exporters.js" defer></script>
 *   window.YEON_EXPORT.attachTo(targetElement, articleData)
 *     → 자동으로 6형식 버튼 그리고 클릭 시 다운로드
 */
(function(){
  'use strict';

  // ── 파일명 규칙 (YLV-4 §23-1) ────────────────────────
  function buildFilename(article, ext){
    const domain = article.persona?.field || '글';
    const date = (article.date || new Date().toISOString().slice(0,10)).replace(/-/g,'-');
    return `연라이프_${domain}_${date}.${ext}`.replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ.\-_]/g,'_');
  }

  // ── 다운로드 헬퍼 ────────────────────────────────────
  function download(filename, content, mime){
    const blob = (content instanceof Blob) ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 100);
  }

  // ── 1. Markdown ──────────────────────────────────────
  function toMarkdown(article){
    const lines = [];
    // YAML frontmatter
    lines.push('---');
    lines.push(`title: "${escapeYaml(article.title)}"`);
    lines.push(`author: "${escapeYaml(article.persona?.name || '연라이프')}"`);
    lines.push(`role: "${escapeYaml(article.persona?.role || '')}"`);
    lines.push(`date: "${article.date}"`);
    lines.push(`category: "${article.category || ''}"`);
    if (article.trust?.score != null) lines.push(`trust_score: ${article.trust.score}`);
    lines.push(`source_url: "https://y-life.kr/블로그_페르소나_칼럼.html?slug=${article.slug}&post=${article.post_id}"`);
    lines.push(`tags: [${(article.tags||[]).map(t => `"${t}"`).join(', ')}]`);
    lines.push(`yeon_version: "YLV-4"`);
    lines.push('---');
    lines.push('');
    lines.push(`#### [[${article.title}]]`);
    lines.push('');
    if (article.subtitle) lines.push(`*${article.subtitle}*`);
    lines.push('');
    // HTML → Markdown 변환
    lines.push(htmlToMd(article.body_html || ''));
    lines.push('');
    if ((article.sources||[]).length) {
      lines.push('## 인용 출처');
      article.sources.forEach((s, i) => lines.push(`${i+1}. [${s.title}](${s.url || '#'})`));
    }
    lines.push('');
    lines.push('---');
    lines.push(`*이 글은 ${article.persona?.role || '연라이프'} ${article.persona?.name || ''}이(가) 작성한 의견·해설입니다. 사실 보도가 아닙니다.*`);
    return lines.join('\n');
  }

  function htmlToMd(html){
    let s = String(html || '');
    s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
    s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
    s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (m, body) => '\n> ' + body.replace(/<\/?p[^>]*>/g,'').replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, ' — $1').trim().replace(/\n/g,'\n> ') + '\n');
    s = s.replace(/<p[^>]*class=["']pullquote["'][^>]*>([\s\S]*?)<\/p>/gi, '\n> **$1**\n');
    s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
    s = s.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
    s = s.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
    s = s.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<[^>]+>/g, '');
    s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
    s = s.replace(/\n{3,}/g, '\n\n');
    return s.trim();
  }
  function escapeYaml(s){ return String(s||'').replace(/"/g,'\\"'); }

  // ── 2. HTML ──────────────────────────────────────────
  function toHTML(article){
    return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<title>${escapeHtml(article.title)} · 연라이프</title>
<meta name="author" content="${escapeHtml(article.persona?.name||'')}">
<meta name="description" content="${escapeHtml(article.subtitle||'')}">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Pretendard:wght@400;500;700&display=swap" rel="stylesheet">
<style>
body{font-family:'Pretendard',sans-serif;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.85;color:#1f2a2a;background:#fbf8f1}
h1{font-family:'Noto Serif KR',serif;font-size:36px;font-weight:900;letter-spacing:-.025em;margin-bottom:8px}
.subtitle{color:#536060;font-style:italic;font-family:'Noto Serif KR',serif;font-size:18px;margin-bottom:24px}
.meta{font-size:12px;color:#7b8686;border-bottom:1px solid #d7d1c5;padding-bottom:14px;margin-bottom:24px}
.body{font-family:'Noto Serif KR',serif;font-size:17px}
.body h2{font-size:22px;color:#2f5d62;margin:32px 0 12px}
.body blockquote{border-left:3px solid #427a71;padding:12px 18px;background:rgba(66,122,113,.06);margin:20px 0;font-style:italic}
.body .pullquote{font-size:22px;font-weight:700;text-align:center;color:#2f5d62;padding:20px;border-top:1px solid #d7d1c5;border-bottom:1px solid #d7d1c5;margin:24px 0}
.sources{margin-top:32px;padding-top:18px;border-top:1px solid #d7d1c5;font-family:'Pretendard',sans-serif;font-size:13px}
.sources h3{font-size:13px;color:#536060;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
.disclaimer{margin-top:20px;padding:12px 16px;background:rgba(195,141,86,.08);border-left:3px solid #c38d56;font-size:12px;color:#536060;font-family:'Pretendard',sans-serif}
@media print{body{margin:0}.disclaimer,.sources{page-break-inside:avoid}}
</style></head><body>
<h1>${escapeHtml(article.title)}</h1>
${article.subtitle?`<div class="subtitle">${escapeHtml(article.subtitle)}</div>`:''}
<div class="meta">${escapeHtml(article.persona?.name||'')} · ${escapeHtml(article.persona?.role||'')} · ${escapeHtml(article.date||'')}${article.trust?.score?` · 신뢰도 ${article.trust.score}/100`:''}</div>
<div class="body">${article.body_html||''}</div>
${(article.sources||[]).length?`<div class="sources"><h3>인용 출처</h3><ol>${article.sources.map(s=>`<li><a href="${escapeHtml(s.url||'#')}">${escapeHtml(s.title||s.url)}</a></li>`).join('')}</ol></div>`:''}
<div class="disclaimer">이 글은 ${escapeHtml(article.persona?.name||'연라이프')}의 의견·해설입니다. 사실 보도가 아닙니다. 원본: <a href="https://y-life.kr/블로그_페르소나_칼럼.html?slug=${escapeHtml(article.slug)}&post=${escapeHtml(article.post_id)}">y-life.kr</a></div>
</body></html>`;
  }

  // ── 3. Word (.doc) — HTML 기반 ───────────────────────
  function toWord(article){
    const html = toHTML(article);
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
  }

  // ── 4. PDF — 새 창에서 print ─────────────────────────
  function toPDF(article){
    const html = toHTML(article);
    const w = window.open('', '_blank');
    if (!w) { alert('팝업이 차단되었어요. 팝업 허용 후 다시 눌러주세요.'); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  }

  // ── 5. JSON ──────────────────────────────────────────
  function toJSON(article){
    return JSON.stringify({
      _meta: {
        yeon_version: 'YLV-4',
        yuv_version: 'YUV4',
        exported_at: new Date().toISOString(),
        source: 'https://y-life.kr',
        format_version: '1.1.10',
      },
      article: {
        slug: article.slug,
        post_id: article.post_id,
        title: article.title,
        kicker: article.kicker,
        subtitle: article.subtitle,
        body_html: article.body_html,
        date: article.date,
        category: article.category,
        tags: article.tags || [],
        persona: {
          name: article.persona?.name,
          role: article.persona?.role,
          field: article.persona?.field,
          slug: article.slug,
        },
        sources: article.sources || [],
        trust: article.trust || null,
        ai_generated: article.ai_generated !== false,
      },
    }, null, 2);
  }

  // ── 6. Obsidian Vault — 도메인별 .md + index.md ───────
  function toVaultZip(article){
    // 호스팅 시 JSZip 으로 실 구현. 지금은 안내 + 단일 .md 다운로드로 폴백.
    alert('Obsidian Vault 형식은 JSZip 라이브러리가 필요해요. 일단 Markdown으로 받으시면 옵시디언에서 바로 열 수 있어요.');
    const md = toMarkdown(article);
    download(buildFilename(article, 'md'), md, 'text/markdown;charset=utf-8');
  }

  // ── 헬퍼 ─────────────────────────────────────────────
  function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  // ── 공개 API ─────────────────────────────────────────
  const YEON_EXPORT = {
    toMarkdown, toHTML, toWord, toJSON, toVaultZip, toPDF,

    /** 6형식 버튼을 자동으로 그려서 target 에 붙임 */
    attachTo(target, getArticle){
      if (!target) return;
      const box = document.createElement('div');
      box.className = 'yeon-export-box';
      box.innerHTML = `
        <style>
          .yeon-export-box{margin:28px auto;max-width:720px;padding:18px 22px;background:#fbf8f1;border:1px solid rgba(31,42,42,.08);border-radius:14px;font-family:'Pretendard','Apple SD Gothic Neo',sans-serif}
          .yeon-export-box h4{font-family:'Noto Serif KR',serif;font-size:13px;color:#536060;letter-spacing:.08em;text-transform:uppercase;font-weight:700;margin-bottom:12px}
          .yeon-export-btns{display:flex;gap:8px;flex-wrap:wrap}
          .yeon-export-btn{appearance:none;border:1px solid #d7d1c5;background:#fff;color:#1f2a2a;padding:8px 14px;border-radius:999px;font:inherit;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;gap:6px}
          .yeon-export-btn:hover{border-color:#2f5d62;color:#2f5d62}
          .yeon-export-foot{margin-top:12px;font-size:11.5px;color:#7b8686;line-height:1.7}
        </style>
        <h4>📤 이 글 내보내기 — 6형식</h4>
        <div class="yeon-export-btns">
          <button class="yeon-export-btn" data-fmt="md">📝 Markdown</button>
          <button class="yeon-export-btn" data-fmt="html">🌐 HTML</button>
          <button class="yeon-export-btn" data-fmt="word">📄 Word</button>
          <button class="yeon-export-btn" data-fmt="pdf">📕 PDF</button>
          <button class="yeon-export-btn" data-fmt="json">📦 JSON</button>
          <button class="yeon-export-btn" data-fmt="vault">📚 Obsidian Vault</button>
        </div>
        <div class="yeon-export-foot">본인이 읽은 글을 외부로 가져가세요. 본 데이터에는 다른 사용자 정보가 절대 섞이지 않습니다. 형식 표준: YLV-4 §23 v1.1.10.</div>
      `;
      box.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-fmt]');
        if (!btn) return;
        const article = (typeof getArticle === 'function') ? getArticle() : getArticle;
        if (!article) return;
        const fmt = btn.dataset.fmt;
        try {
          switch(fmt){
            case 'md':    download(buildFilename(article, 'md'),   toMarkdown(article), 'text/markdown;charset=utf-8'); break;
            case 'html':  download(buildFilename(article, 'html'), toHTML(article), 'text/html;charset=utf-8'); break;
            case 'word':  download(buildFilename(article, 'doc'),  toWord(article), 'application/msword;charset=utf-8'); break;
            case 'pdf':   toPDF(article); break;
            case 'json':  download(buildFilename(article, 'json'), toJSON(article), 'application/json;charset=utf-8'); break;
            case 'vault': toVaultZip(article); break;
          }
        } catch (err) {
          console.error('[exporters]', err);
          alert('내보내기 중 문제가 생겼어요. 새로고침 후 다시 시도해 주세요.');
        }
      });
      target.appendChild(box);
    },
  };

  window.YEON_EXPORT = YEON_EXPORT;
})();
