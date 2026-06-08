import os
import sys
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

wanseongbon_path = 'c:\\Claude\\연라이프\\yeon-life.github.io\\도서관\\완성책장\\001_ㄱㄴㄷ친구들이깨어났어요\\완성본.html'

with open(wanseongbon_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add CSS styling for y-tts to the style tag
y_tts_css = """
  /* y-tts Player Enhancements */
  .y-tts-reading {
    background: rgba(245, 222, 179, 0.35) !important;
    border-left: 4px solid var(--warm) !important;
    padding-left: 8px !important;
    transition: all 0.4s ease;
  }
  .tb-btn.tts-play {
    background: var(--warm);
    color: #fff;
    border-color: var(--warm);
  }
  .tb-btn.tts-play:hover {
    background: var(--warm2);
  }
  .tb-btn.tts-active {
    background: var(--soft);
    color: #fff;
    border-color: var(--soft);
  }
  @keyframes y-tts-pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
  .tts-reading-status {
    animation: y-tts-pulse 1.5s infinite ease-in-out;
  }
"""

if '</style>' in content:
    content = content.replace('</style>', y_tts_css + '\n</style>', 1)
else:
    print("Error: </style> not found")
    sys.exit(1)

# 2. Modify Top bar HTML to include TTS controls
old_topbar = """<div class="topbar" id="topbar"><div class="t" id="tb-title"></div>
  <div class="btns"><button class="tb-btn" id="tb-lang" onclick="toggleEdition()">🌐 English</button></div></div>"""

new_topbar = """<div class="topbar" id="topbar"><div class="t" id="tb-title"></div>
  <div class="btns">
    <button class="tb-btn tts-play-btn tts-play" id="tts-play" onclick="playBookTts()">🔊 구연동화</button>
    <button class="tb-btn tts-pause-btn" id="tts-pause" onclick="pauseBookTts()" style="display:none;">⏸ 멈춤</button>
    <button class="tb-btn tts-stop-btn" id="tts-stop" onclick="stopBookTts()" style="display:none;">⏹ 정지</button>
    <button class="tb-btn tts-speed-btn" id="tts-speed" onclick="toggleTtsSpeed()">🐌 천천히</button>
    <button class="tb-btn" id="tb-lang" onclick="toggleEdition()">🌐 English</button>
  </div>
</div>"""

if old_topbar in content:
    content = content.replace(old_topbar, new_topbar, 1)
elif '<div class="topbar" id="topbar">' in content:
    pattern = r'<div class="topbar" id="topbar">.*?</div>\s*</div>'
    content = re.sub(pattern, new_topbar, content, count=1, flags=re.DOTALL)
else:
    content = content.replace('<div class="topbar" id="topbar"><div class="t" id="tb-title"></div>', '<div class="topbar" id="topbar"><div class="t" id="tb-title"></div>')
    content = content.replace('<div class="btns"><button class="tb-btn" id="tb-lang" onclick="toggleEdition()">🌐 English</button></div>', 
                              """<div class="btns">
    <button class="tb-btn tts-play-btn tts-play" id="tts-play" onclick="playBookTts()">🔊 구연동화</button>
    <button class="tb-btn tts-pause-btn" id="tts-pause" onclick="pauseBookTts()" style="display:none;">⏸ 멈춤</button>
    <button class="tb-btn tts-stop-btn" id="tts-stop" onclick="stopBookTts()" style="display:none;">⏹ 정지</button>
    <button class="tb-btn tts-speed-btn" id="tts-speed" onclick="toggleTtsSpeed()">🐌 천천히</button>
    <button class="tb-btn" id="tb-lang" onclick="toggleEdition()">🌐 English</button>
  </div>""")

# 3. Replace speak and readPage functions with y-tts sequential engine
new_tts_logic = """
/* ===== y-tts: 구연동화 책 읽어주기 엔진 ===== */
var ttsState = {
  active: false,
  currentIndex: -1,
  paused: false,
  speed: 'slow', // 'slow' or 'normal'
  utterance: null
};

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

function speak(t) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    var u = new SpeechSynthesisUtterance(t);
    u.lang = edition === 'en' ? 'en-US' : 'ko-KR';
    
    // Apply speed
    if (ttsState.speed === 'slow') {
      u.rate = edition === 'en' ? 0.80 : 0.75; // 유치부용 slow rate (0.75x)
    } else {
      u.rate = edition === 'en' ? 0.95 : 0.95; // 보통 rate (0.95x)
    }
    
    // Apply high-pitch for young female teacher voice (1.20)
    u.pitch = edition === 'en' ? 1.05 : 1.20;
    
    var voice = getYoungFemaleTeacherVoice();
    if (voice) u.voice = voice;
    
    window.speechSynthesis.speak(u);
  } catch(e) {}
}

window.toggleTtsSpeed = function() {
  var btn = document.getElementById('tts-speed');
  if (ttsState.speed === 'slow') {
    ttsState.speed = 'normal';
    if (btn) btn.textContent = '⚡ 보통';
  } else {
    ttsState.speed = 'slow';
    if (btn) btn.textContent = '🐌 천천히';
  }
  
  // If playing, restart current page to apply speed immediately
  if (ttsState.active && !ttsState.paused) {
    playNextBookNode();
  }
}

window.playBookTts = function() {
  if (!('speechSynthesis' in window)) {
    alert('이 브라우저는 목소리 읽기 기능을 지원하지 않아요!');
    return;
  }

  if (ttsState.paused && ttsState.active) {
    window.speechSynthesis.resume();
    ttsState.paused = false;
    updateTtsControls('playing');
    return;
  }

  // Cancel any running speech
  window.speechSynthesis.cancel();
  
  ttsState.active = true;
  ttsState.paused = false;
  
  // Find which page is currently in view
  var cy = innerHeight / 2;
  var best = 0;
  var bd = 1e9;
  var spreads = document.querySelectorAll('#siteView .spread');
  
  spreads.forEach(function(s, i) {
    var r = s.getBoundingClientRect();
    var d = Math.abs((r.top + r.bottom) / 2 - cy);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });

  // Start reading from the best page in view
  ttsState.currentIndex = best;
  updateTtsControls('playing');
  playNextBookNode();
}

function playNextBookNode() {
  if (!ttsState.active || ttsState.paused) return;

  var spreads = document.querySelectorAll('#siteView .spread');
  
  // Remove all previous highlights
  spreads.forEach(function(s) {
    s.classList.remove('y-tts-reading');
  });

  if (ttsState.currentIndex >= spreads.length) {
    // Finished reading the book
    stopBookTts();
    return;
  }

  var targetSpread = spreads[ttsState.currentIndex];
  if (!targetSpread) {
    stopBookTts();
    return;
  }

  // Highlight and scroll smoothly
  targetSpread.classList.add('y-tts-reading');
  targetSpread.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Get text content of page
  var pageData = BOOK.pages[ttsState.currentIndex];
  var text = L(pageData, 'line');
  
  // Clean text a bit for better speech
  var speakText = text.replace(/\\n/g, ' ');

  var u = new SpeechSynthesisUtterance(speakText);
  u.lang = edition === 'en' ? 'en-US' : 'ko-KR';
  u.rate = ttsState.speed === 'slow' ? (edition === 'en' ? 0.80 : 0.75) : 0.95;
  u.pitch = edition === 'en' ? 1.05 : 1.20;
  
  var voice = getYoungFemaleTeacherVoice();
  if (voice) u.voice = voice;

  u.onend = function() {
    if (ttsState.active && !ttsState.paused) {
      // Natural 1 second pause between pages for kids to look at illustration
      setTimeout(function() {
        if (ttsState.active && !ttsState.paused) {
          ttsState.currentIndex++;
          playNextBookNode();
        }
      }, 1000);
    }
  };

  u.onerror = function(e) {
    console.error('y-tts error:', e);
    if (ttsState.active && !ttsState.paused) {
      ttsState.currentIndex++;
      playNextBookNode();
    }
  };

  ttsState.utterance = u;
  window.speechSynthesis.speak(u);
}

window.pauseBookTts = function() {
  if (ttsState.active) {
    window.speechSynthesis.pause();
    ttsState.paused = true;
    updateTtsControls('paused');
  }
}

window.stopBookTts = function() {
  window.speechSynthesis.cancel();
  
  var spreads = document.querySelectorAll('#siteView .spread');
  spreads.forEach(function(s) {
    s.classList.remove('y-tts-reading');
  });

  ttsState.active = false;
  ttsState.paused = false;
  ttsState.currentIndex = -1;
  ttsState.utterance = null;
  
  updateTtsControls('stopped');
}

function updateTtsControls(state) {
  var playBtn = document.getElementById('tts-play');
  var pauseBtn = document.getElementById('tts-pause');
  var stopBtn = document.getElementById('tts-stop');
  
  if (!playBtn) return;
  
  if (state === 'playing') {
    playBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    stopBtn.style.display = 'inline-block';
    playBtn.classList.remove('tts-play');
    playBtn.classList.add('tts-active');
  } else if (state === 'paused') {
    playBtn.style.display = 'inline-block';
    playBtn.textContent = '▶ 이어듣기';
    pauseBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
  } else { // stopped
    playBtn.style.display = 'inline-block';
    playBtn.textContent = '🔊 구연동화';
    pauseBtn.style.display = 'none';
    stopBtn.style.display = 'none';
    playBtn.classList.add('tts-play');
    playBtn.classList.remove('tts-active');
  }
}

function toggleEdition() {
  edition = edition === 'en' ? 'ko' : 'en';
  M = curMeta();
  G = curGloss();
  GKEYS = Object.keys(G).sort((a,b)=>b.length-a.length);
  idx = 0;
  
  // Stop TTS when switching languages
  stopBookTts();
  
  const b = document.getElementById('tb-lang');
  if (b) b.textContent = edition === 'en' ? '🌐 한국어' : '🌐 English';
  
  document.getElementById('st-title').textContent = M.title || '';
  document.getElementById('tb-title').textContent = M.title || '';
  document.getElementById('st-sub').textContent = M.sub || '';
  document.getElementById('st-badge').textContent = M.badge || '';
  document.title = M.title || '';
  
  const g = curGrow();
  const gtheme = g.theme_en || g.theme || '';
  const gdesc = g.desc_en || g.desc || '';
  const ggrade = g.grade_en || g.grade || '';
  document.getElementById('growBody').innerHTML = g ? `<b>${gtheme}</b><br>${gdesc}<br><span style="color:#7b8686;">${ggrade}</span>` : '';
  
  buildSite();
}

function readPage() {
  if (document.getElementById('bookView').classList.contains('show')) {
    const t = idx === 0 ? (M.title + '. ' + (M.sub || '')) : L(BOOK.pages[idx-1], 'line');
    speak(t.replace(/\\n/g, ' '));
  } else {
    const cy = innerHeight / 2;
    let best = null, bd = 1e9;
    document.querySelectorAll('#siteView .spread').forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs((r.top + r.bottom) / 2 - cy);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best != null) {
      speak(L(BOOK.pages[best], 'line').replace(/\\n/g, ' '));
    }
  }
}
"""

pattern = r'function speak\(t\).*?function readPage\(\)\{.*?\}\s*\}'
if re.search(pattern, content, re.DOTALL):
    content = re.sub(pattern, new_tts_logic, content, count=1, flags=re.DOTALL)
else:
    speak_idx = content.find('function speak(t)')
    readpage_idx = content.find('function readPage()')
    if speak_idx != -1 and readpage_idx != -1:
        end_idx = content.find('}}', readpage_idx) + 2
        content = content[:speak_idx] + new_tts_logic + content[end_idx:]
    else:
        print("Error: Could not locate speak or readPage functions in content")
        sys.exit(1)

with open(wanseongbon_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched 001_ㄱㄴㄷ친구들이깨어났어요 완성본.html successfully!")
