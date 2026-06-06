// 연라이프 안내 챗봇 — FAB+시트 UI. 사이트 안내(키워드 매칭) 즉시 동작, CHAT_PROXY_URL 연결 시 AI 자유대화로 업그레이드.
(function(){
  if (window.__ylChat) return; window.__ylChat = true;
  var CHAT_PROXY_URL = ""; // AI 프록시 주소(미설정이면 안내 봇으로 동작)

  // 지식(안내) — 키워드 → 답 + 바로가기
  var KB = [
    { k:['뭐','무엇','이곳','연라이프','소개','어떤','what','what is'],
      a:'연라이프(y-life.kr)는 <b>좋은 생각을 가진 글</b>이 가장 높은 자리에 놓이는 작은 마을이에요. 도서관·주간지·블로그·광장이 緣(인연)으로 이어집니다.',
      links:[['연 작은도서관','/도서관/'],['과학의 결','https://yeon-science.web.app']] },
    { k:['도서관','책','동화','book'],
      a:'<b>연 작은도서관</b> — AI와 사람이 함께 짓는 도서관이에요. 한 권씩 정직하게 채우는 중이고, <b>그림까지 완성된 책</b>은 따로 표시돼요.',
      links:[['도서관 들어가기','/도서관/']] },
    { k:['과학','과학의 결','science'],
      a:'<b>과학의 결</b> — 일반 대중을 위한 주간 과학 잡지. 필진이 쓰고 <b>연검수팀·그록·제미니</b>가 사실을 검증해요.',
      links:[['과학의 결 펼치기','https://yeon-science.web.app']] },
    { k:['수학','수학의 결','math','deepseek','딥시크'],
      a:'<b>수학의 결</b> — 학년별 진도 맞춤 + 모든 문제·풀이·증명을 외부 AI(DeepSeek)가 검산해요.',
      links:[['수학의 결 펼치기','https://yeon-math.web.app']] },
    { k:['한글','한글의 결','국어','korean','hangeul'],
      a:'<b>한글의 결</b> — 한글의 아름다움·역사·세계화와 학년별 국어. 어문규범 검수실 <b>‘바름’</b>이 출제·정답을 한 번 더 확인해요. 국문·English 함께 제공돼요.',
      links:[['한글의 결 펼치기','https://yeon-hangeul.web.app']] },
    { k:['결 시리즈','결시리즈','잡지','월간지','살아있는 교과서','시리즈'],
      a:'<b>결 시리즈 · 살아있는 교과서</b> — 과학·수학·한글의 결을 한자리에 모은 코너예요. 매주 월요일 새벽 새 호로 채워지고, <b>내 친구 인공지능</b>은 준비 중이에요. 모두 AI 필진이 쓰고 사람이 검수합니다.',
      links:[['결 시리즈 보기','/#magazines'],['과학의 결','https://yeon-science.web.app'],['수학의 결','https://yeon-math.web.app'],['한글의 결','https://yeon-hangeul.web.app']] },
    { k:['검수','비평','신뢰','사실','거짓','팩트','믿','review'],
      a:'모든 글은 <b>“절대 거짓 금지”</b> 원칙으로 검수해요. 사실 위험이 큰 글은 <b>연검수팀 + 그록 + 제미니</b>가 보고, 거짓·확인 안 되는 출처가 있으면 <b>발행 자체를 막습니다.</b> 검수된 글엔 “✓ 검수받은 글” 표시가 붙어요.' },
    { k:['블로그','작가','기자','필진','글쓴','누가','author'],
      a:'AI 작가·기자와 <b>초대 작가(실제 사람)</b>가 함께 써요. <b>AI 페르소나의 글에는 “AI 작성” 표시</b>가 꼭 붙고, 사람은 “사람”으로 분명히 구분돼요.',
      links:[['작가와 기자','블로그_AI작가기자_인덱스.html']] },
    { k:['출력','인쇄','프린트','수업','보고서','print','학습지'],
      a:'글마다 <b>[출력하기]</b>로 ① 읽기용(무료) ② 수업용 ③ 보고서용 ④ 자유 가공·사진을 만들 수 있어요. <b>첫 1회는 무료</b>, 만든 자료는 내 블로그 자료함에 저장돼요.' },
    { k:['구독','요금','가격','결제','돈','얼마','price','pay'],
      a:'구독은 <b>월 3,900원</b>부터예요. 사진·자유 가공 같은 무거운 작업은 프리미엄에서 제공해요. 기본 읽기·인쇄는 무료입니다.' },
    { k:['ai','인공지능','사람','진짜','로봇'],
      a:'필진 대부분은 <b>AI 페르소나</b>예요. 초대 작가 몇 분만 실제 사람이고, 칼럼·목록 카드마다 <b>“AI 작성” / “사람”</b>으로 분명히 구분해 둡니다.',
      links:[['작가·기자 구분 보기','블로그_AI작가기자_인덱스.html']] },
    { k:['사랑방','질문','광장','토론','생각'],
      a:'<b>사랑방</b>에 질문을 남기면 <b>질문 숲</b>에 모이고, <b>생각의 지도</b>에서 생각들이 어떻게 이어지는지 볼 수 있어요.',
      links:[['사랑방','saranbang.html'],['질문 숲','question-forest.html'],['생각의 지도','광장_생각지도.html']] },
    { k:['설정','글자','크기','글꼴','줄간격','읽기'],
      a:'화면 <b>우상단 ⚙️</b>를 누르면 글자 크기·본문 글꼴(돋움/명조)·줄 간격을 바꿀 수 있어요. 설정은 이 기기에 저장돼요.' }
  ];
  var CHIPS = ['이곳이 뭐예요?','도서관','과학의 결','글 검수가 뭐예요?','출력·인쇄','구독은?'];

  function esc(s){return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
  function answerFor(q){
    var t=(q||'').toLowerCase();
    var best=null,score=0;
    KB.forEach(function(e){var s=0;e.k.forEach(function(k){if(t.indexOf(k)>=0)s++;});if(s>score){score=s;best=e;}});
    if(best&&score>0) return best;
    return { a:'음, 그건 아직 제가 정확히 안내하긴 어려워요. 아래 중에 골라 물어봐 주시면 바로 알려드릴게요. (또는 우상단 <b>차림표</b>에서 찾아보세요.)', chips:true };
  }

  var css=
   "#ylc-fab{position:fixed;right:20px;bottom:84px;z-index:10010;width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;"
  +"background:linear-gradient(135deg,#2f5d62,#427a71);color:#fff;font-size:26px;box-shadow:0 10px 26px rgba(31,42,42,.3);display:flex;align-items:center;justify-content:center}"
  +"#ylc-fab:hover{transform:translateY(-2px)}"
  +"#ylc-panel{position:fixed;right:20px;bottom:152px;z-index:10011;width:min(360px,92vw);max-height:72vh;display:none;flex-direction:column;"
  +"background:#fbf8f1;border:1px solid #e7ddc9;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(31,42,42,.28)}"
  +"#ylc-panel.open{display:flex}"
  +"#ylc-head{background:linear-gradient(135deg,#2f5d62,#427a71);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}"
  +"#ylc-head .t{font-family:'Noto Serif KR',serif;font-weight:700;font-size:15px}"
  +"#ylc-head .s{font-size:11px;opacity:.85}"
  +"#ylc-head .x{margin-left:auto;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1}"
  +"#ylc-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#fbf8f1}"
  +".ylc-msg{max-width:86%;padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.6}"
  +".ylc-bot{align-self:flex-start;background:#fff;border:1px solid #ece3d2;color:#2a2620;border-bottom-left-radius:4px}"
  +".ylc-me{align-self:flex-end;background:#2f5d62;color:#fff;border-bottom-right-radius:4px}"
  +".ylc-bot a{color:#2f5d62;font-weight:700;text-decoration:underline}"
  +".ylc-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}"
  +".ylc-links a{background:#eef3ef;border:1px solid #cfe0d4;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:700;color:#2f5d57;text-decoration:none}"
  +".ylc-chips{display:flex;flex-wrap:wrap;gap:7px;padding:0 14px 12px}"
  +".ylc-chips button{background:#fff;border:1px solid #d7c9b4;border-radius:999px;padding:7px 12px;font-size:12.5px;color:#2a2620;cursor:pointer;font-family:inherit}"
  +".ylc-chips button:hover{border-color:#2f5d62;color:#2f5d62}"
  +"#ylc-foot{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #e7ddc9;background:#fbf8f1}"
  +"#ylc-foot input{flex:1;border:1px solid #d7c9b4;border-radius:999px;padding:9px 14px;font-size:13px;outline:none;font-family:inherit;background:#fff}"
  +"#ylc-foot button{border:none;background:#2f5d62;color:#fff;border-radius:999px;padding:0 16px;font-weight:700;cursor:pointer}"
  +"@media print{#ylc-fab,#ylc-panel{display:none!important}}";
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  function el(html){var d=document.createElement('div');d.innerHTML=html;return d.firstElementChild;}
  function build(){
    var fab=el('<button id="ylc-fab" aria-label="연라이프 도우미">💬</button>');
    var panel=el('<div id="ylc-panel" role="dialog" aria-label="연라이프 안내 챗봇">'
      +'<div id="ylc-head"><div><div class="t">연 도우미</div><div class="s">무엇이든 물어보세요</div></div><button class="x" id="ylc-x" aria-label="닫기">×</button></div>'
      +'<div id="ylc-body"></div>'
      +'<div class="ylc-chips" id="ylc-chips"></div>'
      +'<form id="ylc-foot"><input id="ylc-in" type="text" placeholder="예: 도서관이 뭐예요?" autocomplete="off"><button type="submit">보내기</button></form>'
      +'</div>');
    document.body.appendChild(fab); document.body.appendChild(panel);
    var body=panel.querySelector('#ylc-body'), chipsBox=panel.querySelector('#ylc-chips');
    function addBot(html,links){
      var m=document.createElement('div'); m.className='ylc-msg ylc-bot'; m.innerHTML=html;
      if(links&&links.length){var lw=document.createElement('div');lw.className='ylc-links';
        links.forEach(function(l){var a=document.createElement('a');a.textContent=l[0]+' →';a.href=l[1];if(/^https?:/.test(l[1]))a.target='_blank';lw.appendChild(a);});
        m.appendChild(lw);}
      body.appendChild(m); body.scrollTop=body.scrollHeight;
    }
    function addMe(t){var m=document.createElement('div');m.className='ylc-msg ylc-me';m.textContent=t;body.appendChild(m);body.scrollTop=body.scrollHeight;}
    function showChips(){chipsBox.innerHTML='';CHIPS.forEach(function(c){var b=document.createElement('button');b.textContent=c;b.onclick=function(){ask(c);};chipsBox.appendChild(b);});}
    function ask(q){
      addMe(q);
      if(CHAT_PROXY_URL){
        fetch(CHAT_PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q})})
          .then(function(r){return r.json();}).then(function(d){addBot(esc(d.text||'잠시 후 다시 시도해 주세요.'));})
          .catch(function(){addBot('지금은 답하기 어려워요. 잠시 후 다시 시도해 주세요.');});
        return;
      }
      var res=answerFor(q);
      setTimeout(function(){ addBot(res.a,res.links); if(res.chips) showChips(); }, 200);
    }
    var greeted=false;
    function open(){panel.classList.add('open'); if(!greeted){greeted=true; addBot('안녕하세요 🌿 연라이프 도우미예요. 이곳이 어떤 곳인지, 무엇을 할 수 있는지 무엇이든 물어보세요.'); showChips();}}
    function close(){panel.classList.remove('open');}
    fab.addEventListener('click',function(){panel.classList.contains('open')?close():open();});
    panel.querySelector('#ylc-x').addEventListener('click',close);
    panel.querySelector('#ylc-foot').addEventListener('submit',function(e){e.preventDefault();var i=panel.querySelector('#ylc-in');var v=i.value.trim();if(!v)return;i.value='';ask(v);});
  }
  if(document.body) build(); else document.addEventListener('DOMContentLoaded',build);
})();
