# 🎬 유튜브 콘텐츠 칼럼화: 타임스탬프 구간 반복 위젯 구현 및 활용법 (복습 노트)

블로그 포스팅 및 학습을 위해, 유튜브 영상의 특정 대사/장면을 클릭하여 **바로 재생하고 무한 반복(구간 루프)**할 수 있는 인터랙티브 학습형 칼럼의 구현 원리와 전체 통합 코드를 정리합니다. 

이 기술은 영어 교육뿐만 아니라 강연, 코딩 강의, 과학 다큐멘터리 등 다양한 비디오 자료를 텍스트 칼럼과 결합할 때 매우 강력한 학습 효율을 제공합니다.

---

## 💡 핵심 작동 원리

이 장치는 **유튜브 Iframe Player API**를 기반으로 자바스크립트를 이용해 플레이어를 세밀하게 컨트롤합니다.

1. **유튜브 API 비동기 로드**: HTML이 로드될 때 유튜브 Iframe API 스크립트를 동적으로 로드하고 `onYouTubeIframeAPIReady` 콜백을 통해 플레이어 객체를 생성합니다.
2. **구간 반복 감시 엔진 (Loop Monitor)**:
   - 비디오가 `PLAYING` 상태가 되면 `setInterval`을 활성화하여 **50ms(0.05초) 주기**로 현재 재생 위치(`getCurrentTime()`)를 실시간 감시합니다.
   - 재생 위치가 지정된 세그먼트의 **끝점(`yeonLoopEnd - 0.1초 마진`)**에 도달하거나, 사용자가 강제로 뒤로 넘겨 시작점 이전(`yeonLoopStart - 1.5초`)으로 이탈하면 플레이어를 즉시 **시작점(`yeonLoopStart`)**으로 되감기(`seekTo`)합니다.
3. **버튼 하이라이트 및 상태 제어**:
   - 세그먼트 데이터 배열(`yeonSegs`)에서 버튼을 클릭하면 타임스탬프를 갱신하고 `highlightBtn()`을 통해 활성화된 버튼에만 보더 및 배경색 강조 효과를 줍니다.

---

## 🛠️ 통합 코드 템플릿 (Copy & Paste용)

블로그나 다른 개발 프로젝트에서 바로 가져다 쓸 수 있는 단일 HTML/CSS/JS 통합 구조 코드입니다. 다른 영상에 적용할 때는 **영상 ID(Video ID)**와 **`yeonSegs` 배열의 초 단위 데이터**만 수정하면 즉시 작동합니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>유튜브 인터랙티브 칼럼 템플릿</title>
  <style>
    body {
      font-family: 'Noto Sans KR', sans-serif;
      background-color: #f7f9fa;
      color: #333;
      padding: 20px;
    }
    .container {
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }
    /* 유튜브 플레이어 비율 유지 박스 */
    .player-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .player-wrapper iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
    /* 문장 목록 컨테이너 */
    .dialogue-box {
      border: 1px solid #eef1f2;
      border-radius: 12px;
      padding: 16px;
      background: #fafbfc;
    }
    .dialogue-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e5060;
      margin: 0 0 12px 0;
    }
    /* 문장 클릭 버튼 */
    .seg-btn {
      width: 100%;
      text-align: left;
      background: #ffffff;
      border: 1px solid #cfd8dc;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 8px;
      cursor: pointer;
      font-size: 13.5px;
      color: #37474f;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .seg-btn:hover {
      background: #f0f4f8;
      border-color: #90a4ae;
    }
    .seg-time {
      color: #0288d1;
      font-weight: 700;
      font-size: 12px;
      flex-shrink: 0;
    }
    .seg-text {
      flex-grow: 1;
    }
  </style>
</head>
<body>

<div class="container">
  <h2>📖 유튜브 대화형 칼럼 위젯</h2>
  
  <!-- 1. 유튜브 플레이어 프레임 -->
  <div class="player-wrapper">
    <div id="yeon-yt-player-main"></div>
  </div>

  <!-- 2. 구간 반복 제어 UI -->
  <div class="dialogue-box">
    <p class="dialogue-title">🔁 문장을 고르면 해당 구간만 무한 반복 재생됩니다.</p>
    <div id="buttons-list">
      <!-- 자바스크립트에 의해 버튼이 동적 생성됩니다 -->
    </div>
  </div>
</div>

<script>
  // ==========================================
  // [설정값 수정 부분]
  // ==========================================
  // 1. 대상 유튜브 비디오 ID (예: https://youtu.be/V7QcsrpRZhA 이면 'V7QcsrpRZhA')
  var videoId = "a5h2qKL5HRU"; 
  
  // 2. 주요 문장들의 타임스탬프 데이터 (s: 시작 초, e: 끝 초, l: 표시 텍스트)
  var yeonSegs = [
    { s: 15.84, e: 20.24, l: "May I take your order? (주문하시겠어요?)" },
    { s: 22.10, e: 26.50, l: "I'd like a cheeseburger, please. (치즈버거 하나 주세요.)" },
    { s: 30.15, e: 35.80, l: "Would you like anything to drink? (음료도 필요하신가요?)" },
    { s: 38.40, e: 43.10, l: "Just water for me, thank you. (그냥 물로 주세요, 감사합니다.)" }
  ];
  // ==========================================

  var yeonPlayerMain = null;
  var yeonLoopInterval = null;
  var yeonLoopStart = 0;
  var yeonLoopEnd = 0;
  var yeonIsLooping = false;
  var yeonCurIdx = -1;

  // 유튜브 Iframe API 비동기 로드
  (function() {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  })();

  // 유튜브 API 준비 완료 시 호출
  window.onYouTubeIframeAPIReady = function() {
    yeonPlayerMain = new YT.Player('yeon-yt-player-main', {
      videoId: videoId,
      playerVars: {
        'autoplay': 0,
        'enablejsapi': 1,
        'rel': 0,
        'cc_load_policy': 1,
        'cc_lang_pref': 'ko'
      },
      events: {
        'onStateChange': onPlayerStateChange
      }
    });
  };

  // 플레이어 상태 변화 리스너
  function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
      startLoopMonitor();
    } else {
      stopLoopMonitor();
    }
  }

  // 실시간 루프 감시 (50ms 단위)
  function startLoopMonitor() {
    if (yeonLoopInterval) clearInterval(yeonLoopInterval);
    yeonLoopInterval = setInterval(function() {
      if (!yeonPlayerMain || !yeonIsLooping) return;
      try {
        var state = yeonPlayerMain.getPlayerState();
        if (state !== YT.PlayerState.PLAYING) return;
        var currentTime = yeonPlayerMain.getCurrentTime();
        
        // 끝점 도달(0.1초 마진) 또는 이전 범위 이탈 시 재감기
        if (currentTime >= (yeonLoopEnd - 0.1) || currentTime < yeonLoopStart - 1.5) {
          yeonPlayerMain.seekTo(yeonLoopStart, true);
        }
      } catch(e) {}
    }, 50);
  }

  function stopLoopMonitor() {
    if (yeonLoopInterval) {
      clearInterval(yeonLoopInterval);
      yeonLoopInterval = null;
    }
  }

  // 특정 문장 클릭 시 처리
  function selectSeg(idx) {
    if (!yeonSegs[idx]) return;
    yeonCurIdx = idx;
    yeonLoopStart = yeonSegs[idx].s;
    yeonLoopEnd = yeonSegs[idx].e;
    yeonIsLooping = true;
    
    if (yeonPlayerMain && typeof yeonPlayerMain.seekTo === 'function') {
      yeonPlayerMain.seekTo(yeonLoopStart, true);
      yeonPlayerMain.playVideo();
    }
    highlightBtn(idx);
  }

  // 활성화된 버튼 시각적 강조
  function highlightBtn(idx) {
    var buttons = document.querySelectorAll('.seg-btn');
    buttons.forEach(function(btn, i) {
      var isCurrent = (i === idx);
      btn.style.background = isCurrent ? '#f0f7f9' : '#ffffff';
      btn.style.borderColor = isCurrent ? '#1e5060' : '#cfd8dc';
      btn.style.fontWeight = isCurrent ? '700' : '400';
    });
  }

  // HTML 내 문장 버튼들 자동 생성
  function renderButtons() {
    var container = document.getElementById('buttons-list');
    yeonSegs.forEach(function(seg, idx) {
      var min = Math.floor(seg.s / 60);
      var sec = Math.floor(seg.s % 60);
      var timeStr = (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
      
      var button = document.createElement('button');
      button.className = 'seg-btn';
      button.setAttribute('data-yseg', idx);
      button.onclick = function() { selectSeg(idx); };
      
      button.innerHTML = '<span class="seg-time">[' + timeStr + ']</span>' +
                         '<span class="seg-text">' + seg.l + '</span>';
      container.appendChild(button);
    });
  }

  // 로딩 완료 시 버튼 렌더링
  window.onload = function() {
    renderButtons();
  };
</script>

</body>
</html>
