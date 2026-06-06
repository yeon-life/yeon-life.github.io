/* =====================================================================
   연라이프 통합 검색 — 글 · 제목 · 카테고리 · 블로그 · 작가
   ---------------------------------------------------------------------
   1단계(지금): y-life.kr 홈 콘텐츠 색인 = YL_PERSONAS(작가+글목록) + YL_ARTICLES_TODAY(본문)
   2단계(확장): window.YL_SEARCH_FEEDS = ['https://yeon-science.web.app/search-index.json', ...]
                각 잡지·도서관이 search-index.json(아래 item 형식)을 내보내면 자동 병합.
   자체완결: CSS 주입 + window.YeonSearch.open()/close(). 외부 의존 없음.
   ===================================================================== */
(function(){
  'use strict';
  function esc(s){return (s==null?'':String(s)).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
  function stripHTML(h){ var d=document.createElement('div'); d.innerHTML=h||''; return (d.textContent||d.innerText||'').replace(/\s+/g,' ').trim(); }
  var CATLABEL={ good:'좋은 생각', 'must-know':'꼭 알아야', caution:'주의 깊게' };

  /* ---------- 색인 만들기 ---------- */
  var INDEX=[];
  function buildIndex(){
    INDEX=[];
    var P=window.YL_PERSONAS||[];
    var A=window.YL_ARTICLES_TODAY||{};
    P.forEach(function(p){
      // 작가/블로그 항목
      INDEX.push({
        kind:'author', title:p.name, sub:(p.role||'')+(p.field?(' · '+p.field):''),
        author:p.name, authorSlug:p.slug, field:p.field||'', cat:'',
        url:'블로그_페르소나_칼럼.html?slug='+encodeURIComponent(p.slug),
        text:((p.name||'')+' '+(p.hanja||'')+' '+(p.field||'')+' '+(p.role||'')+' '+((p.focus||[]).join(' '))+' '+(p.tagline||'')+' '+(p.bio||'')).toLowerCase()
      });
      // 글 항목
      (p.posts||[]).forEach(function(post){
        var art=A[p.slug+'|'+post.id]||{};
        var body=art.body?stripHTML(art.body):'';
        var catKo=CATLABEL[art.category]||'';
        INDEX.push({
          kind:'post', title:post.title, sub:post.excerpt||post.kicker||'',
          author:p.name, authorSlug:p.slug, field:p.field||'', cat:catKo,
          date:post.date||'',
          url:'블로그_페르소나_칼럼.html?slug='+encodeURIComponent(p.slug)+'&post='+encodeURIComponent(post.id),
          text:((post.title||'')+' '+(post.excerpt||'')+' '+(post.kicker||'')+' '+body+' '+(p.name||'')+' '+(p.field||'')+' '+catKo+' '+((p.focus||[]).join(' '))).toLowerCase()
        });
      });
    });
    // 카테고리 항목(작가 field 모음)
    var fields={};
    P.forEach(function(p){ if(p.field) fields[p.field]=(fields[p.field]||0)+1; });
    Object.keys(fields).forEach(function(f){
      INDEX.push({ kind:'category', title:f, sub:'카테고리 · '+fields[f]+'명의 필진', field:f, author:'', authorSlug:'', cat:'',
        url:'블로그_AI작가기자_인덱스.html#'+encodeURIComponent(f), text:('카테고리 '+f).toLowerCase() });
    });
    // 외부 주입(2단계)
    if(Array.isArray(window.YL_SEARCH_EXTRA)) window.YL_SEARCH_EXTRA.forEach(function(it){ if(it&&it.title) INDEX.push(normalize(it)); });
  }
  function normalize(it){
    return { kind:it.kind||'post', title:it.title, sub:it.sub||it.excerpt||'', author:it.author||'', authorSlug:it.authorSlug||'',
      field:it.field||it.source||'', cat:it.cat||'', date:it.date||'', url:it.url||'#',
      text:((it.title||'')+' '+(it.sub||it.excerpt||'')+' '+(it.body||'')+' '+(it.author||'')+' '+(it.field||'')+' '+(it.source||'')).toLowerCase(), source:it.source||'' };
  }
  // 2단계 피드(있으면 비동기 병합)
  function loadFeeds(){
    var feeds=window.YL_SEARCH_FEEDS; if(!Array.isArray(feeds)||!feeds.length) return;
    feeds.forEach(function(u){
      fetch(u).then(function(r){return r.json();}).then(function(arr){
        if(Array.isArray(arr)){ arr.forEach(function(it){ if(it&&it.title) INDEX.push(normalize(it)); }); if(lastQ) runSearch(lastQ); }
      }).catch(function(){});
    });
  }

  /* ---------- 검색 ---------- */
  function search(q){
    q=(q||'').trim().toLowerCase(); if(!q) return [];
    var toks=q.split(/\s+/).filter(Boolean);
    var res=[];
    for(var i=0;i<INDEX.length;i++){
      var it=INDEX[i], ok=true, score=0;
      for(var t=0;t<toks.length;t++){ if(it.text.indexOf(toks[t])<0){ ok=false; break; } }
      if(!ok) continue;
      // 점수: 제목/이름 우선
      var titleL=(it.title||'').toLowerCase();
      toks.forEach(function(tk){ if(titleL.indexOf(tk)>=0) score+=10; });
      if(it.kind==='author') score+=3; if(it.kind==='post') score+=2;
      it._s=score; res.push(it);
    }
    res.sort(function(a,b){ return b._s-a._s; });
    return res.slice(0,40);
  }

  /* ---------- UI ---------- */
  var ov=null, input=null, listEl=null, lastQ='';
  var KIND={ post:{label:'글', c:'#2f5d62'}, author:{label:'작가·블로그', c:'#427a71'}, category:{label:'카테고리', c:'#c38d56'} };
  function ensure(){
    if(ov) return;
    var css=''
      +'.yls-ov{position:fixed;inset:0;z-index:9000;background:rgba(28,24,18,.5);opacity:0;visibility:hidden;transition:opacity .18s;display:flex;justify-content:center;align-items:flex-start;padding:8vh 16px 16px}'
      +'.yls-ov.on{opacity:1;visibility:visible}'
      +'.yls-box{width:min(680px,100%);background:#fbf8f3;border-radius:18px;box-shadow:0 30px 80px rgba(28,24,18,.35);overflow:hidden;display:flex;flex-direction:column;max-height:84vh;transform:translateY(-8px);transition:transform .18s;font-family:inherit}'
      +'.yls-ov.on .yls-box{transform:none}'
      +'.yls-top{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #ece5d9}'
      +'.yls-top svg{width:20px;height:20px;stroke:#6f6a62;stroke-width:1.8;fill:none;stroke-linecap:round;flex:0 0 auto}'
      +'.yls-top input{flex:1;border:none;background:none;outline:none;font-family:inherit;font-size:1.05rem;color:#2c2a27}'
      +'.yls-x{background:none;border:none;color:#9a948b;cursor:pointer;font-size:1.3rem;line-height:1;padding:2px 6px}'
      +'.yls-hint{padding:7px 18px;font-size:.74rem;color:#9a948b;border-bottom:1px solid #f0ebe0;background:#f7f3ea}'
      +'.yls-list{overflow-y:auto;padding:6px}'
      +'.yls-row{display:block;text-decoration:none;color:inherit;padding:12px 14px;border-radius:12px}'
      +'.yls-row:hover,.yls-row.sel{background:#eef3ee}'
      +'.yls-r1{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
      +'.yls-kind{font-size:.64rem;font-weight:700;color:#fff;border-radius:999px;padding:2px 8px;flex:0 0 auto}'
      +'.yls-title{font-family:"Noto Serif KR",serif;font-weight:700;font-size:1.02rem;color:#1f2a28}'
      +'.yls-title b{color:#2f5d62;background:#e7efe9}'
      +'.yls-sub{font-size:.86rem;color:#6f6a62;margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'
      +'.yls-meta{font-size:.74rem;color:#9a948b;margin-top:5px}'
      +'.yls-empty{padding:34px 18px;text-align:center;color:#9a948b;font-size:.94rem}'
      +'.yls-foot{padding:9px 18px;font-size:.72rem;color:#b8b1a6;border-top:1px solid #f0ebe0;text-align:center}';
    var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    ov=document.createElement('div'); ov.className='yls-ov';
    ov.innerHTML='<div class="yls-box">'
      +'<div class="yls-top"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>'
      +'<input type="text" placeholder="글 · 제목 · 카테고리 · 블로그 · 작가 검색" aria-label="연라이프 검색"/>'
      +'<button class="yls-x" aria-label="닫기">✕</button></div>'
      +'<div class="yls-hint">엔터·클릭으로 이동 · ↑↓ 이동 · Esc 닫기</div>'
      +'<div class="yls-list" id="ylsList"></div>'
      +'<div class="yls-foot">연라이프 안의 글·작가·블로그를 검색합니다 · 잡지·도서관은 순차 연결됩니다</div></div>';
    document.body.appendChild(ov);
    input=ov.querySelector('input'); listEl=ov.querySelector('#ylsList');
    ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
    ov.querySelector('.yls-x').addEventListener('click',close);
    input.addEventListener('input',function(){ runSearch(input.value); });
    input.addEventListener('keydown',onKey);
  }
  var sel=-1, rows=[];
  function runSearch(q){
    lastQ=q; var res=search(q);
    if(!q.trim()){ listEl.innerHTML='<div class="yls-empty">찾고 싶은 글·작가·카테고리를 입력하세요.</div>'; rows=[]; sel=-1; return; }
    if(!res.length){ listEl.innerHTML='<div class="yls-empty">‘'+esc(q)+'’ 에 대한 결과가 없어요.</div>'; rows=[]; sel=-1; return; }
    var qToks=q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    function hi(s){ s=esc(s||''); qToks.forEach(function(t){ if(t) s=s.replace(new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<b>$1</b>'); }); return s; }
    listEl.innerHTML=res.map(function(it){
      var k=KIND[it.kind]||{label:it.source||'글',c:'#888'};
      var meta=[]; if(it.author&&it.kind==='post')meta.push(esc(it.author)); if(it.field)meta.push(esc(it.field)); if(it.cat)meta.push(esc(it.cat)); if(it.date)meta.push(esc(it.date));
      return '<a class="yls-row" href="'+esc(it.url)+'">'
        +'<div class="yls-r1"><span class="yls-kind" style="background:'+k.c+'">'+k.label+'</span>'
        +'<span class="yls-title">'+hi(it.title)+'</span></div>'
        +(it.sub?'<div class="yls-sub">'+hi(it.sub)+'</div>':'')
        +(meta.length?'<div class="yls-meta">'+meta.join(' · ')+'</div>':'')+'</a>';
    }).join('');
    rows=[].slice.call(listEl.querySelectorAll('.yls-row')); sel=-1;
  }
  function onKey(e){
    if(e.key==='Escape'){ close(); return; }
    if(e.key==='ArrowDown'){ e.preventDefault(); move(1); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); move(-1); }
    else if(e.key==='Enter'){ if(sel>=0&&rows[sel]) rows[sel].click(); else if(rows[0]) rows[0].click(); }
  }
  function move(d){ if(!rows.length)return; if(sel>=0)rows[sel].classList.remove('sel'); sel=(sel+d+rows.length)%rows.length; rows[sel].classList.add('sel'); rows[sel].scrollIntoView({block:'nearest'}); }
  function open(q){ ensure(); if(!INDEX.length) buildIndex(); ov.classList.add('on'); document.body.style.overflow='hidden'; if(q){input.value=q;runSearch(q);} else {runSearch('');} setTimeout(function(){input.focus();},50); }
  function close(){ if(ov){ov.classList.remove('on');document.body.style.overflow='';} }
  window.YeonSearch={ open:open, close:close, rebuild:function(){buildIndex();} };

  /* ---------- 진입점 연결 ---------- */
  function wire(){
    buildIndex(); loadFeeds();
    var sb=document.getElementById('btnSearch'); if(sb) sb.addEventListener('click',function(){open('');});
    // 차림표 안 기존 검색창 → 오버레이로
    document.querySelectorAll('.mega-search input').forEach(function(inp){
      inp.addEventListener('focus',function(){ open(inp.value||''); });
      inp.addEventListener('input',function(){ open(inp.value||''); });
    });
    // 단축키 '/'
    document.addEventListener('keydown',function(e){
      if(e.key==='/'&&!/input|textarea/i.test((e.target&&e.target.tagName)||'')){ e.preventDefault(); open(''); }
    });
  }
  if(document.readyState!=='loading') wire(); else document.addEventListener('DOMContentLoaded', wire);
  // 데이터가 늦게 로드되면 색인 재구성
  window.addEventListener('load', function(){ if(!INDEX.length || INDEX.length<3) buildIndex(); });
})();
