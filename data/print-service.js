// 연라이프 공통 출력(프린트) 서비스 — 글마다 '출력하기' 버튼 + 용도 선택(읽기/수업/보고서/자유가공) + 무료·구독·프리미엄 안내.
// 읽기용은 즉시 인쇄(무료). 수업·보고서·자유가공은 AI 작업이라 첫 1회 무료 → 구독/프리미엄 안내(실제 생성·결제는 추후 연결).
(function(){
  if (window.printServiceBtn) return;
  function ESC(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  window.printServiceBtn = function(){
    return '<button class="psvc-btn" type="button" onclick="window.openPrintService()">🖶 출력하기</button>';
  };

  // 글 길이로 예상 작업량(원) 대략 산출
  function estimate(){
    var el = document.querySelector('.col-body') || document.querySelector('article') || document.body;
    var len = (el.innerText||'').replace(/\s/g,'').length || 600;
    var pages = Math.max(1, Math.round(len/900));
    return {
      pages: pages,
      cls:    120 + pages*60,    // 수업용
      report: 180 + pages*80,    // 보고서용
      custom: 500 + pages*150    // 자유가공·이미지(프리미엄)
    };
  }

  window.openPrintService = function(){
    var e = estimate();
    var html = ''
    + '<div class="psvc-mh"><b>출력하기</b><button class="psvc-x" id="psvcX" aria-label="닫기">✕</button></div>'
    + '<div class="psvc-mb">'
    + '  <div class="psvc-lead">어떤 용도로 출력할까요? 용도에 맞게 정리해 드립니다.</div>'

    // 1) 읽기용 — 무료, 즉시
    + '  <div class="psvc-card">'
    + '    <div class="psvc-ic">📖</div><div class="psvc-t">그냥 읽기용 <span class="psvc-tag free">무료</span></div>'
    + '    <div class="psvc-d">화면 그대로 또는 종이 절약(2단·흑백)으로 바로 인쇄합니다.</div>'
    + '    <div class="psvc-acts"><button class="psvc-go" onclick="window.psvcPrint(false)">화면 그대로</button>'
    + '      <button class="psvc-go alt" onclick="window.psvcPrint(true)">절약형 2단</button></div>'
    + '  </div>'

    // 2) 수업용
    + psvcPaidCard('🎒','수업용','구독','요점·빈칸·여백을 넣어 학습지 형태로 만들어 드립니다.', e.cls)
    // 3) 보고서용
    + psvcPaidCard('📋','보고서용','구독','개요·본문·인용·출처를 보고서 양식으로 정리해 드립니다.', e.report)
    // 4) 자유가공 — 프리미엄
    + psvcPaidCard('✨','자유 가공 · 사진 제작','프리미엄','원하는 형태로 자유 구성 + 사진·이미지·인포그래픽까지 제작합니다.', e.custom)

    + '  <div class="psvc-note">'
    + '    <b>첫 회는 무료로 해 드립니다 ☺️</b><br>'
    + '    계속 쓰시려면 가장 저렴한 <b>구독(월 3,900원)</b>을, 사진·자유 가공은 <b>프리미엄</b>을 선택해 주세요.<br>'
    + '    만든 자료는 <b>내 블로그 자료함</b>에 자동 저장됩니다 — 나중에 <b>키워드만 넣으면 찾아 드려요.</b><br>'
    + '    <span class="psvc-store">기본 저장소: 내 블로그 (y-life.kr) · 검색은 차림표의 검색창</span>'
    + '  </div>'
    + '</div>';

    var ov=document.getElementById('psvcOv'), md=document.getElementById('psvcModal');
    document.getElementById('psvcBody').innerHTML = html;
    ov.classList.add('open'); md.classList.add('open'); document.body.style.overflow='hidden';
    document.getElementById('psvcX').onclick = window.closePrintService;
  };

  function psvcPaidCard(ic, title, tier, desc, cost){
    var tag = tier==='프리미엄' ? '<span class="psvc-tag prem">프리미엄</span>' : '<span class="psvc-tag sub">구독</span>';
    return '<div class="psvc-card">'
      + '<div class="psvc-ic">'+ic+'</div><div class="psvc-t">'+ESC(title)+' '+tag+'</div>'
      + '<div class="psvc-d">'+ESC(desc)+'</div>'
      + '<div class="psvc-est">이번 출력 예상 작업량 ≈ <b>'+cost.toLocaleString()+'원</b> 상당 · <b>첫 1회 무료</b></div>'
      + '<div class="psvc-acts"><button class="psvc-go" onclick="window.psvcRequest(\''+ESC(title)+'\')">첫 1회 무료로 받기</button></div>'
      + '</div>';
  }

  window.psvcPrint = function(eco){
    document.body.classList.toggle('psvc-eco', !!eco);
    window.print();
    setTimeout(function(){ document.body.classList.remove('psvc-eco'); }, 700);
  };

  window.psvcRequest = function(kind){
    var b=document.getElementById('psvcBody');
    var box=document.createElement('div'); box.className='psvc-toast';
    box.innerHTML='✨ <b>'+ESC(kind)+'</b> — 첫 1회 무료 샘플로 준비해 드립니다.<br>'
      +'<span class="psvc-store">지금은 AI 출력·결제 연결을 준비 중이라, 열리는 대로 가장 먼저 안내드릴게요. 만든 자료는 내 블로그 자료함에 저장됩니다.</span>';
    b.prepend(box);
    box.scrollIntoView({block:'nearest'});
  };

  window.closePrintService = function(){
    var ov=document.getElementById('psvcOv'), md=document.getElementById('psvcModal');
    if(ov)ov.classList.remove('open'); if(md)md.classList.remove('open'); document.body.style.overflow='';
  };

  var css = ".psvc-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #2f5d57;background:#fff;color:#2f5d57;font-weight:800;font-size:.86rem;padding:8px 16px;border-radius:999px;cursor:pointer}"
   +".psvc-btn:hover{background:#2f5d57;color:#fff}"
   +".psvc-ov{position:fixed;inset:0;background:rgba(28,24,18,.5);opacity:0;visibility:hidden;transition:.2s;z-index:9100}"
   +".psvc-ov.open{opacity:1;visibility:visible}"
   +".psvc-modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-47%);width:min(560px,93vw);max-height:86vh;overflow:auto;background:#f8f4ec;border-radius:18px;z-index:9101;opacity:0;visibility:hidden;transition:.2s;box-shadow:0 24px 70px rgba(28,24,18,.3)}"
   +".psvc-modal.open{opacity:1;visibility:visible;transform:translate(-50%,-50%)}"
   +".psvc-mh{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #ece5d9}"
   +".psvc-mh b{font-family:'Nanum Myeongjo',serif;font-size:1.1rem;color:#2a2620}"
   +".psvc-x{background:none;border:none;cursor:pointer;color:#6f6a62;font-size:1.2rem}"
   +".psvc-mb{padding:16px 22px 22px}"
   +".psvc-lead{font-size:.9rem;color:#6f6a62;margin-bottom:14px}"
   +".psvc-card{border:1px solid #ece5d9;background:#fffdf8;border-radius:14px;padding:14px 16px;margin-bottom:12px}"
   +".psvc-ic{font-size:1.3rem}"
   +".psvc-t{font-weight:800;font-size:1rem;color:#2a2620;margin:4px 0 2px}"
   +".psvc-tag{font-size:.68rem;font-weight:800;padding:2px 8px;border-radius:999px;vertical-align:middle;margin-left:4px}"
   +".psvc-tag.free{background:#e4efe7;color:#2f5d57}.psvc-tag.sub{background:#f4efe1;color:#a96f36}.psvc-tag.prem{background:#2a2620;color:#fff}"
   +".psvc-d{font-size:.86rem;color:#5a554c;line-height:1.6;margin:4px 0 8px}"
   +".psvc-est{font-size:.8rem;color:#6f6a62;margin-bottom:10px}.psvc-est b{color:#2f5d57}"
   +".psvc-acts{display:flex;gap:8px;flex-wrap:wrap}"
   +".psvc-go{border:none;background:#2f5d57;color:#fff;font-weight:700;font-size:.84rem;padding:8px 14px;border-radius:999px;cursor:pointer}"
   +".psvc-go.alt{background:#fff;color:#2f5d57;border:1.5px solid #2f5d57}"
   +".psvc-note{background:#f4efe1;border-radius:12px;padding:14px 16px;font-size:.86rem;color:#2a2620;line-height:1.7;margin-top:6px}"
   +".psvc-store{font-size:.78rem;color:#6f6a62}"
   +".psvc-toast{background:#e4efe7;border:1px solid #bcd6c6;border-radius:12px;padding:12px 14px;font-size:.88rem;color:#234;line-height:1.6;margin-bottom:14px}"
   +"@media print{.psvc-btn,.psvc-ov,.psvc-modal{display:none!important}"
   +" body.psvc-eco header,body.psvc-eco footer,body.psvc-eco .b-share,body.psvc-eco .ad-in-article,body.psvc-eco .psvc-row,body.psvc-eco .rvw{display:none!important}"
   +" body.psvc-eco .col-body{columns:2;column-gap:16px;font-size:11px;color:#000}"
   +" body.psvc-eco *{background:#fff!important;box-shadow:none!important}}";
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  function injectModal(){
    if(document.getElementById('psvcModal')) return;
    var ov=document.createElement('div'); ov.className='psvc-ov'; ov.id='psvcOv';
    var md=document.createElement('div'); md.className='psvc-modal'; md.id='psvcModal'; md.setAttribute('role','dialog'); md.setAttribute('aria-modal','true');
    md.innerHTML='<div id="psvcBody"></div>';
    document.body.appendChild(ov); document.body.appendChild(md);
    ov.addEventListener('click', window.closePrintService);
  }
  if(document.body) injectModal(); else document.addEventListener('DOMContentLoaded', injectModal);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') window.closePrintService(); });
})();
