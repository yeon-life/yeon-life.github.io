/* ==========================================================================
   연(緣)의 사랑방 — 자족형 위젯 (Saranbang Widget)
   단 한 줄로 설치: <script src="saranbang-widget.js"></script>
   결과: 오른쪽 아래 "緣에 묻다" 플로팅 버튼이 나타나고, 클릭 시
          다섯 겹 응답 사랑방 모달이 열립니다.

   버전: 1.0.0
   출처: Y Life (https://y-life.com) — 연소사(緣小師) 이진우
   라이선스: 연프로젝트 내부용

   설정 (선택사항):
     <script>
       window.YeonSaranbangConfig = {
         lang: 'ko',             // 'ko' | 'en' (기본: 자동 감지)
         position: 'bottom-right', // 'bottom-right' | 'bottom-left'
         host: 'Yeon Agent'      // 응답에 표시될 이 위젯의 설치 위치 (선택)
       };
     </script>
     <script src="saranbang-widget.js"></script>
   ========================================================================== */

(function () {
  'use strict';

  if (window.__YeonSaranbangLoaded) return;
  window.__YeonSaranbangLoaded = true;

  const VERSION = '1.0.0';
  const CFG = window.YeonSaranbangConfig || {};

  // ========== 언어 데이터 ==========
  const LOCALES = {
    ko: {
      float: '緣에 묻다',
      hanja: '緣',
      title: '연(緣)의 사랑방',
      sub: '당신의 한 문장이 누군가의 인연이 될 때',
      placeholder: '마음에 품은 질문을 가볍게 놓아주세요...',
      submit: '인연을 묻다',
      hint: '익명 가능 · AI가 다섯 겹 응답과 배치를 도와드립니다',
      close: '닫기',
      routing: '이 질문은 🌳 질문 숲 · 자기주도 카테고리에 자동으로 배치되었어요. 비슷한 고민 12명이 답을 달았습니다.',
      layers: [
        { tag: 'Guidance', label: '한 줄의 길잡이',
          body: '포기하고 싶다는 마음이 올라온다는 건 의지가 약해서가 아니라, 당신이 <strong>의식적으로 이 순간을 바라보고 있다</strong>는 증거입니다.' },
        { tag: 'Essay', label: '연소사의 한 편',
          body: '「100일 습관에서 가장 위험한 시기」 · 2026.04.10<br><em>"15~21일은 뇌가 이게 정말 나의 새 일상인가를 판단하는 분기점이다."</em>' },
        { tag: 'Voice', label: '다른 이의 한 마디',
          body: '"저도 17일째에 똑같았어요. 오늘만은 쉬자 하고 하루 쉬었더니, 다음 날 20일을 더 갈 수 있는 힘이 생겼어요." — 민지 · 고1' },
        { tag: 'Today', label: '오늘의 한 걸음',
          body: '오늘만 1분 하세요. 평소 5분이든 10분이든 오늘은 1분이어도 됩니다. 그 1분이 내일의 2분이 됩니다.' },
        { tag: 'Mirror', label: '더 깊은 세 질문', questions: [
          '이 고민을 시작할 때 가장 처음 떠올랐던 그림은 무엇이었나요?',
          '"포기하고 싶다"와 "쉬고 싶다"는 정말 같은 말일까요?',
          '15일 전의 나에게 지금의 내가 한 마디를 건넬 수 있다면, 뭐라고 말해주고 싶나요?'
        ]}
      ],
      poweredBy: 'Y Life — 연(緣)의 집에서'
    },
    en: {
      float: 'Ask 緣',
      hanja: '緣',
      title: "Yeon's Saranbang",
      sub: 'When one line of yours becomes someone\'s connection',
      placeholder: 'Let the question in your heart rest here, gently...',
      submit: 'Ask Yeon',
      hint: 'Anonymous available · AI helps with the fivefold response',
      close: 'Close',
      routing: 'This question is placed in 🌳 Question Forest · Self-direction. 12 others have answered similar concerns.',
      layers: [
        { tag: 'Guidance', label: 'A guiding line',
          body: 'The wish to give up is not proof of weak will — it\'s proof that you are <strong>consciously looking at this moment</strong>.' },
        { tag: 'Essay', label: 'A column by Yeonsosa',
          body: '"The most dangerous window in a 100-day habit" · Apr 10, 2026<br><em>"Days 15 to 21 are when the brain decides: is this really my new daily life?"</em>' },
        { tag: 'Voice', label: 'Another\'s word',
          body: '"I felt the same on day 17. I told myself \'just rest today,\' and the rest gave me strength for twenty more days." — Minji · 11th' },
        { tag: 'Today', label: "Today's one step",
          body: 'Do only one minute today. Whether you usually do five or ten, one minute is fine today. That minute becomes tomorrow\'s two.' },
        { tag: 'Mirror', label: 'Three deeper questions', questions: [
          'When you first began, what was the very first image you saw?',
          'Is "I want to quit" really the same as "I want to rest"?',
          'If the you of 15 days ago could hear one word from today\'s you, what would you say?'
        ]}
      ],
      poweredBy: 'From Y Life — Home of 緣'
    }
  };

  // ========== 언어 감지 ==========
  function detectLang() {
    if (CFG.lang && LOCALES[CFG.lang]) return CFG.lang;
    const html = document.documentElement.lang || '';
    if (html.startsWith('en')) return 'en';
    if (html.startsWith('ko')) return 'ko';
    const browser = (navigator.language || 'ko').toLowerCase();
    return browser.startsWith('ko') ? 'ko' : 'en';
  }
  let lang = detectLang();
  const L = () => LOCALES[lang];

  // ========== CSS 주입 (모든 클래스 .ys- 접두어로 스코핑) ==========
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@700;800&family=Noto+Serif+KR:wght@400;700&family=Playfair+Display:wght@700&display=swap');

    .ys-float {
      position: fixed;
      right: 40px; bottom: 40px;
      z-index: 2147483000;
      display: inline-flex; align-items: center; gap: 10px;
      padding: 18px 28px;
      background: #1D1D1B; color: #F8F6F2;
      font-family: 'Noto Serif KR', serif;
      font-size: 14px; letter-spacing: 0.25em;
      border: none; cursor: pointer;
      box-shadow: 0 20px 50px rgba(29, 29, 27, 0.35);
      transition: all 0.3s ease;
    }
    .ys-float:hover { background: #5D4037; letter-spacing: 0.3em; }
    .ys-float .ys-hanja {
      font-weight: 900; font-size: 16px; letter-spacing: 0;
    }
    @media (max-width: 640px) {
      .ys-float { right: 16px; bottom: 16px; padding: 14px 20px; font-size: 12px; }
    }
    .ys-pos-bl { left: 40px; right: auto; }
    @media (max-width: 640px) { .ys-pos-bl { left: 16px; right: auto; } }

    .ys-modal {
      position: fixed; inset: 0;
      background: rgba(29, 29, 27, 0.6);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      z-index: 2147483500;
      display: none;
      align-items: flex-start; justify-content: center;
      padding: 20px; overflow-y: auto;
    }
    .ys-modal.ys-open { display: flex; animation: ys-fadeIn 0.3s ease; }
    @keyframes ys-fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .ys-modal-inner {
      background: #F8F6F2;
      width: 100%; max-width: 860px;
      padding: 70px 50px;
      margin: 30px 0;
      position: relative;
      border: 1px solid #1D1D1B;
      animation: ys-slideUp 0.4s ease;
      font-family: 'Noto Serif KR', serif;
      color: #1D1D1B;
      line-height: 1.8;
      word-break: keep-all;
    }
    @keyframes ys-slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .ys-modal-inner::before {
      content: "緣";
      position: absolute; top: 20px; right: 40px;
      font-family: 'Noto Serif KR', serif;
      font-size: 4.5rem; color: #5D4037; opacity: 0.07;
    }
    @media (max-width: 640px) {
      .ys-modal-inner { padding: 60px 24px; margin: 10px 0; }
    }

    .ys-close {
      position: absolute; top: 20px; right: 20px;
      width: 36px; height: 36px;
      border: 1px solid #1D1D1B; background: transparent;
      color: #1D1D1B; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s ease;
    }
    .ys-close:hover { background: #1D1D1B; color: #F8F6F2; }

    .ys-title {
      font-family: 'Nanum Myeongjo', serif;
      font-size: clamp(1.6rem, 3vw, 2.2rem);
      font-weight: 800;
      text-align: center;
      margin-bottom: 14px;
      color: #1D1D1B;
    }
    .ys-sub {
      text-align: center;
      color: #5D4037;
      font-style: italic;
      margin-bottom: 40px;
      font-size: 0.95rem;
    }

    .ys-form { max-width: 760px; margin: 0 auto; }
    .ys-textarea {
      width: 100%; border: none;
      border-bottom: 1px solid #1D1D1B;
      background: transparent;
      font-family: 'Noto Serif KR', serif;
      font-size: 1.15rem;
      padding: 18px 0;
      resize: none; outline: none;
      color: #1D1D1B; line-height: 1.6;
      transition: border-color 0.3s ease;
    }
    .ys-textarea:focus { border-bottom-color: #B08E61; }
    .ys-textarea::placeholder { color: rgba(29,29,27,0.4); font-style: italic; }

    .ys-form-footer {
      margin-top: 30px; display: flex;
      justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 16px;
    }
    .ys-hint { font-size: 0.75rem; color: rgba(29,29,27,0.5); letter-spacing: 0.05em; }
    .ys-submit {
      background: #1D1D1B; color: #F8F6F2;
      padding: 14px 42px; border: none;
      font-family: 'Noto Serif KR', serif;
      font-size: 0.88rem; letter-spacing: 0.28em;
      cursor: pointer; transition: all 0.3s ease;
    }
    .ys-submit:hover { background: #5D4037; letter-spacing: 0.33em; }
    @media (max-width: 600px) {
      .ys-form-footer { flex-direction: column; align-items: stretch; }
      .ys-submit { width: 100%; }
    }

    .ys-responses { margin-top: 60px; display: none; }
    .ys-responses.ys-active { display: block; }

    .ys-routing {
      font-size: 0.82rem; color: #B08E61;
      padding-bottom: 30px; border-bottom: 1px solid rgba(29,29,27,0.08);
      margin-bottom: 40px;
      font-style: italic; text-align: center;
    }

    .ys-layer {
      margin-bottom: 40px; padding-bottom: 30px;
      border-bottom: 1px dotted #B08E61;
      opacity: 0; transform: translateY(20px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    .ys-layer.ys-show { opacity: 1; transform: translateY(0); }
    .ys-layer:last-child { border-bottom: none; }

    .ys-layer-tag {
      font-family: 'Playfair Display', serif;
      font-size: 0.72rem; letter-spacing: 0.3em;
      color: #B08E61; text-transform: uppercase;
      margin-bottom: 12px; font-weight: 700;
    }
    .ys-layer-label {
      font-family: 'Nanum Myeongjo', serif;
      font-size: 1.1rem; font-weight: 700;
      color: #5D4037; margin-bottom: 14px;
    }
    .ys-layer p {
      font-size: 0.98rem; color: #1D1D1B;
      line-height: 1.85; margin: 0;
    }
    .ys-layer p strong { color: #5D4037; }

    .ys-layer ol { list-style: none; padding: 0; counter-reset: q; margin: 0; }
    .ys-layer ol li {
      counter-increment: q;
      padding: 12px 0 12px 36px; position: relative;
      border-bottom: 1px dotted rgba(29,29,27,0.08);
      font-size: 0.95rem; line-height: 1.8;
    }
    .ys-layer ol li:last-child { border-bottom: none; }
    .ys-layer ol li::before {
      content: counter(q) ".";
      position: absolute; left: 0; top: 12px;
      font-family: 'Playfair Display', serif;
      font-weight: 700; color: #B08E61; font-size: 0.95rem;
    }

    .ys-powered {
      margin-top: 50px; padding-top: 24px;
      border-top: 1px dotted rgba(29,29,27,0.08);
      text-align: center;
      font-family: 'Playfair Display', serif;
      font-size: 0.72rem; letter-spacing: 0.18em;
      color: rgba(29,29,27,0.4);
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-yeon-saranbang-widget', VERSION);
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ========== HTML 생성 ==========
  const positionClass = CFG.position === 'bottom-left' ? 'ys-pos-bl' : '';

  const btn = document.createElement('button');
  btn.className = `ys-float ${positionClass}`;
  btn.setAttribute('aria-label', L().float);
  btn.innerHTML = `<span class="ys-hanja">${L().hanja}</span><span class="ys-float-label">${L().float}</span>`;
  document.body.appendChild(btn);

  const modal = document.createElement('div');
  modal.className = 'ys-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = renderModalInner();
  document.body.appendChild(modal);

  function renderModalInner() {
    const l = L();
    return `
      <div class="ys-modal-inner">
        <button class="ys-close" aria-label="${l.close}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <h2 class="ys-title">${l.title}</h2>
        <p class="ys-sub">${l.sub}</p>
        <form class="ys-form">
          <textarea class="ys-textarea" placeholder="${l.placeholder}" rows="1"></textarea>
          <div class="ys-form-footer">
            <span class="ys-hint">${l.hint}</span>
            <button type="submit" class="ys-submit">${l.submit}</button>
          </div>
        </form>
        <div class="ys-responses">
          <div class="ys-routing">${l.routing}</div>
          ${l.layers.map(function(layer) {
            if (layer.questions) {
              return `
                <div class="ys-layer">
                  <div class="ys-layer-tag">${layer.tag}</div>
                  <div class="ys-layer-label">${layer.label}</div>
                  <ol>${layer.questions.map(function(q){ return '<li>' + q + '</li>'; }).join('')}</ol>
                </div>
              `;
            }
            return `
              <div class="ys-layer">
                <div class="ys-layer-tag">${layer.tag}</div>
                <div class="ys-layer-label">${layer.label}</div>
                <p>${layer.body}</p>
              </div>
            `;
          }).join('')}
          <div class="ys-powered">${l.poweredBy}</div>
        </div>
      </div>
    `;
  }

  // ========== 동작 ==========
  function open() {
    modal.classList.add('ys-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() {
      const ta = modal.querySelector('.ys-textarea');
      ta && ta.focus();
    }, 180);
  }

  function close() {
    modal.classList.remove('ys-open');
    document.body.style.overflow = '';
    const responses = modal.querySelector('.ys-responses');
    if (responses) {
      responses.classList.remove('ys-active');
      responses.querySelectorAll('.ys-layer').forEach(function(l) { l.classList.remove('ys-show'); });
    }
    const ta = modal.querySelector('.ys-textarea');
    if (ta) { ta.value = ''; ta.style.height = 'auto'; }
  }

  function reveal() {
    const responses = modal.querySelector('.ys-responses');
    responses.classList.add('ys-active');
    responses.querySelectorAll('.ys-layer').forEach(function(layer, i) {
      setTimeout(function() { layer.classList.add('ys-show'); }, 300 + i * 400);
    });
    setTimeout(function() {
      responses.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }

  function autoResize(ta) {
    ta.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
  }

  btn.addEventListener('click', open);
  modal.addEventListener('click', function(e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('ys-open')) close();
  });
  modal.querySelector('.ys-close').addEventListener('click', close);
  modal.querySelector('.ys-form').addEventListener('submit', function(e) {
    e.preventDefault();
    reveal();
  });
  autoResize(modal.querySelector('.ys-textarea'));

  // ========== 공개 API ==========
  window.YeonSaranbang = {
    version: VERSION,
    open: open,
    close: close,
    setLang: function(newLang) {
      if (!LOCALES[newLang]) return;
      lang = newLang;
      // 버튼 텍스트
      btn.querySelector('.ys-float-label').textContent = L().float;
      btn.querySelector('.ys-hanja').textContent = L().hanja;
      btn.setAttribute('aria-label', L().float);
      // 모달 재렌더
      modal.innerHTML = renderModalInner();
      // 핸들러 재바인딩
      modal.querySelector('.ys-close').addEventListener('click', close);
      modal.querySelector('.ys-form').addEventListener('submit', function(e) {
        e.preventDefault(); reveal();
      });
      autoResize(modal.querySelector('.ys-textarea'));
    }
  };

  // 콘솔 도장
  try {
    console.log(
      '%c緣 %cYeon Saranbang Widget v' + VERSION + ' loaded',
      'font-family: serif; color: #5D4037; font-size: 18px; font-weight: 700;',
      'color: #B08E61; font-size: 12px;'
    );
  } catch (e) {}

})();
