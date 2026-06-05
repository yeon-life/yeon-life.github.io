// 연라이프 공통 검수 배지·팝업 컴포넌트 — 블로그·상점 등 어느 페이지든 재사용. window.reviewBadges/reviewFlag/openReview 제공.
(function(){
  if (window.reviewBadges) return; // 중복 로드 방지
  function ESC(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  var ROLES = {
    yeon:  {name:'연검수팀', short:'연검수팀', icon:'緣', color:'#2f5d57',
      role:'연라이프 내부 검수팀. 차강윤 내부 비평가와 하정수 주필이 과장·논리·재현성을 점검하고, 모든 사실에 출처를 맞춥니다. ‘절대 거짓 금지’를 위해 모든 글이 반드시 거치는 기본 검수입니다.'},
    grok:  {name:'그록', short:'그록', icon:'𝕏', color:'#111111', img:'assets/img/grok.png',
      role:'xAI의 외부 초빙 비평가. 사외의 시선으로 논리 비약·반례·과장을 독립적으로 따집니다. 사실 검증이 중요한 글에만 선별 투입하며, 그록의 지적도 다시 교차검증합니다.'},
    gemini:{name:'제미니', short:'제미니', icon:'G', color:'#1a73e8',
      role:'Google의 데이터 대조 검수. 구글 검색에 직접 연결해 최신 수치·통계·연구 결과가 실제와 맞는지 대조합니다. 사실 위험이 큰 글에 선별 투입합니다.'}
  };
  window.REVIEW_ROLES = ROLES;
  function ric(k){var r=ROLES[k]||{};return '<span class="ric" style="background:'+(r.color||'#777')+'">'+(r.img?'<img src="'+r.img+'" alt="">':ESC(r.icon||'?'))+'</span>';}
  window.reviewBadges = function(rv){
    if(!rv||!rv.team||!rv.team.length) return '';
    var d=encodeURIComponent(JSON.stringify(rv));
    var chips=rv.team.map(function(k){var r=ROLES[k]||{};return '<button class="rbtn" data-rvw="'+d+'" data-team="'+k+'">'+ric(k)+ESC(r.short||r.name||k)+'</button>';}).join('');
    return '<div class="rvw"><span class="lab">비평</span>'+chips+'</div>';
  };
  window.reviewFlag = function(rv){
    if(!rv||!rv.team||!rv.team.length) return '';
    var d=encodeURIComponent(JSON.stringify(rv));
    return ' <button class="rvw-flag" data-rvw="'+d+'">✓ 검수받은 글</button>';
  };
  window.openReview = function(rv, focus){
    var body=document.getElementById('rvwBody'); if(!body) return;
    var h=rv.why?'<div class="rvw-why"><b>왜 이렇게 검수했나</b><br>'+ESC(rv.why)+'</div>':'';
    rv.team.forEach(function(k){var r=ROLES[k]||{}; var b=(rv.briefs||{})[k];
      h+='<div class="rvw-item" id="rvwi-'+k+'">'+ric(k)+'<div><div class="nm">'+ESC(r.name||k)+'</div><div class="role">'+ESC(r.role||'')+'</div>'+(b?'<div class="brief"><b>이 글에서 —</b> '+ESC(b)+'</div>':'')+'</div></div>';});
    body.innerHTML=h;
    document.getElementById('rvwOv').classList.add('open');
    document.getElementById('rvwModal').classList.add('open');
    document.body.style.overflow='hidden';
    if(focus){var el=document.getElementById('rvwi-'+focus); if(el) el.scrollIntoView({block:'nearest'});}
  };
  function closeReview(){var o=document.getElementById('rvwOv'),m=document.getElementById('rvwModal');if(o)o.classList.remove('open');if(m)m.classList.remove('open');document.body.style.overflow='';}
  window.closeReview = closeReview;

  var css=".rvw{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:12px 0 2px;font-size:.82rem}"
   +".rvw .lab{font-weight:900;color:#2a2620}"
   +".rvw .rbtn{display:inline-flex;align-items:center;gap:6px;border:none;background:transparent;padding:2px;cursor:pointer;font-size:.86rem;font-weight:800;color:#2a2620;font-family:inherit}"
   +".rvw .rbtn:hover{color:#2f5d57;text-decoration:underline;text-underline-offset:3px}"
   +".ric{width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#fff;overflow:hidden;flex:0 0 auto}"
   +".ric img{width:100%;height:100%;object-fit:cover}"
   +".rvw-flag{display:inline-flex;align-items:center;gap:4px;margin-left:10px;vertical-align:middle;border:none;cursor:pointer;font-size:.72rem;font-weight:800;color:#2f5d57;background:#e4efe7;border-radius:999px;padding:3px 10px;font-family:inherit}"
   +".rvw-flag:hover{background:#2f5d57;color:#fff}"
   +".rvw-ov{position:fixed;inset:0;background:rgba(28,24,18,.5);opacity:0;visibility:hidden;transition:.2s;z-index:9000}"
   +".rvw-ov.open{opacity:1;visibility:visible}"
   +".rvw-modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-47%);width:min(560px,92vw);max-height:84vh;overflow:auto;background:#f8f4ec;border-radius:18px;z-index:9001;opacity:0;visibility:hidden;transition:.2s;box-shadow:0 24px 70px rgba(28,24,18,.3)}"
   +".rvw-modal.open{opacity:1;visibility:visible;transform:translate(-50%,-50%)}"
   +".rvw-modal .mh{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #ece5d9}"
   +".rvw-modal .mh b{font-family:'Nanum Myeongjo',serif;font-size:1.05rem;color:#2a2620}"
   +".rvw-modal .mx{background:none;border:none;cursor:pointer;color:#6f6a62;font-size:1.2rem;line-height:1}"
   +".rvw-modal .mb{padding:18px 22px}"
   +".rvw-why{background:#f4efe1;border-radius:12px;padding:12px 14px;font-size:.86rem;color:#2a2620;margin-bottom:16px;line-height:1.6}"
   +".rvw-why b{color:#2f5d57}"
   +".rvw-item{display:flex;gap:12px;padding:14px 0;border-top:1px solid rgba(40,32,20,.07)}"
   +".rvw-item:first-child{border-top:none}"
   +".rvw-item .ric{width:34px;height:34px;font-size:14px}"
   +".rvw-item .nm{font-weight:700;font-size:.92rem;color:#2a2620}"
   +".rvw-item .role{font-size:.82rem;color:#6f6a62;line-height:1.6;margin-top:3px}"
   +".rvw-item .brief{font-size:.84rem;color:#2a2620;line-height:1.65;margin-top:8px;background:#fff;border:1px solid #ece5d9;border-radius:10px;padding:10px 12px}"
   +".rvw-item .brief b{color:#2f5d57}"
   +"@media print{.rvw-ov,.rvw-modal{display:none!important}.rvw-flag{background:none;color:#000}}";
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  function injectModal(){
    if(document.getElementById('rvwModal')) return;
    var ov=document.createElement('div'); ov.className='rvw-ov'; ov.id='rvwOv';
    var md=document.createElement('div'); md.className='rvw-modal'; md.id='rvwModal'; md.setAttribute('role','dialog'); md.setAttribute('aria-modal','true');
    md.innerHTML='<div class="mh"><b>글 검수 브리핑</b><button class="mx" id="rvwClose" aria-label="닫기">✕</button></div><div class="mb" id="rvwBody"></div>';
    document.body.appendChild(ov); document.body.appendChild(md);
  }
  if(document.body) injectModal(); else document.addEventListener('DOMContentLoaded', injectModal);

  document.addEventListener('click', function(e){
    var b=e.target.closest && e.target.closest('[data-rvw]');
    if(b){ try{ window.openReview(JSON.parse(decodeURIComponent(b.dataset.rvw)), b.dataset.team); }catch(_){ } return; }
    if(e.target.id==='rvwOv' || (e.target.closest && e.target.closest('#rvwClose'))) closeReview();
  });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeReview(); });
})();
