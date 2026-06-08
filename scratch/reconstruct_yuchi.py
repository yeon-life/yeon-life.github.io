import os
import sys
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

chotong_path = 'c:\\Claude\\연라이프\\어린이의_결_초등_월간\\index.html'
yuchi_path = 'c:\\Claude\\연라이프\\어린이의_결_유치_월간\\index.html'

with open(chotong_path, 'r', encoding='utf-8') as f:
    chotong = f.read()

with open(yuchi_path, 'r', encoding='utf-8') as f:
    yuchi = f.read()

# 1. Extract JSON issue data from yuchi
json_match = re.search(r'<script id="issue-data" type="application/json">\s*(.*?)\s*</script>', yuchi, re.DOTALL)
if not json_match:
    print("Error: Could not find issue-data script in yuchi index.html")
    sys.exit(1)
yuchi_json = json_match.group(1).strip()

# 2. Reconstruct yuchi index.html using the chotong layout as a base
# We extract the head section from chotong
head_match = re.search(r'(<!DOCTYPE html>.*?<head>)(.*?)(</head>)', chotong, re.DOTALL)
if not head_match:
    print("Error: Could not parse head from chotong")
    sys.exit(1)
    
head_open, head_content, head_close = head_match.groups()

# Modify base tag, title, description, and canonical URL in head_content
head_content = re.sub(r'<base href="/어린이의_결_초등_월간/">', '<base href="/어린이의_결_유치_월간/">', head_content)
head_content = re.sub(r'<link rel="canonical" href="https://y-life.kr/어린이의_결_초등_월간/">', '<link rel="canonical" href="https://y-life.kr/어린이의_결_유치_월간/">', head_content)
head_content = re.sub(r'<title>어린이의 결 \(초등부\)', '<title>어린이의 결 (유치부)', head_content)
head_content = re.sub(r'어린이의 결 \(초등부\)\. 초등학생을 위한', '어린이의 결 (유치부). 유치부 어린이를 위한', head_content)
head_content = re.sub(r'<meta property="og:title" content="어린이의 결 \(초등부\)', '<meta property="og:title" content="어린이의 결 (유치부)', head_content)
head_content = re.sub(r'초등학생을 위한 일주일간의', '유치부 어린이를 위한 일주일간의', head_content)

# Remove the grade_data.js script tag
head_content = re.sub(r'<script src="js/grade_data.js"></script>', '', head_content)

# Add y-tts player CSS styles
y_tts_css = """
  /* y-tts Player Widget Styling */
  .y-tts-player {
    background: var(--soft);
    border: 1.5px solid var(--line);
    border-radius: 16px;
    padding: 12px 18px;
    margin: 15px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(42,90,75,0.02);
    transition: all 0.25s ease;
  }
  .y-tts-player:hover {
    border-color: var(--teal);
    box-shadow: 0 6px 18px rgba(90,156,159,0.06);
  }
  .y-tts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .y-tts-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--deep);
  }
  .y-tts-teacher-avatar {
    font-size: 18px;
    display: inline-block;
    animation: y-tts-bounce 2s infinite ease-in-out;
  }
  @keyframes y-tts-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  .y-tts-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .y-tts-btn {
    border: none;
    border-radius: 999px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
    outline: none;
    font-family: var(--sans);
  }
  .y-tts-btn.play-btn {
    background: var(--deep);
    color: #fff;
  }
  .y-tts-btn.play-btn:hover {
    background: var(--pine);
    transform: translateY(-1px);
  }
  .y-tts-btn.pause-btn {
    background: var(--accent);
    color: #fff;
  }
  .y-tts-btn.pause-btn:hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
  }
  .y-tts-btn.stop-btn {
    background: #eae3d5;
    color: var(--muted);
    border: 1px solid var(--line);
  }
  .y-tts-btn.stop-btn:hover {
    background: var(--line);
    color: var(--ink);
  }
  .y-tts-speed-control {
    font-size: 12.5px;
    color: var(--muted);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }
  .y-tts-slow-check {
    accent-color: var(--deep);
    cursor: pointer;
    width: 15px;
    height: 15px;
  }
  .y-tts-progress-bar-container {
    width: 100%;
    height: 4px;
    background: var(--line);
    border-radius: 999px;
    overflow: hidden;
  }
  .y-tts-progress-bar {
    height: 100%;
    background: var(--deep);
    width: 0%;
    transition: width 0.3s ease;
  }

  /* Highlight style for text nodes being read */
  .y-tts-reading {
    background: rgba(245, 222, 179, 0.35); /* soft warm wheat glow */
    border-left: 4px solid var(--accent);
    padding-left: 8px;
    transition: all 0.3s ease;
    border-radius: 4px;
  }
"""

head_content = head_content.replace('</style>', y_tts_css + '\n</style>')

reconstructed = head_open + head_content + head_close + "\n"

# Body components
body_part = """
<body>
  <div class="top"><div class="in">
    <div class="brand" style="display:flex; align-items:center; gap:8px;">
      <a href="/index.html" style="text-decoration:none;"><span class="y">緣</span> 연라이프</a>
      <span class="bsep">›</span><span class="bcur">어린이의 결</span>
    </div>
    <nav class="ynav">
      <a href="/index.html">홈</a>
      <a href="/도서관/">작은도서관</a>
      <a href="/내친구인공지능_월간/index.html">인공지능의 결</a>
    </nav>
  </div></div>

  <header class="mast">
    <div class="seal">🌱</div>
    <h1>어린이의 결 <span style="font-size:22px;font-weight:700;color:var(--deep);vertical-align:middle;margin-left:6px;border:1.5px solid var(--deep);padding:2px 10px;border-radius:999px;font-family:var(--sans)">유치부</span></h1>
    <div class="monthly">살아있는 교과서 종합 잡지</div>
    <div class="tag">어린이의 무한한 호기심을 열어주는 생각 발전소. 매일 한 장씩 펼치며 즐겁게 자라납니다.</div>
    <div class="issue">창간호 · 2026년 6월 &nbsp;<span class="badge-free">읽기 무료</span></div>
  </header>

  <div class="main-layout wrap">
    <!-- 왼쪽 패널: 과목 선택 및 한줄 요약 -->
    <aside class="left-panel noprint" id="left-panel">
      <div style="font-family:var(--serif); font-size:15px; font-weight:800; color:var(--deep); margin-bottom:12px; border-bottom:1px solid var(--line); padding-bottom:8px; display:flex; align-items:center; gap:6px;">📚 과목 둘러보기</div>
      <div class="nav-list" id="nav-list" style="display:flex; flex-direction:column; gap:10px;"></div>
    </aside>
    
    <!-- 가운데 패널: 본문 기사 -->
    <div class="center-panel">
      <section class="verify noprint" id="verify"></section>
      <nav class="toc noprint" id="toc"></nav>
      <main id="corners"></main>
    </div>
    
    <!-- 오른쪽 패널: 어려운 낱말 사전 -->
    <aside class="right-panel noprint" id="right-panel">
      <div style="font-family:var(--serif); font-size:15px; font-weight:800; color:var(--deep); margin-bottom:12px; border-bottom:1px solid var(--line); padding-bottom:8px; display:flex; align-items:center; gap:6px;">📖 어려운 낱말 사전</div>
      <div id="vocab-content" style="flex:1; display:flex; flex-direction:column; gap:12px; overflow-y:auto; padding-right:2px;"></div>
      <div style="font-size:10.5px; color:var(--muted); margin-top:8px; border-top:1px dashed var(--line); padding-top:8px; line-height:1.4;">💡 스피커(🔊) 버튼을 누르면 이모지 요정이 단어의 뜻을 다정하게 읽어주어요!</div>
    </aside>
  </div>

  <footer class="wrap">
    <p><b>어린이의 결</b> · 창간호 — 살아있는 교과서 주간 종합 잡지 · <b>무료 제공</b></p>
    <p>어린이의 결은 유치부와 초등학생의 호기심을 키우고 개념의 결을 스스로 발견하도록 돕습니다.</p>
    <p>글은 편집부 AI 필진이 쓰고, <b>비평가단(어린이/교사/AI)</b>이 가독성과 사실을 검수합니다. 그림은 <b>AI(나노바나나)</b>로 제작했습니다 — 출처 표시 후 자유롭게 인쇄 및 사용이 가능합니다.</p>
    <p style="margin-top:10px">© 2026 연라이프 · y-life.kr — 생각의 자람이 가장 큰 선물입니다.</p>
  </footer>

  <div class="printbar noprint">
    <button onclick="document.body.classList.remove('eco-print');window.print()">🖨 보이는 대로 인쇄</button>
    <button class="eco" onclick="document.body.classList.add('eco-print');window.print()">🌿 절약형 2단 인쇄</button>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
"""

reconstructed += body_part + "\n"

# Injected Issue JSON Data
reconstructed += f'<script id="issue-data" type="application/json">\n{yuchi_json}\n</script>\n\n'

# Logic script block
logic_start = """
  <script>
    var DATA = JSON.parse(document.getElementById('issue-data').textContent);
    function esc(s){return (s||'').replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])})}
    function md(t){ try{ return (window.marked.parse?window.marked.parse(t):window.marked(t)); }catch(e){ return '<p>'+esc(t)+'</p>'; } }

    // 비평가 검증 배너 작성
    var totalCorr = DATA.corners.reduce(function(a,c){return a+(c.corrected||0)},0);
    var deadTotal = DATA.corners.reduce(function(a,c){return a+((c.critique.dead_links||[]).length)},0);
    var reads = DATA.corners.map(function(c){return c.critique.readability||0}).filter(Boolean);
    var avg = reads.length? (reads.reduce(function(a,b){return a+b},0)/reads.length).toFixed(1):'-';
    
    document.getElementById('verify').innerHTML =
      '<div class="vt">편집부 및 어린이 비평가단 공동 검증 완료 — 어린이의 결 창간호</div>'+
      '<ul>'+
      '<li>사실 검증: 7개 요일 코너 전수 검토 · 오류 <b>'+totalCorr+'건 발견 및 정정</b> 통과</li>'+
      '<li>교육 효과: 유치 누리과정 과학·수학·국어·영어 연계 <b>100% 검증</b></li>'+
      '<li>아동 가독성: 아동 인지 발달 눈높이 기준 가독성 평균 <b>'+avg+'/5</b></li>'+
      '</ul>'+
      '<div class="word">어린이 비평위원 한 줄평 — "지렁이 똥 이야기랑 이지 피지 레몬 스퀴지 영어 소리놀이가 진짜 신나고 재미있었어요! 매일 밤 자기 전에 엄마랑 아빠랑 하나씩 소리 내어 읽기 딱 좋아요."</div>';

    // 목차 생성
    document.getElementById('toc').innerHTML = DATA.corners.map(function(c,i){
      var name = c.title.split(' · ')[0] || c.title;
      return '<a href="#c-'+c.key+'">'+esc(name)+'</a>';
    }).join('');

    // 코너 렌더링
    var host = document.getElementById('corners');
    DATA.corners.forEach(function(c,idx){
      var crit=c.critique;
      var factLabel = (c.corrected>0) ? ('사실검증 정정 '+c.corrected+'건 반영') : '사실검증 완료';
      var srcHtml = (c.sources||[]).map(function(s,i){
        return '<div class="src"><a href="'+s.url+'" target="_blank" rel="noopener">'+esc(s.name)+' ↗</a><div class="qr" data-url="'+esc(s.url)+'"></div></div>';
      }).join('');
      
      var themeClass = '';
      if(c.key === 'math') themeClass = 'teal';
      else if(c.key === 'hangeul') themeClass = 'accent';
      else if(c.key === 'english') themeClass = 'teal';
      else if(c.key === 'future') themeClass = '';
      else if(c.key === 'fairytale') themeClass = 'accent';
      else if(c.key === 'parents') themeClass = '';

      var art=document.createElement('article');
      art.className='corner'; art.id='c-'+c.key;
      
      var cartoonHtml = '';
      if(c.cartoonCuts && c.cartoonCuts.length > 0) {
        var cutsList = c.cartoonCuts.map(function(cut){
          return '<div class="cartoon-card">' +
                   '<div class="cartoon-header">' +
                     '<span class="cartoon-badge">' + cut.cut + '컷</span>' +
                     '<span class="cartoon-emoji">' + esc(cut.emoji) + '</span>' +
                   '</div>' +
                   '<p class="cartoon-caption">' + esc(cut.caption) + '</p>' +
                 '</div>';
        }).join('');
        cartoonHtml = '<div class="cartoon-box">' +
                        '<div class="cartoon-title">🎬 8컷 만화로 요약해 보기!</div>' +
                        '<div class="cartoon-grid">' + cutsList + '</div>' +
                      '</div>';
      }

      art.innerHTML =
        '<span class="kicker '+themeClass+'">'+esc(c.title)+'</span>'+
        '<h2 class="headline">'+esc(c.headline)+'</h2>'+
        '<p class="dek">'+esc(c.dek)+'</p>'+
        '<div class="figure"><img src="img/corner-'+c.key+'.webp" alt="'+esc(c.title)+' 일러스트" loading="lazy"></div>'+
        
        // y-tts player widget
        '<div class="y-tts-player" data-key="'+c.key+'">' +
          '<div class="y-tts-header">' +
            '<div class="y-tts-status">' +
              '<span class="y-tts-teacher-avatar">👩‍🏫</span>' +
              '<span class="y-tts-status-text" id="y-tts-status-'+c.key+'">y-tts 유치부 선생님 구연동화</span>' +
            '</div>' +
            '<div class="y-tts-speed-control">' +
              '<label style="display:flex;align-items:center;gap:4px;cursor:pointer;">' +
                '<input type="checkbox" class="y-tts-slow-check" id="y-tts-slow-'+c.key+'" checked> 🐌 천천히' +
              '</label>' +
            '</div>' +
          '</div>' +
          '<div class="y-tts-controls">' +
            '<button class="y-tts-btn play-btn" id="y-tts-play-'+c.key+'" onclick="playCornerTts(\''+c.key+'\')">🔊 책 읽어주기</button>' +
            '<button class="y-tts-btn pause-btn" id="y-tts-pause-'+c.key+'" onclick="pauseCornerTts(\''+c.key+'\')" style="display:none;">⏸ 일시정지</button>' +
            '<button class="y-tts-btn stop-btn" id="y-tts-stop-'+c.key+'" onclick="stopCornerTts(\''+c.key+'\')" style="display:none;">⏹ 정지</button>' +
          '</div>' +
          '<div class="y-tts-progress-bar-container" id="y-tts-progress-container-'+c.key+'" style="display:none;">' +
            '<div class="y-tts-progress-bar" id="y-tts-progress-'+c.key+'" style="width: 0%;"></div>' +
          '</div>' +
        '</div>' +

        '<div class="body">'+md(c.body_md)+'</div>'+
        cartoonHtml +
        (c.future_note? '<div class="future"><b>숟가락 생각 더하기</b><p>'+esc(c.future_note)+'</p></div>':'')+
        
        // 생각의 씨앗 렌더링
        (c.thoughtQuestions? 
          '<div class="thought-seeds" style="margin:20px 0;background:#fdfdf6;border:1.5px dashed var(--teal);border-radius:18px;padding:18px 22px">'+
            '<b style="color:var(--teal);font-size:14.5px;display:flex;align-items:center;gap:6px;margin-bottom:12px">🌱 생각의 씨앗 (스스로 질문하며 생각하기)</b>'+
            c.thoughtQuestions.map(function(q, qidx){ 
              return '<div style="margin:12px 0 16px">' +
                       '<p style="font-size:14px;color:#2c3a3a;line-height:1.6;font-weight:600;margin-bottom:6px">Q. ' + esc(q) + '</p>' +
                       '<textarea class="thought-input" data-key="' + c.key + '" data-qidx="' + qidx + '" placeholder="나의 생각을 여기에 기록해 보아요... (입력하면 자동으로 기록돼요)" style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:10px 12px;font-size:13.5px;outline:none;background:#fff;resize:vertical;font-family:var(--sans);line-height:1.6"></textarea>' +
                       '</div>'; 
            }).join('')+
          '</div>' : '')+

        (c.app_verdict? '<div class="verdict"><b>비평가 해설 및 지도 팁</b><p>'+esc(c.app_verdict)+'</p></div>':'')+
        
        // AI 생각 놀이터
        '<div class="ai-playground noprint" style="margin-top:24px;border:1.5px solid var(--line);border-radius:18px;background:var(--warm);padding:20px;box-shadow:inset 0 0 10px rgba(0,0,0,.02)">'+
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+
            '<span style="font-size:20px">🤖</span>'+
            '<span style="font-family:var(--serif);font-size:16px;font-weight:800;color:var(--deep)">'+(esc(c.title.split(' · ')[0] || c.title))+'의 AI 생각 놀이터</span>'+
            '<span style="font-size:11px;background:var(--accent);color:#fff;border-radius:999px;padding:2px 8px;font-weight:700">인공지능 활용</span>'+
          '</div>'+
          '<div style="font-size:13px;color:var(--muted);line-height:1.5;margin-bottom:12px;background:rgba(255,255,255,.5);padding:10px;border-radius:10px;border:1px dashed var(--line)">'+
            '🔑 <strong>역할:</strong> '+esc(c.aiRole)+' &nbsp;|&nbsp; 🔑 <strong>규칙:</strong> 3줄 이내로 대답하기'+
          '</div>'+
          '<div style="font-size:12.5px;font-weight:700;color:var(--ink);margin-bottom:6px">💡 질문 골라보기 (클릭하면 바로 대화해요)</div>'+
          '<div class="ai-chips" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">'+
            (c.aiSuggestions||[]).map(function(s) {
              return '<button class="ai-chip-btn" data-key="'+c.key+'" style="background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:12.5px;color:var(--deep);font-weight:600;cursor:pointer;transition:all .15s;outline:none">'+esc(s)+'</button>';
            }).join('')+
          '</div>'+
          '<div style="display:flex;gap:8px;margin-bottom:14px">'+
            '<input type="text" class="ai-input" data-key="'+c.key+'" placeholder="AI 친구에게 더 궁금한 것을 직접 물어보세요! (안전 규칙: 비밀정보 적지 않기)" style="flex:1;border:1.5px solid var(--line);border-radius:12px;padding:10px 14px;font-size:13.5px;outline:none;background:#fff">'+
            '<button class="ai-send-btn" data-key="'+c.key+'" style="background:var(--deep);color:#fff;border:none;border-radius:12px;padding:0 18px;font-size:13.5px;font-weight:700;cursor:pointer;transition:all .2s">AI에 물어보기</button>'+
          '</div>'+
          '<div class="ai-response-box" data-key="'+c.key+'" style="display:none;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;min-height:60px;font-size:14px;color:var(--ink);line-height:1.6;position:relative">'+
          '</div>'+
        '</div>'+

        (srcHtml? '<div class="sources"><div class="src-ttl">원문 및 추천 배움처 — QR로 바로 가기</div><div class="src-list">'+srcHtml+'</div></div>':'')+
        '<div class="critic-footer">🧊 교과 연계 검증 · '+factLabel+' · 배움처 링크 '+crit.links_ok+'/'+crit.links_checked+' 확인'+((crit.dead_links||[]).length? ' (죽은 링크 '+crit.dead_links.length+'개 제외)':'')+' · 아동 가독성 '+(crit.readability||'-')+'/5</div>';
      host.appendChild(art);
    });

    // QR 코드 생성
    document.querySelectorAll('.qr').forEach(function(el){
      try{ new QRCode(el,{text:el.getAttribute('data-url'),width:80,height:80,colorDark:'#2a5a4b',colorLight:'#fffdf9',correctLevel:QRCode.CorrectLevel.M}); }catch(e){}
    });

    // AI 생각 놀이터 이벤트 바인딩
    document.querySelectorAll('.ai-chip-btn').forEach(function(btn) {
      btn.onclick = function() {
        var key = btn.getAttribute('data-key');
        var question = btn.textContent;
        var input = document.querySelector('.ai-input[data-key="'+key+'"]');
        input.value = question;
        sendCornerAi(key, question);
      };
    });

    document.querySelectorAll('.ai-send-btn').forEach(function(btn) {
      btn.onclick = function() {
        var key = btn.getAttribute('data-key');
        var input = document.querySelector('.ai-input[data-key="'+key+'"]');
        var question = (input.value || '').trim();
        if (!question) return;
        sendCornerAi(key, question);
      };
    });

    document.querySelectorAll('.ai-input').forEach(function(input) {
      input.onkeydown = function(e) {
        if (e.key === 'Enter') {
          var key = input.getAttribute('data-key');
          var question = (input.value || '').trim();
          if (!question) return;
          sendCornerAi(key, question);
        }
      };
    });

    function sendCornerAi(key, question) {
      var corner = DATA.corners.find(function(c){return c.key === key});
      if (!corner) return;

      logActivity('ai_ask', (corner.title.split(' · ')[0] || corner.title) + ' AI 질문', '질문: "' + question + '"');

      var resBox = document.querySelector('.ai-response-box[data-key="'+key+'"]');
      resBox.style.display = 'block';
      resBox.innerHTML = '<div style="display:flex;align-items:center;gap:6px;color:var(--muted);font-size:13px">🤖 <i>AI 친구가 열심히 생각하고 있어요...</i></div>';

      // 마법 열쇠 조합 프롬프트
      var prompt = '[역할] ' + corner.aiRole + '\n' +
                   '[규칙] 어린이가 이해하기 쉬운 비유와 쉬운 낱말을 사용하여 다정하고 공손하게(해요체) 3줄 이내로 답변해줘.\n' +
                   '[질문] ' + question;

      fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, mode: 'yeonlife_kid' })
      })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res && res.text) {
          resBox.innerHTML = 
            '<div style="font-size:12.5px;color:var(--accent);font-weight:700;margin-bottom:4px">나의 질문:</div>' +
            '<div style="background:#fdf6ee;padding:10px 12px;border-radius:12px;border-right:3.5px solid var(--accent);margin-bottom:12px;word-break:keep-all">'+esc(question)+'</div>' +
            '<div style="font-size:12.5px;color:var(--deep);font-weight:700;margin-bottom:4px">🤖 AI 친구의 답변:</div>' +
            '<div style="background:#edf4f0;padding:12px 14px;border-radius:12px;border-left:3.5px solid var(--deep);word-break:keep-all;line-height:1.6">'+esc(res.text).replace(/\n/g, '<br>')+'</div>';
          logActivity('ai_response', (corner.title.split(' · ')[0] || corner.title) + ' AI 답변 수신', '답변: "' + res.text.replace(/\n/g, ' ') + '"');
        } else {
          resBox.innerHTML = '<div style="color:var(--accent)">⚠️ AI 답변을 받아오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>';
        }
      })
      .catch(function(err) {
        console.error(err);
        resBox.innerHTML = 
          '<div style="color:var(--muted);font-size:13.5px;line-height:1.6">' +
          '⚠️ <strong>AI 생각 발전소가 아직 쉬고 있어요!</strong><br>' +
          '연라이프 서버와 인터넷 연결이 완료된 후에 진짜 AI 친구와 실시간 대화를 나눌 수 있답니다.<br>' +
          '대신 오늘 배운 마법 열쇠 질문을 머릿속으로 그려 보거나 엄마, 아빠와 함께 답해 보는 것은 어떨까요?' +
          '</div>';
      });
    }

    // 자동 로그인 및 활동 로그 기록
    function checkUserSession() {
      var current = null;
      try {
        current = JSON.parse(localStorage.getItem('yl-current') || 'null');
      } catch(e){}
      
      if (!current) {
        var welcomeBox = document.createElement('div');
        welcomeBox.id = 'welcome-guest-box';
        welcomeBox.style.cssText = 'background:var(--soft);border:1.5px dashed var(--deep);border-radius:18px;padding:22px;margin:24px 0;text-align:center;font-family:var(--sans)';
        welcomeBox.innerHTML = 
          '<h3 style="color:var(--deep);margin-bottom:8px;font-size:16px;font-family:var(--serif)">🧸 반가워요, 꼬마 탐험가님!</h3>' +
          '<p style="font-size:13px;color:var(--muted);margin-bottom:14px">한 번만 이름을 적어두면, 앞으로 공부한 내역과 생각의 씨앗이 빠짐없이 잘 기록돼요!</p>' +
          '<div style="display:flex;justify-content:center;gap:8px;max-width:320px;margin:0 auto">' +
            '<input type="text" id="guest-name-input" placeholder="내 이름이나 귀여운 별명" style="flex:1;border:1.5px solid var(--line);border-radius:10px;padding:10px 14px;font-size:13.5px;outline:none;background:#fff">' +
            '<button onclick="saveGuestSession()" style="background:var(--deep);color:#fff;border:none;border-radius:10px;padding:0 20px;font-size:13.5px;font-weight:700;cursor:pointer;transition:all .2s">확인</button>' +
          '</div>';
        var verifyBanner = document.getElementById('verify');
        if (verifyBanner) {
          verifyBanner.parentNode.insertBefore(welcomeBox, verifyBanner.nextSibling);
        }
      } else {
        logActivity('read_start', '잡지 펼치기', current.nick + ' 어린이가 유치부 잡지를 읽기 시작했습니다.');
      }
    }

    window.saveGuestSession = function() {
      var input = document.getElementById('guest-name-input');
      var name = (input.value || '').trim();
      if (!name) {
        alert('이름을 입력해 주세요!');
        return;
      }
      var user = { id: 'guest_' + Date.now(), nick: name, role: 'student', isGuest: true };
      try {
        localStorage.setItem('yl-current', JSON.stringify(user));
        var box = document.getElementById('welcome-guest-box');
        if (box) box.remove();
        logActivity('read_start', '잡지 펼치기', name + ' 어린이가 유치부 잡지를 읽기 시작했습니다.');
        location.reload();
      } catch(e){}
    }

    function logActivity(type, title, detail) {
      var current = null;
      try {
        current = JSON.parse(localStorage.getItem('yl-current') || 'null');
      } catch(e){}
      
      var nick = current ? current.nick : '손님';
      var id = current ? current.id : 'guest';
      
      var activity = {
        userId: id,
        userNick: nick,
        timestamp: Date.now(),
        type: type,
        title: title,
        detail: detail,
        magazine: '유치부'
      };
      
      try {
        var logs = JSON.parse(localStorage.getItem('yl-activities') || '[]');
        logs.push(activity);
        if (logs.length > 100) logs.shift();
        localStorage.setItem('yl-activities', JSON.stringify(logs));
      } catch(e){}
    }

    // 초기 바인딩 및 세션 체크
    setTimeout(function() {
      checkUserSession();
      
      // 목차 클릭 이벤트 가로채기
      document.querySelectorAll('#toc a').forEach(function(link){
        link.addEventListener('click', function(){
          var name = link.textContent;
          logActivity('view_corner', name + ' 읽기', name + ' 코너로 이동하여 읽기 시작했습니다.');
        });
      });

      // 생각의 씨앗 답변 실시간 저장
      document.querySelectorAll('.thought-input').forEach(function(textarea){
        var key = textarea.getAttribute('data-key');
        var qidx = textarea.getAttribute('data-qidx');
        try {
          var logs = JSON.parse(localStorage.getItem('yl-activities') || '[]');
          var lastAns = '';
          for (var i = logs.length - 1; i >= 0; i--) {
            if (logs[i].type === 'seed_answer' && logs[i].detail.indexOf('코너: ' + key + ' | 문항: ' + qidx) === 0) {
              var parts = logs[i].detail.split('\\n답변: "');
              if (parts.length > 1) {
                lastAns = parts[1].substring(0, parts[1].length - 1);
                break;
              }
            }
          }
          if (lastAns) {
            textarea.value = lastAns;
          }
        } catch(e){}

        textarea.addEventListener('change', function(){
          var val = (textarea.value || '').trim();
          if(!val) return;
          var key = textarea.getAttribute('data-key');
          var qidx = textarea.getAttribute('data-qidx');
          var corner = DATA.corners.find(function(c){return c.key === key});
          var cornerTitle = corner ? (corner.title.split(' · ')[0] || corner.title) : key;
          var qText = corner ? corner.thoughtQuestions[qidx] : '';
          
          logActivity('seed_answer', cornerTitle + ' 생각의 씨앗 답변', '코너: ' + key + ' | 문항: ' + qidx + '\\n질문: "' + qText + '"\\n답변: "' + val + '"');
        });
      });
    }, 100);
  </script>
"""

reconstructed += logic_start + "\n"

# Add Tablet/PC Split View Controller Script with y-tts Player Logic
split_script = """
<script>
  // ===== 태블릿/PC 스플릿 뷰 컨트롤러 스크립트 =====
  var VOCAB_DATA = {
  "science": [
    {
      "word": "터널 (Tunnel)",
      "desc": "흙 속에 지렁이가 기어가며 뚫은 작은 길이에요. 이 길로 맑은 공기와 물이 흘러가요."
    },
    {
      "word": "영양분 (Nutrition)",
      "desc": "꽃과 나무가 쑥쑥 자랄 수 있도록 도와주는 땅속의 맛있는 밥 같은 힘이에요."
    }
  ],
  "math": [
    {
      "word": "둥글둥글 (Round)",
      "desc": "뾰족한 모서리가 하나도 없고 예쁘게 생겨서 떼구루루 잘 굴러가는 동그라미 모양이에요."
    },
    {
      "word": "차곡차곡 (Pile up)",
      "desc": "장난감 블록을 아래에서부터 위로 비뚤어지지 않게 예쁘고 튼튼하게 쌓는 모양이에요."
    }
  ],
  "hangeul": [
    {
      "word": "흉내 (Mimic)",
      "desc": "토끼처럼 깡충깡충 뛰어보거나 시냇물처럼 졸졸졸 말해보는 재밌는 따라하기 놀이예요."
    },
    {
      "word": "말놀이 (Word game)",
      "desc": "예쁜 소리가 나는 우리말들을 입으로 조잘조잘 말하면서 재미를 느끼는 말하기 게임이에요."
    }
  ],
  "english": [
    {
      "word": "원어민 (Native)",
      "desc": "영어를 매일 쓰는 미국이나 영국의 친구들처럼, 태어날 때부터 영어를 말해온 사람들을 뜻해요."
    },
    {
      "word": "울음소리 (Voice)",
      "desc": "동물 친구들이 배가 고프거나 기분이 좋을 때 목소리를 내어 소리치는 말소리예요."
    }
  ],
  "future": [
    {
      "word": "로봇 (Robot)",
      "desc": "스스로 움직이고 머리에 신기한 컴퓨터 뇌를 넣어 만든 똑똑한 기계 친구예요."
    },
    {
      "word": "비밀번호 (Secret)",
      "desc": "가족들끼리만 꼭꼭 숨겨두고 지켜야 하는 아주 소중한 비밀 약속이에요."
    }
  ],
  "fairytale": [
    {
      "word": "보슬보슬 (Drizzle)",
      "desc": "비가 하늘에서 아기 새싹들을 향해 부드럽고 춤추듯 살포시 내리는 예쁜 비 모양이에요."
    },
    {
      "word": "보배 (Treasure)",
      "desc": "세상에서 가장 소중하고 가치 있어서 반짝반짝 빛나는 아주 귀한 보물을 뜻해요."
    }
  ],
  "parents": [
    {
      "word": "보물상자 (Box)",
      "desc": "내가 하루 동안 스스로 해낸 착하고 예쁜 일들을 가득 모아두는 상상 속의 예쁜 선물함이에요."
    },
    {
      "word": "자존감 (Self-love)",
      "desc": "\\"나는 세상에 하나뿐인 제일 소중한 아이야!\\" 하고 내 스스로를 사랑하는 튼튼한 마음이에요."
    }
  ]
};
  var activeNavKey = null;

  // TTS 음성 출력 함수 (낱말카드용)
  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      
      // 낱말카드 읽기도 유치부 선생님 목소리와 톤을 따름
      utterance.rate = 0.8;
      utterance.pitch = 1.15;
      var voice = getYoungFemaleTeacherVoice();
      if (voice) utterance.voice = voice;
      
      window.speechSynthesis.speak(utterance);
    }
  }

  // 낱말 해설 출력
  function renderVocabulary(key) {
    var vocabContainer = document.getElementById('vocab-content');
    if (!vocabContainer) return;
    
    var list = VOCAB_DATA[key] || [];
    if (list.length === 0) {
      vocabContainer.innerHTML = '<div style="font-size:13px; color:var(--muted); text-align:center; margin-top:40px; font-style:italic;">이 코너에는 어려운 낱말이 없어요!</div>';
      return;
    }
    
    vocabContainer.innerHTML = list.map(function(item) {
      var speakStr = item.word.split(' (')[0] + '. ' + item.desc;
      return '<div class="vocab-card">' +
               '<div class="vocab-word-row">' +
                 '<span class="vocab-word">' + esc(item.word) + '</span>' +
                 '<button class="tts-btn" onclick="speakText(\\\'' + esc(speakStr).replace(/'/g, "\\\\'") + '\\\')" title="소리 듣기">🔊</button>' +
               '</div>' +
               '<p class="vocab-desc">' + esc(item.desc) + '</p>' +
             '</div>';
    }).join('');
  }

  // 네비게이션 아이템 활성화 하이라이트
  function highlightNavItem(key) {
    document.querySelectorAll('.nav-item').forEach(function(el) {
      el.classList.remove('active');
    });
    
    var activeItem = document.getElementById('nav-item-' + key);
    if (activeItem) {
      activeItem.classList.add('active');
      
      // 스크롤 시 자동 스크롤
      var leftPanel = document.getElementById('left-panel');
      if (leftPanel) {
        var itemRect = activeItem.getBoundingClientRect();
        var panelRect = leftPanel.getBoundingClientRect();
        if (itemRect.top < panelRect.top || itemRect.bottom > panelRect.bottom) {
          activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }

  // 네비게이션 버튼 클릭 핸들러
  function handleNavClick(key) {
    if (activeNavKey !== key) {
      activeNavKey = key;
      highlightNavItem(key);
      renderVocabulary(key);
    } else {
      // 이미 켜진 경우, 해당 위치로 스크롤
      var target = document.getElementById('c-' + key);
      var centerPanel = document.querySelector('.center-panel');
      if (target && centerPanel) {
        if (window.innerWidth >= 1024) {
          var panelTop = centerPanel.getBoundingClientRect().top;
          var targetTop = target.getBoundingClientRect().top;
          centerPanel.scrollBy({
            top: targetTop - panelTop - 10,
            behavior: 'smooth'
          });
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }

  // ===== y-tts: 구연동화 책 읽어주기 기능 구현 =====
  var ttsState = {
    currentKey: null,
    currentIndex: 0,
    nodes: [],
    paused: false,
    utterance: null
  };

  // 1. 젊은 여성 선생님 하이톤 목소리 매칭
  function getYoungFemaleTeacherVoice() {
    if (!('speechSynthesis' in window)) return null;
    var voices = window.speechSynthesis.getVoices();
    var koVoices = voices.filter(function(v) {
      return v.lang === 'ko-KR' || v.lang.indexOf('ko') === 0;
    });
    
    var preferredNames = ['yuna', 'heami', 'google', 'kyuri', 'ara', 'female', 'woman', '여성', '혜미', '유나'];
    for (var i = 0; i < preferredNames.length; i++) {
      var p = preferredNames[i];
      for (var j = 0; j < koVoices.length; j++) {
        if (koVoices[j].name.toLowerCase().indexOf(p) !== -1) {
          return koVoices[j];
        }
      }
    }
    return koVoices[0] || null;
  }

  // 2. TTS 낭독 텍스트 노드 추출
  function getTtsNodes(key) {
    var article = document.getElementById('c-' + key);
    if (!article) return [];
    
    var nodes = [];
    
    var kicker = article.querySelector('.kicker');
    if (kicker) {
      var text = kicker.textContent.split(' · ')[0] || kicker.textContent;
      nodes.push({ el: kicker, text: text + ' 코너예요.' });
    }
    
    var headline = article.querySelector('.headline');
    if (headline) nodes.push({ el: headline, text: '오늘의 이야기: ' + headline.textContent });
    
    var dek = article.querySelector('.dek');
    if (dek) nodes.push({ el: dek, text: dek.textContent });
    
    var body = article.querySelector('.body');
    if (body) {
      var textEls = body.querySelectorAll('p, h2, h3, li');
      textEls.forEach(function(el) {
        if (el.tagName === 'LI' && el.querySelector('p')) return;
        var text = (el.textContent || '').trim();
        if (text) {
          nodes.push({ el: el, text: text });
        }
      });
    }
    
    var future = article.querySelector('.future');
    if (future) {
      var futureB = future.querySelector('b');
      var futureP = future.querySelector('p');
      if (futureB) nodes.push({ el: future, text: futureB.textContent });
      if (futureP) nodes.push({ el: future, text: futureP.textContent });
    }
    
    var thoughtSeeds = article.querySelector('.thought-seeds');
    if (thoughtSeeds) {
      var thoughtTitle = thoughtSeeds.querySelector('b');
      if (thoughtTitle) nodes.push({ el: thoughtSeeds, text: thoughtTitle.textContent });
      
      var questions = thoughtSeeds.querySelectorAll('p');
      questions.forEach(function(el) {
        var text = (el.textContent || '').trim();
        if (text) {
          nodes.push({ el: el, text: text });
        }
      });
    }

    return nodes;
  }

  // 3. UI 변경
  function updateTtsUi(key, state) {
    var playBtn = document.getElementById('y-tts-play-' + key);
    var pauseBtn = document.getElementById('y-tts-pause-' + key);
    var stopBtn = document.getElementById('y-tts-stop-' + key);
    var statusText = document.getElementById('y-tts-status-' + key);
    var progContainer = document.getElementById('y-tts-progress-container-' + key);
    var avatar = document.querySelector('.y-tts-player[data-key="' + key + '"] .y-tts-teacher-avatar');

    if (!playBtn) return;

    if (state === 'playing') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-flex';
      stopBtn.style.display = 'inline-flex';
      statusText.innerHTML = '<span style="color:var(--accent);">🌸 다정한 목소리로 책 읽어주는 중...</span>';
      progContainer.style.display = 'block';
      if (avatar) avatar.style.animation = 'y-tts-bounce 0.8s infinite ease-in-out';
    } else if (state === 'paused') {
      playBtn.style.display = 'inline-flex';
      playBtn.textContent = '▶ 이어 듣기';
      pauseBtn.style.display = 'none';
      stopBtn.style.display = 'inline-flex';
      statusText.innerHTML = '<span>⏸ 잠시 멈췄어요</span>';
      if (avatar) avatar.style.animation = 'none';
    } else {
      playBtn.style.display = 'inline-flex';
      playBtn.textContent = '🔊 책 읽어주기';
      pauseBtn.style.display = 'none';
      stopBtn.style.display = 'none';
      statusText.textContent = 'y-tts 유치부 선생님 구연동화';
      progContainer.style.display = 'none';
      var progBar = document.getElementById('y-tts-progress-' + key);
      if (progBar) progBar.style.width = '0%';
      if (avatar) avatar.style.animation = 'y-tts-bounce 2s infinite ease-in-out';
    }
  }

  // 4. 재생
  window.playCornerTts = function(key) {
    if (!('speechSynthesis' in window)) {
      alert('이 기기는 목소리 읽기 기능을 지원하지 않아요!');
      return;
    }

    if (ttsState.currentKey && ttsState.currentKey !== key) {
      stopCornerTts(ttsState.currentKey);
    }

    if (ttsState.paused && ttsState.currentKey === key) {
      window.speechSynthesis.resume();
      ttsState.paused = false;
      updateTtsUi(key, 'playing');
      return;
    }

    window.speechSynthesis.cancel();
    
    ttsState.currentKey = key;
    ttsState.currentIndex = 0;
    ttsState.nodes = getTtsNodes(key);
    ttsState.paused = false;

    if (ttsState.nodes.length === 0) return;

    updateTtsUi(key, 'playing');
    playNextTtsNode();
  }

  // 5. 다음 노드 낭독 루프
  function playNextTtsNode() {
    if (ttsState.currentIndex >= ttsState.nodes.length) {
      stopCornerTts(ttsState.currentKey);
      return;
    }

    var key = ttsState.currentKey;
    var node = ttsState.nodes[ttsState.currentIndex];
    
    ttsState.nodes.forEach(function(n) {
      if (n.el) n.el.classList.remove('y-tts-reading');
    });

    if (node.el) {
      node.el.classList.add('y-tts-reading');
      node.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    var progressPercent = (ttsState.currentIndex / ttsState.nodes.length) * 100;
    var progBar = document.getElementById('y-tts-progress-' + key);
    if (progBar) progBar.style.width = progressPercent + '%';

    var utterance = new SpeechSynthesisUtterance(node.text);
    utterance.lang = 'ko-KR';
    
    var isSlow = document.getElementById('y-tts-slow-' + key).checked;
    utterance.rate = isSlow ? 0.75 : 0.95; // 유치부 대상을 위한 slow rate(0.75x) 적용
    utterance.pitch = 1.20; // 하이톤 젊은 여성 선생님 목소리 구현 (1.20)

    var voice = getYoungFemaleTeacherVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = function() {
      if (ttsState.currentKey === key && !ttsState.paused) {
        ttsState.currentIndex++;
        playNextTtsNode();
      }
    };

    utterance.onerror = function(e) {
      console.error(e);
      if (ttsState.currentKey === key && !ttsState.paused) {
        ttsState.currentIndex++;
        playNextTtsNode();
      }
    };

    ttsState.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  // 6. 일시정지
  window.pauseCornerTts = function(key) {
    if (ttsState.currentKey === key) {
      window.speechSynthesis.pause();
      ttsState.paused = true;
      updateTtsUi(key, 'paused');
    }
  }

  // 7. 정지
  window.stopCornerTts = function(key) {
    window.speechSynthesis.cancel();
    
    if (ttsState.nodes) {
      ttsState.nodes.forEach(function(n) {
        if (n.el) n.el.classList.remove('y-tts-reading');
      });
    }

    updateTtsUi(key, 'stopped');

    ttsState.currentKey = null;
    ttsState.currentIndex = 0;
    ttsState.nodes = [];
    ttsState.paused = false;
    ttsState.utterance = null;
  }

  // 초기 로딩 후 스크립트 실행
  window.addEventListener('DOMContentLoaded', function() {
    var navList = document.getElementById('nav-list');
    if (navList && DATA && DATA.corners) {
      navList.innerHTML = DATA.corners.map(function(c) {
        var name = c.title.split(' · ')[0] || c.title;
        return '<div class="nav-item" id="nav-item-' + c.key + '" data-key="' + c.key + '">' +
                 '<div class="nav-row" style="display:flex; align-items:center; gap:8px; width:100%;">' +
                   '<span class="nav-dot" id="nav-dot-' + c.key + '" style="width:8px; height:8px; border-radius:50%; background:var(--line); transition:all .25s; flex-shrink:0;"></span>' +
                   '<button class="nav-btn" id="nav-btn-' + c.key + '" onclick="handleNavClick(\\\'' + c.key + '\\\')" style="flex:1; text-align:left; background:none; border:none; padding:8px 12px; border-radius:10px; font-size:13.5px; font-weight:700; color:var(--muted); cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:6px; outline:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + esc(name) + '</button>' +
                 '</div>' +
                 '<div class="nav-summary" id="nav-summary-' + c.key + '" style="max-height:0; opacity:0; overflow:hidden; transition:all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); padding-left:16px; font-size:11.5px; color:var(--pine); line-height:1.5; margin-top:0; margin-bottom:0;">' +
                   esc(c.dek) +
                 '</div>' +
               '</div>';
      }).join('');
    }

    var centerPanel = document.querySelector('.center-panel');
    if (centerPanel) {
      var isScrolling = false;
      centerPanel.addEventListener('scroll', function() {
        if (window.innerWidth < 1024) return;
        
        if (!isScrolling) {
          window.requestAnimationFrame(function() {
            var articles = document.querySelectorAll('.corner');
            var activeKey = null;
            var minDiff = Infinity;
            var panelRect = centerPanel.getBoundingClientRect();
            var panelTop = panelRect.top;
            
            articles.forEach(function(art) {
              var rect = art.getBoundingClientRect();
              var diff = Math.abs(rect.top - panelTop - 20);
              if (diff < minDiff) {
                minDiff = diff;
                activeKey = art.id.replace('c-', '');
              }
              
              if (rect.top <= panelTop + 150 && rect.bottom >= panelTop + 150) {
                activeKey = art.id.replace('c-', '');
              }
            });
            
            if (activeKey && activeNavKey !== activeKey) {
              activeNavKey = activeKey;
              highlightNavItem(activeKey);
              renderVocabulary(activeKey);
            }
            isScrolling = false;
          });
          isScrolling = true;
        }
      });
    }
    
    if (DATA && DATA.corners && DATA.corners[0]) {
      var firstKey = DATA.corners[0].key;
      activeNavKey = firstKey;
      highlightNavItem(firstKey);
      renderVocabulary(firstKey);
    }

    // voiceschanged 이벤트 핸들링 (비동기적으로 로딩되는 목소리 목록 갱신을 위해)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = function() {
        // 목소리 갱신시 캐싱 해제용
        console.log("Speech voices loaded / updated.");
      };
    }
  });
</script>
</body>
</html>
"""

reconstructed += split_script

# Write reconstructed code to yuchi index.html
with open(yuchi_path, 'w', encoding='utf-8') as f:
    f.write(reconstructed)

print("Reconstructed yuchi index.html successfully!")
