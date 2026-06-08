// --- SCRIPT BLOCK 0 ---

(function(){
  var items=[].slice.call(document.querySelectorAll('.navbar .nav-item.has-panel'));
  items.forEach(function(it){
    var b=it.querySelector('.nav-link');
    b.addEventListener('click',function(e){ e.preventDefault();
      var was=it.classList.contains('open');
      items.forEach(function(x){x.classList.remove('open');});
      if(!was) it.classList.add('open');
    });
  });
  document.addEventListener('click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(x){x.classList.remove('open');}); });
})();


// --- SCRIPT BLOCK 1 ---

  const trigger = document.getElementById('menuTrigger');
  const mega = document.getElementById('megaMenu');
  const overlay = document.getElementById('megaOverlay');
  const closeBtn = document.getElementById('megaClose');

  function openMenu(){ mega.classList.add('open'); overlay.classList.add('open'); trigger.classList.add('active'); document.body.classList.add('menu-open'); }
  function closeMenu(){ mega.classList.remove('open'); overlay.classList.remove('open'); trigger.classList.remove('active'); document.body.classList.remove('menu-open'); }

  trigger.addEventListener('click', () => mega.classList.contains('open') ? closeMenu() : openMenu());
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // 메가 헤더 좌측 로고(緣 y-life.kr) → 홈 — 같은 페이지면 메뉴만 닫고 빠져나감
  const megaBrand = document.getElementById('megaBrand');
  if (megaBrand) {
    megaBrand.addEventListener('click', e => {
      const here = location.pathname.split('/').pop();
      if (here === 'index.html' || here === '' || here === 'index.html') {
        e.preventDefault();
        closeMenu();
      }
      // 다른 페이지에서 메뉴 안의 로고를 누른 경우엔 href가 살아 그대로 홈으로 이동
    });
  }

  /* ============================================================
     상단 버튼 모달 — QR · 설정 · 로그인
     ============================================================ */
  (function topModals(){
    const tmOverlay = document.getElementById('tmOverlay');
    const modals = {
      qr: document.getElementById('tmModalQr'),
      settings: document.getElementById('tmModalSettings'),
      login: document.getElementById('tmModalLogin'),
      signup: document.getElementById('tmModalSignup'),
      version: document.getElementById('tmModalVersion'),
    };
    const toastEl = document.getElementById('tmToast');
    let toastTimer;

    function openModal(name){
      Object.values(modals).forEach(m => m && m.classList.remove('open'));
      const m = modals[name]; if (!m) return;
      tmOverlay.classList.add('open');
      m.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (name === 'qr') refreshQr();
      if (name === 'settings') refreshFz();
    }
    function closeAll(){
      Object.values(modals).forEach(m => m && m.classList.remove('open'));
      tmOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
    function toast(msg){
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
    }

    // 로그인 상태 갱신 함수
    function refreshAuthUI() {
      const current = localStorage.getItem('yl-current');
      const btnLogin = document.getElementById('btnLogin');
      if (!btnLogin) return;

      if (current) {
        try {
          const user = JSON.parse(current);
          btnLogin.setAttribute('data-tip', `${user.nick}님 (로그아웃)`);
          btnLogin.setAttribute('aria-label', `${user.nick}님 (로그아웃)`);
          btnLogin.classList.add('logged-in');
        } catch(e) {
          localStorage.removeItem('yl-current');
        }
      } else {
        btnLogin.setAttribute('data-tip', '로그인');
        btnLogin.setAttribute('aria-label', '로그인');
        btnLogin.classList.remove('logged-in');
      }
    }

    // 버튼 바인딩
    document.getElementById('btnQr').addEventListener('click', () => openModal('qr'));
    document.getElementById('btnSettings').addEventListener('click', () => openModal('settings'));
    document.getElementById('btnVersionHistory')?.addEventListener('click', (e) => { e.preventDefault(); openModal('version'); });
    document.getElementById('btnLogin').addEventListener('click', () => {
      if (localStorage.getItem('yl-current')) {
        if (confirm('로그아웃 하시겠습니까?')) {
          localStorage.removeItem('yl-current');
          toast('로그아웃 되었습니다.');
          refreshAuthUI();
        }
      } else {
        openModal('login');
      }
    });
    // btnSignup은 열쇠구멍 통합 후 제거됨 — 로그인 모달 안 "처음 오시나요?" 카드에서 가입 모달로 전환
    document.getElementById('btnSignup')?.addEventListener('click', () => openModal('signup'));
    // 로그인 ↔ 가입 모달 전환
    document.getElementById('goSignup').addEventListener('click', () => openModal('signup'));
    document.getElementById('goLogin').addEventListener('click', () => openModal('login'));
    // 역할 선택 (학생/성인)
    document.querySelectorAll('#signupRoleRow .tm-role').forEach(r => {
      r.addEventListener('click', e => {
        document.querySelectorAll('#signupRoleRow .tm-role').forEach(x => x.classList.remove('active'));
        r.classList.add('active');
        const v = r.dataset.role;
        r.querySelector('input').checked = true;
        const hint = document.getElementById('signupRoleHint');
        hint.textContent = v === 'student'
          ? '학생은 아골라·아곤란 모두 참여 가능합니다.'
          : '성인은 아골라에 참여하며, 인증된 선생님만 아곤란에 참여할 수 있습니다.';
      });
    });
    // 가입 제출 (localStorage 저장 (서버 연결 예정))
    document.getElementById('signupSubmit').addEventListener('click', () => {
      const id  = document.getElementById('signupId').value.trim();
      const nk  = document.getElementById('signupNick').value.trim();
      const pw  = document.getElementById('signupPw').value;
      const pw2 = document.getElementById('signupPw2').value;
      const role= document.querySelector('input[name="signupRole"]:checked')?.value || 'student';
      const msg = document.getElementById('signupMsg');
      msg.classList.remove('ok');
      if (!/^[a-zA-Z][a-zA-Z0-9]{5,19}$/.test(id))   { msg.textContent = '아이디는 영문으로 시작하고 영문·숫자 6~20자로 입력해 주세요.'; return; }
      if (!nk || nk.length < 2)            { msg.textContent = '별명을 2자 이상 입력해 주세요.'; return; }
      if (pw.length < 10)                  { msg.textContent = '비밀번호는 10자 이상으로 정해주세요.'; return; }
      if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) { msg.textContent = '비밀번호에 영문과 숫자를 함께 사용해 주세요.'; return; }
      if (pw !== pw2)                      { msg.textContent = '비밀번호가 일치하지 않습니다.'; return; }
      try {
        const users = JSON.parse(localStorage.getItem('yl-users') || '[]');
        if (users.find(u => u.id === id)) { msg.textContent = '이미 사용 중인 아이디입니다.'; return; }
        users.push({ id, nick: nk, pw, role, createdAt: Date.now() });
        localStorage.setItem('yl-users', JSON.stringify(users));
        localStorage.setItem('yl-current', JSON.stringify({ id, nick: nk, role }));
        refreshAuthUI();
      } catch(e) {}
      msg.classList.add('ok');
      msg.textContent = '가입되었습니다. 환영합니다, ' + nk + '님.';
      toast('가입 완료 — 환영합니다');
      setTimeout(closeAll, 1100);
    });
    // 로그인 제출
    document.getElementById('loginSubmit').addEventListener('click', () => {
      const id = document.getElementById('loginId').value.trim();
      const pw = document.getElementById('loginPw').value;
      const msg = document.getElementById('loginMsg');
      msg.classList.remove('ok');
      try {
        const users = JSON.parse(localStorage.getItem('yl-users') || '[]');
        const u = users.find(x => (x.id === id || x.nick === id) && x.pw === pw);
        if (!u) { msg.textContent = '아이디 또는 비밀번호가 맞지 않습니다.'; return; }
        localStorage.setItem('yl-current', JSON.stringify({ id: u.id, nick: u.nick, role: u.role }));
        refreshAuthUI();
        msg.classList.add('ok');
        msg.textContent = '환영합니다, ' + u.nick + '님.';
        toast(u.nick + '님, 다시 오셨네요');
        setTimeout(closeAll, 900);
      } catch(e) { msg.textContent = '로그인 처리 중 문제가 발생했습니다.'; }
    });
    // Enter 키로 제출
    document.getElementById('loginPw').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('loginSubmit').click(); });
    document.getElementById('signupPw2').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('signupSubmit').click(); });

    // 비밀번호 실시간 강도 미터
    (function pwMeter(){
      const pw = document.getElementById('signupPw');
      const fill = document.getElementById('pwBarFill');
      const hint = document.getElementById('pwHint');
      if (!pw || !fill || !hint) return;
      pw.addEventListener('input', () => {
        const v = pw.value;
        let score = 0;
        if (v.length >= 10) score++;
        if (v.length >= 14) score++;
        if (/[a-zA-Z]/.test(v) && /\d/.test(v)) score++;
        if (/[^a-zA-Z0-9]/.test(v)) score++;          // 특수문자
        // class 적용
        fill.className = '';
        hint.className = 'pw-hint';
        if (!v) {
          hint.textContent = '10자 이상 · 영문과 숫자를 함께. 특수문자(!@#$%^&* 등)를 섞으면 훨씬 안전합니다.';
          return;
        }
        const lv = Math.min(score, 4);
        if (lv >= 1) fill.classList.add('lv-' + lv);
        hint.classList.add('lv-' + lv);
        const messages = {
          0: '너무 짧습니다 — 10자 이상으로 늘려 주세요',
          1: '약함 — 영문과 숫자를 함께 사용해 주세요',
          2: '보통 — 특수문자(!@#$ 등)를 한두 개 섞으면 훨씬 안전합니다',
          3: '좋음 — 14자 이상이면 더 안전합니다',
          4: '아주 안전합니다 ✓'
        };
        hint.textContent = messages[lv] || messages[0];
      });
    })();
    // 구글 로그인 (자동 가동 셋업 후 Google Client ID 연결)
    document.getElementById('loginGoogleBtn').addEventListener('click', () => toast('구글 로그인은 자동 가동 셋업 후 활성화됩니다'));
    document.getElementById('signupGoogleBtn').addEventListener('click', () => toast('구글 가입은 자동 가동 셋업 후 활성화됩니다'));
    tmOverlay.addEventListener('click', closeAll);
    document.querySelectorAll('.tm-modal [data-close]').forEach(b => b.addEventListener('click', closeAll));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

    /* QR */
    function refreshQr(){
      const url = location.href;
      document.getElementById('tmQrUrl').textContent = url;
      const img = document.getElementById('tmQrImg');
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=' + encodeURIComponent(url);
      img.onerror = () => {
        // 외부 API 막혔을 때 fallback
        img.style.display = 'none';
        const fb = document.createElement('div');
        fb.className = 'tm-qr-fallback';
        fb.innerHTML = '<div style="text-align:center;padding:14px;font-size:12px;color:#666">QR 생성에 실패했습니다.<br>아래 주소를 직접 입력해 주세요.</div>';
        img.parentNode.insertBefore(fb, img);
      };
    }
    document.getElementById('tmCopyUrl').addEventListener('click', () => {
      const url = location.href;
      const done = () => toast('주소가 복사되었습니다');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
      } else {
        fallbackCopy(url, done);
      }
    });
    function fallbackCopy(text, cb){
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); cb && cb(); }
      catch (e) { toast('복사에 실패했습니다'); }
      document.body.removeChild(ta);
    }

    /* 설정 — 글자 크기 */
    function refreshFz(){
      let fz = 'md';
      try { fz = localStorage.getItem('yl-fz') || 'md'; } catch(e){}
      document.documentElement.setAttribute('data-fz', fz);
      document.querySelectorAll('#tmFzRow .tm-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.fz === fz);
      });
    }
    document.querySelectorAll('#tmFzRow .tm-pill').forEach(p => {
      p.addEventListener('click', () => {
        const fz = p.dataset.fz;
        document.documentElement.setAttribute('data-fz', fz);
        try { localStorage.setItem('yl-fz', fz); } catch(e){}
        document.querySelectorAll('#tmFzRow .tm-pill').forEach(x => x.classList.toggle('active', x===p));
        toast('글자 크기를 ' + ({sm:'작게',md:'보통',lg:'크게',xl:'아주 크게'})[fz] + '로 바꿨습니다');
      });
    });
    // 페이지 로드 시 저장된 크기 반영
    refreshFz();

    /* 설정 — 본문 글꼴 */
    function refreshFf(){
      let v=''; try{ v=localStorage.getItem('yl-ff')||''; }catch(e){}
      document.documentElement.setAttribute('data-ff', v);
      document.querySelectorAll('#tmFfRow .tm-pill').forEach(p => p.classList.toggle('active', (p.dataset.ff||'')===v));
    }
    document.querySelectorAll('#tmFfRow .tm-pill').forEach(p => {
      p.addEventListener('click', () => {
        const v=p.dataset.ff||'';
        document.documentElement.setAttribute('data-ff', v);
        try{ localStorage.setItem('yl-ff', v); }catch(e){}
        document.querySelectorAll('#tmFfRow .tm-pill').forEach(x => x.classList.toggle('active', x===p));
        toast('본문 글꼴을 ' + (v==='serif'?'명조':'돋움') + '로 바꿨습니다');
      });
    });
    refreshFf();

    /* 설정 — 줄 간격 */
    function refreshLs(){
      let v=''; try{ v=localStorage.getItem('yl-ls')||''; }catch(e){}
      document.documentElement.setAttribute('data-ls', v);
      document.querySelectorAll('#tmLsRow .tm-pill').forEach(p => p.classList.toggle('active', (p.dataset.ls||'')===v));
    }
    document.querySelectorAll('#tmLsRow .tm-pill').forEach(p => {
      p.addEventListener('click', () => {
        const v=p.dataset.ls||'';
        document.documentElement.setAttribute('data-ls', v);
        try{ localStorage.setItem('yl-ls', v); }catch(e){}
        document.querySelectorAll('#tmLsRow .tm-pill').forEach(x => x.classList.toggle('active', x===p));
        toast('줄 간격을 ' + ({'':'보통','wide':'넓게','xwide':'더 넓게'})[v] + '로 바꿨습니다');
      });
    });
    refreshLs();
    refreshAuthUI();

    /* 옛 대기 명단 폼은 가입 모달로 대체됨 — placeholder 가드만 유지 */

    /* ---------- 외부에서 사용할 수 있게 토스트 노출 ---------- */
    window.YL_TOAST = toast;
  })();

  /* ============================================================
     차림표 sub-item · quick-link 일괄 라우팅
     · 텍스트로 매핑 → 페이지 있으면 이동, 없으면 토스트
     ============================================================ */
  (function wireSubLinks(){
    // sub-name 텍스트로 라우팅
    const ROUTES = {
      // 광장
      '아골라 阿閣羅': '아골라_미리보기.html',
      '아곤란 阿昆蘭': '아곤란_미리보기.html',
      '이번 주 인사이트': '광장의_진짜_목적.html',
      '지금 깊어지는 글': '아골라_미리보기.html',
      '광장 규칙': '광장의_진짜_목적.html',
      // 화두
      '이 주의 화두 #19': '화두관리앱.html',
      '지난 화두 모아 보기': '화두관리앱.html',
      '예약된 화두': '화두관리앱.html',
      '화두 제안하기': '화두관리앱.html',
      // 칼럼 — 페르소나 인덱스
      '연소사': '블로그_AI작가기자_인덱스.html',
      '임선생': '블로그_AI작가기자_인덱스.html',
      '박주민': '블로그_AI작가기자_인덱스.html',
      '현지영': '블로그_AI작가기자_인덱스.html',
      // 세상 — 오늘의 15편
      '오늘의 뉴스': '오늘의_연라이프_2026-05-18.html',
      '시사': '오늘의_연라이프_2026-05-18.html',
      '세계 흐름': '오늘의_연라이프_2026-05-18.html',
      '미래 뉴스': '오늘의_연라이프_2026-05-18.html',
      '문화 · 체육': '오늘의_연라이프_2026-05-18.html',
      '우리 동네': '오늘의_연라이프_2026-05-18.html',
      // 시민 저널
      '6단계 검증이란?': '신뢰도_평가_정책.html',
      // 블로그
      '내 블로그': '블로그_AI작가기자_인덱스.html',
      '블로그 시작하기': '블로그_AI작가기자_인덱스.html',
    };

    // quick-link 텍스트로 라우팅
    const QL_ROUTES = {
      '아골라 글쓰기': '아골라_미리보기.html',
      '아곤란 질문하기': '아곤란_미리보기.html',
      '인사이트 Top 10': '광장의_진짜_목적.html',
      '지금 깊어지는 글': '아골라_미리보기.html',
      '오늘의 15편 모두 보기': '오늘의_연라이프_2026-05-18.html',
      '작가·기자 일람': '블로그_AI작가기자_인덱스.html',
    };

    function handle(el, routes, nameSel){
      // 이미 href가 채워져 있고 #이 아니면 그대로 둠
      const cur = el.getAttribute('href');
      if (cur && cur !== '#' && cur.trim() !== '') return;
      const nameEl = el.querySelector(nameSel);
      const name = (nameEl?.textContent || '').trim();
      const url = routes[name];
      if (url) {
        el.setAttribute('href', url);
        // <a>가 아니면 click으로 이동
        if (el.tagName.toLowerCase() !== 'a') {
          el.style.cursor = 'pointer';
          el.addEventListener('click', () => { location.href = url; });
        }
      } else {
        // 미연결 — 클릭 시 토스트
        el.addEventListener('click', e => {
          e.preventDefault();
          const t = window.YL_TOAST || ((m) => alert(m));
          t('"' + (name || '준비 중') + '"은 곧 열립니다');
        });
      }
    }

    function wireAll(){
      document.querySelectorAll('.sub-item').forEach(el => {
        // 인연의 다리 sub-item은 호버로 3열 패널을 바꾸는 게 본 동작 — 토스트 X
        if (el.hasAttribute('data-bridge')) return;
        handle(el, ROUTES, '.sub-name');
      });
      document.querySelectorAll('.quick-link').forEach(el => handle(el, QL_ROUTES, '.ql-name'));
    }

    // 초기 1회 + 메가 메뉴 동적 채움 후를 대비해 살짝 지연 호출도 추가
    wireAll();
    setTimeout(wireAll, 500);
    setTimeout(wireAll, 1500);
  })();

  // 대분류 hover/click — 2열·3열 동시 전환
  document.querySelectorAll('.cat-item').forEach(item => {
    item.addEventListener('mouseenter', () => switchPane(item.dataset.target));
    item.addEventListener('click', (e) => {
      switchPane(item.dataset.target);
      
      const target = item.dataset.target;
      const navMap = {
        'hwadu': '#hwadu',
        'plaza': '#plaza',
        'thoughtmap': '광장_생각지도.html',
        'columns': '#columns',
        'magazine': '#magazines',
        'sesang': '#world-now',
        'where': 'ulsan.html',
        'journal': 'news.html',
        'blog': '블로그_AI작가기자_인덱스.html',
        'bridge': '/내친구인공지능_월간/index.html'
      };
      
      const url = navMap[target];
      if (url) {
        closeMenu();
        if (url.startsWith('#')) {
          const targetEl = document.querySelector(url);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          location.href = url;
        }
      }
    });
  });
  function switchPane(target){
    document.querySelectorAll('.cat-item').forEach(c => c.classList.toggle('active', c.dataset.target === target));
    document.querySelectorAll('.mega-col-2-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === target));
    document.querySelectorAll('.mega-col-3-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === target));
  }

  /* 좁은 화면 — 카테고리별 아코디언 */
  (function mobileAccordion(){
    const mq = window.matchMedia('(max-width:1024px)');
    let mode = '';
    function apply(){
      const narrow = mq.matches;
      const want = narrow ? 'mobile' : 'desktop';
      if (want === mode) return;
      mode = want;
      const col2 = document.querySelector('.mega-col-2');
      if (narrow){
        document.querySelectorAll('.cat-item').forEach(cat => {
          const target = cat.dataset.target;
          const pane = document.querySelector(`.mega-col-2-pane[data-pane="${target}"]`);
          if (pane && cat.nextElementSibling !== pane){
            cat.parentNode.insertBefore(pane, cat.nextSibling);
          }
        });
      } else if (col2) {
        document.querySelectorAll('.mega-col-2-pane').forEach(p => col2.appendChild(p));
      }
    }
    apply();
    mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
    window.addEventListener('resize', apply);
  })();

  // reveal
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('visible')), {threshold:.12, rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ============================================================
     메가 메뉴 3열 — 실 글 동적 채우기 (YLV-4)
     · articles_today.js + personas.js 가 로드된 후 자동 채움
     · 세상 카테고리: 시사 / 세계 / 미래 / 우리 동네 / 전체 필터
     · 칼럼 카테고리: AI 작가 3편
     ============================================================ */
  (function fillMegaMenu(){
    // 의존성 대기
    function ready(){
      if (!window.YL_PERSONAS || !window.YL_ARTICLES_TODAY) {
        return setTimeout(ready, 100);
      }
      fillAll();
      wireSubcatHover();
    }
    ready();

    function fillAll(){
      // 칼럼은 SUB_PANEL.columns 기반으로 통합 처리됨 (fillColumns는 호출하지 않음)
      fillSesang('all');
      fillBridge('builder');
    }

    /* "칼럼" 패널 — AI 작가 3명 글 */
    function fillColumns(){
      const wrap = document.getElementById('megaPaneColumns');
      if (!wrap) return;
      const writers = (window.YL_PERSONAS || []).filter(p => p.kind === 'ai-writer');
      const items = writers.map(p => {
        const post = (p.posts || [])[0]; if (!post) return null;
        const art = window.YL_ARTICLES_TODAY[`${p.slug}|${post.id}`];
        return { p, post, art };
      }).filter(Boolean);
      if (!items.length) { wrap.innerHTML = '<div class="featured-block"><div class="featured-title">오늘의 칼럼이 곧 도착합니다.</div></div>'; return; }
      const featured = items[0]; // 류온 대표
      wrap.innerHTML = `
        <a class="featured-block" href="블로그_페르소나_칼럼.html?slug=${esc(featured.p.slug)}&post=${esc(featured.post.id)}" style="text-decoration:none;color:inherit;display:block">
          <div class="featured-tag">오늘의 작가 칼럼 · ${esc(featured.p.field)}</div>
          <div class="featured-title">${esc(featured.post.title)}</div>
          <div class="featured-deck">${esc(featured.post.excerpt || '')}</div>
          <div class="featured-meta"><span class="now">AI 작성</span>${esc(featured.p.name)} · 오늘 · 신뢰도 ${esc(featured.art?.trust?.score ?? '—')}</div>
        </a>
        <div class="quick-links" style="margin-top:18px">
          ${items.slice(1).map(it => `
            <a class="quick-link" href="블로그_페르소나_칼럼.html?slug=${esc(it.p.slug)}&post=${esc(it.post.id)}">
              ${it.p.avatarImage ? `
                <img src="${esc(it.p.avatarImage)}" alt="${esc(it.p.name)}" class="ql-ico" style="object-fit:cover;border-radius:50%;display:inline-block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">
                <span class="ql-ico" style="display:none;">${esc(it.p.avatar || it.p.name[0])}</span>
              ` : `
                <span class="ql-ico">${esc(it.p.avatar || it.p.name[0])}</span>
              `}
              <span class="ql-name">${esc(it.post.title)}</span>
            </a>`).join('')}
          <a class="quick-link" href="블로그_AI작가기자_인덱스.html">
            <span class="ql-ico">⋯</span><span class="ql-name">작가·기자 일람</span>
          </a>
        </div>
      `;
    }

    /* "세상" 패널 — 하위 카테고리별 필터 */
    function fillSesang(subcat){
      const wrap = document.getElementById('megaPaneSesang');
      if (!wrap) return;

      const reporters = (window.YL_PERSONAS || []).filter(p => p.kind === 'ai-reporter');
      const all = reporters.map(p => {
        const post = (p.posts || [])[0]; if (!post) return null;
        const art = window.YL_ARTICLES_TODAY[`${p.slug}|${post.id}`];
        return { p, post, art };
      }).filter(Boolean);

      // 분류 필터
      const filters = {
        all:      () => all,
        domestic: () => all.filter(it => ['사회','정치','경제·금융','교육','의료·건강'].includes(it.p.field)),
        world:    () => all.filter(it => ['국제·외교'].includes(it.p.field)),
        future:   () => all.filter(it => ['과학·기술','환경·기후'].includes(it.p.field)),
        ulsan:    () => all.filter(it => it.p.field === '울산 지역'),
        culture:  () => all.filter(it => ['문화·예술','스포츠','예능·대중문화'].includes(it.p.field)),
      };
      const items = (filters[subcat] || filters.all)();

      if (!items.length) {
        wrap.innerHTML = '<div class="featured-block"><div class="featured-title">이 분야의 오늘 글이 아직 도착하지 않았어요.</div></div>';
        return;
      }

      const subcatLabel = { all:'오늘의 뉴스 15편', domestic:'시사 · 한국', world:'세계 흐름', future:'미래 뉴스', ulsan:'우리 동네 · 울산', culture:'문화 · 체육' };
      // 가장 신뢰도 높은 글을 featured 로
      items.sort((a,b) => (b.art?.trust?.score||0) - (a.art?.trust?.score||0));
      const featured = items[0];
      const rest = items.slice(1, 5);

      wrap.innerHTML = `
        <a class="featured-block" href="블로그_페르소나_칼럼.html?slug=${esc(featured.p.slug)}&post=${esc(featured.post.id)}" style="text-decoration:none;color:inherit;display:block">
          <div class="featured-tag">${esc(subcatLabel[subcat] || '오늘의 뉴스')} · 오늘 헤드라인</div>
          <div class="featured-title">${esc(featured.post.title)}</div>
          <div class="featured-deck">${esc(featured.post.excerpt || '')}</div>
          <div class="featured-meta"><span class="now">AI 작성</span>${esc(featured.p.name)} · ${esc(featured.p.field)} · 신뢰도 ${esc(featured.art?.trust?.score ?? '—')}</div>
        </a>
        <div class="quick-links" style="margin-top:16px">
          ${rest.map(it => `
            <a class="quick-link" href="블로그_페르소나_칼럼.html?slug=${esc(it.p.slug)}&post=${esc(it.post.id)}" title="${esc(it.p.name)} · 신뢰도 ${esc(it.art?.trust?.score ?? '—')}">
              ${it.p.avatarImage ? `
                <img src="${esc(it.p.avatarImage)}" alt="${esc(it.p.name)}" class="ql-ico" style="object-fit:cover;border-radius:50%;display:inline-block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">
                <span class="ql-ico" style="display:none;background:${esc(it.p.color || '#2f5d62')};color:#fbf8f1">${esc(it.p.avatar || it.p.name[0])}</span>
              ` : `
                <span class="ql-ico" style="background:${esc(it.p.color || '#2f5d62')};color:#fbf8f1">${esc(it.p.avatar || it.p.name[0])}</span>
              `}
              <span class="ql-name">${esc(it.post.title.length > 28 ? it.post.title.slice(0,27)+'…' : it.post.title)}</span>
            </a>`).join('')}
          <a class="quick-link" href="/오늘의_연라이프_2026-05-18.html">
            <span class="ql-ico">→</span><span class="ql-name">오늘의 15편 모두 보기</span>
          </a>
        </div>
      `;
    }

    /* 2열 하위 항목 호버 시 3열 갱신 — idempotent (중복 호출 안전) */
    let _wiredSubcat = false;
    function wireSubcatHover(){
      if (_wiredSubcat) return;
      _wiredSubcat = true;
      document.querySelectorAll('.sub-item[data-subcat]').forEach(item => {
        const sub = item.dataset.subcat;
        const update = () => fillSesang(sub);
        item.addEventListener('mouseenter', update);
        item.addEventListener('click', update);
      });
      // 인연의 다리(bridge) sub-item 호버
      document.querySelectorAll('.sub-item[data-bridge]').forEach(item => {
        const sub = item.dataset.bridge;
        const update = () => fillBridge(sub);
        item.addEventListener('mouseenter', update);
        item.addEventListener('click', update);
      });
    }

    /* "인연의 다리" 패널 — sub별 콘텐츠 사전 */
    const BRIDGE_CONTENT = {
      yeonai: {
        tag: '연라이프 생태계 · 지금 운영 중인 마을',
        title: '연플래닝아카데미 — 자기주도 학습 코칭이 자라는 자리',
        deck: '연라이프와 한 가족인 첫 번째 마을. 일상의 결을 함께 나누는 사람들이 모여 있습니다. 한 번의 가입으로 광장·블로그·자서전 공방까지 함께 씁니다.',
        meta: ['지금 살고 있는 주민 1,247명', '한 계정 · 5개 공간'],
        quick: [
          { ico:'學', name:'연플래닝아카데미 보기', href:'yp/samsan/' },
          { ico:'入', name:'한 계정으로 가입하기', href:'#' },
          { ico:'問', name:'마을 자주 묻는 말', href:'#' }
        ]
      },
      supulai: {
        tag: '연라이프 생태계 · 완전학습 교육 AI',
        title: '수풀AI · 영풀 — 한 사람의 학생이 한 사람의 어른이 되는 길',
        deck: '연아카데미가 9년간 운영해 온 완전학습 철학을 그대로 담은 AI 학습 동반자. 점수가 아니라 이해를 묻고, 정답이 아니라 한 단계 더 좋은 물음을 키웁니다.',
        meta: ['현재 베타 운영 중', '연아카데미 학생·학부모 우선 초대'],
        quick: [
          { ico:'學', name:'수풀AI 소개 보기', href:'#' },
          { ico:'英', name:'영풀 — 영어 완전학습', href:'#' },
          { ico:'試', name:'베타 신청하기 (준비 중)', href:'javascript:void(0)', disabled:true }
        ]
      },
      builder: {
        tag: '연라이프 생태계 · 코딩 없이 만드는 페이지',
        title: '사이트 빌더 — 글을 쓰듯 사이트를 짓는 자리',
        deck: '블로그, 포트폴리오, 학원, 상점 등 6종의 감성 템플릿과 Mint Tide 등 4대 공식 테마를 골라 나만의 마당을 1분 만에 지어보세요. 광고 없는 정직한 빌더입니다.',
        meta: ['템플릿 6종 · 블로그 · 포트폴리오 · 상점 · 학원 · 작가 · 지역관광', '테마 4종 · Mint Tide · Warm Earth · Mauve Fog · Forest Dark'],
        quick: [
          { ico:'始', name:'템플릿 골라 시작', href:'builder.html' },
          { ico:'?', name:'빌더 도움말', href:'builder-guide.html' }
        ]
      },
      diagnosis: {
        tag: '연라이프 생태계 · 국가지원사업 맞춤형 매칭',
        title: '지원사업 자가진단 — 나에게 꼭 맞는 국가 및 울산시 혜택 찾기',
        deck: '1인 창업가, 소상공인, 학원 및 교육서비스업을 위한 10대 국가지원사업 실시간 진단 도구입니다. 구글 AI 에이전트(Antigravity)가 코드 무결성을 검증하고 100% 로컬 연산을 보증하므로 완벽하게 안심하고 활용하실 수 있습니다.',
        meta: ['100% 로컬 브라우저 보안 실행', '구글 AI 에이전트 기술 보증'],
        quick: [
          { ico:'📋', name: '지원사업 진단하기', href: 'challenge-diagnosis.html' },
          { ico:'📢', name: '긴급 공고 (연학원 전용)', href: 'challenge-1801.html' }
        ]
      },
      memoir: {
        tag: '연라이프 생태계 · 2027년 봄 예정',
        title: '자서전 공방 — 한 사람의 일생이 한 권의 책이 되는 자리',
        deck: '가장 오래된 글쓰기는 자기 삶의 기록입니다. 자서전 공방은 인터뷰·정리·편집·표지까지, 한 사람의 일생을 한 권의 책으로 옮기는 일을 함께합니다.',
        meta: ['2027년 봄 정식 개관', '관심 등록 후 우선 안내 예정'],
        quick: [
          { ico:'記', name:'관심 등록하기', href:'#' },
          { ico:'例', name:'자서전 견본 보기', href:'#' },
          { ico:'問', name:'자서전이란 무엇인가', href:'#' }
        ]
      }
    };

    function fillBridge(sub){
      const wrap = document.getElementById('megaPaneBridge');
      if (!wrap) return;
      const c = BRIDGE_CONTENT[sub] || BRIDGE_CONTENT.builder;
      // 활성 sub 표시
      document.querySelectorAll('.sub-item[data-bridge]').forEach(el => {
        el.classList.toggle('active', el.dataset.bridge === sub);
      });
      wrap.innerHTML = `
        <div class="featured-block">
          <div class="featured-tag">${esc(c.tag)}</div>
          <div class="featured-title">${esc(c.title)}</div>
          <div class="featured-deck">${esc(c.deck)}</div>
          <div class="featured-meta">${c.meta.map(m => esc(m)).join(' · ')}</div>
        </div>
        <div class="quick-links" style="margin-top:18px">
          ${c.quick.map(q => q.disabled
            ? `<span class="quick-link" aria-disabled="true" style="opacity:.55;cursor:not-allowed;" title="준비 중입니다">
                <span class="ql-ico">${esc(q.ico)}</span>
                <span class="ql-name">${esc(q.name)}</span>
               </span>`
            : (q.href === '#' || q.href === 'javascript:void(0)'
                ? `<span class="quick-link" aria-disabled="true" style="opacity:.55;cursor:not-allowed;" title="준비 중입니다">
                    <span class="ql-ico">${esc(q.ico)}</span>
                    <span class="ql-name">${esc(q.name)}</span>
                   </span>`
                : `<a class="quick-link" href="${esc(q.href)}">
                    <span class="ql-ico">${esc(q.ico)}</span>
                    <span class="ql-name">${esc(q.name)}</span>
                   </a>`)
          ).join('')}
        </div>
      `;
    }

    function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

    /* ============================================================
       모든 카테고리의 sub-item 호버 → 3열 통합 시스템
       (화두·광장·생각의 지도·칼럼·어디로·시민저널·블로그)
       세상(data-subcat) · 인연의 다리(data-bridge)는 별도 처리됨
       ============================================================ */
    const SUB_PANEL = {
      hwadu: {
        '이 주의 화두 #19': {
          tag:'이 주의 화두 · #19 · 2026.05.11—05.17',
          title:"사람은 자신이 의식적으로 선택한다고 믿지만, 그 이전에 이미 몸이 먼저 움직이기 시작한다.",
          deck:'연소사 제안 · Libet 실험에서 영감. 광장이 깊어지고 있습니다.',
          meta:'글 23편 · 좋은 물음 187',
          quick:[
            {ico:'議',name:'아골라에서 토론하기',href:'아골라_미리보기.html'},
            {ico:'問',name:'아곤란에서 묻기',href:'아곤란_미리보기.html'},
            {ico:'圖',name:'생각의 지도에서 보기',href:'광장_생각지도.html'}
          ]
        },
        '지난 화두 모아 보기': {
          tag:'지난 화두 · 18주분',
          title:'18주 동안의 화두를 한 자리에 모았습니다',
          deck:'주차별로 어떤 물음이 광장을 흔들었는지 한눈에 둘러볼 수 있습니다.',
          meta:'누적 글 412편 · 좋은 물음 3,890',
          quick:[
            {ico:'古',name:'전체 화두 보기',href:'화두관리앱.html'},
            {ico:'熱',name:'가장 깊었던 화두 Top 5',href:'화두관리앱.html'}
          ]
        },
        '예약된 화두': {
          tag:'관리자 화면 · 예약된 화두',
          title:'다음 4주의 화두가 예약되어 있습니다',
          deck:'제안된 화두를 한 줄로 미리 보고 순서를 옮길 수 있습니다.',
          meta:'예약 4편 · 후보 12편',
          quick:[
            {ico:'予',name:'예약 목록 열기',href:'화두관리앱.html'},
            {ico:'記',name:'관리자 가이드',href:'#'}
          ]
        },
        '화두 제안하기': {
          tag:'누구나 한 문장을',
          title:'광장에 던지고 싶은 한 문장을 적어주세요',
          deck:'심사를 거쳐 다음 주, 다다음 주의 화두로 올라갈 수 있습니다.',
          meta:'이번 주 제안 28편 · 누적 314편',
          quick:[
            {ico:'提',name:'한 문장 제안하기',href:'화두관리앱.html'},
            {ico:'例',name:'좋은 화두 예시',href:'화두관리앱.html'}
          ]
        }
      },
      plaza: {
        '아골라 阿閣羅': {
          tag:'아골라 · 어른의 토론',
          title:"'선택'이라는 말의 무게 — Libet 실험을 다시 읽다",
          deck:'의식과 행위 사이 0.3초의 간극이 우리에게 던지는 질문은 자유의지의 부정이 아니라, 다른 종류의 자유에 대한 초대가 아닐까.',
          meta:'임선생 · 2시간 전 · 좋은 물음 24',
          quick:[
            {ico:'議',name:'아골라 글쓰기',href:'아골라_미리보기.html'},
            {ico:'熱',name:'지금 깊어지는 글',href:'아골라_미리보기.html'},
            {ico:'深',name:'이번 주 인사이트',href:'광장의_진짜_목적.html'}
          ]
        },
        '아곤란 阿昆蘭': {
          tag:'아곤란 · 학생의 마당',
          title:'내가 좋아하는 것을 진짜 내가 좋아하는 걸까요?',
          deck:'서툰 질문이 가장 빛나는 자리. 점수가 매겨지지 않는 곳.',
          meta:'민서(중1) · 좋은 물음 36 · 댓글 9',
          quick:[
            {ico:'問',name:'아곤란 질문하기',href:'아곤란_미리보기.html'},
            {ico:'熱',name:'지금 빛나는 질문',href:'아곤란_미리보기.html'}
          ]
        },
        '이번 주 인사이트': {
          tag:'광장 · 이 주의 깊음',
          title:'광장은 정답을 주는 자리가 아닙니다',
          deck:'좋은 물음이 좋은 물음으로 인정받는 자리. 이번 주 가장 깊었던 글 Top 10을 한자리에.',
          meta:'깊이 평균 8.4 · 인용 평균 3.2',
          quick:[
            {ico:'深',name:'광장의 진짜 목적 전문',href:'광장의_진짜_목적.html'},
            {ico:'圖',name:'생각의 지도에서 보기',href:'광장_생각지도.html'}
          ]
        },
        '지금 깊어지는 글': {
          tag:'실시간 · 광장',
          title:'지금 7명이 함께 쓰고 있는 글',
          deck:'아골라·아곤란에서 댓글이 활발히 오가는 글들을 추렸습니다.',
          meta:'갱신 1분 전',
          quick:[
            {ico:'議',name:'아골라 활발한 글',href:'아골라_미리보기.html'},
            {ico:'問',name:'아곤란 활발한 질문',href:'아곤란_미리보기.html'}
          ]
        },
        '광장 규칙': {
          tag:'우리가 지키는 약속',
          title:'광장의 다섯 가지 규칙',
          deck:'답보다 물음 · 머무름의 깊이 · 비교 프레임 지양 · 서로 다름의 품격 · 살아있는 자료실.',
          meta:'광장 정신 · 연라이프',
          quick:[
            {ico:'規',name:'광장 규칙 전문',href:'광장의_진짜_목적.html'}
          ]
        }
      },
      thoughtmap: {
        '지도 들어가기': {
          tag:'생각의 지도 · 진입',
          title:'노드를 누르면 그 글이 바로 열립니다',
          deck:'광장의 모든 글이 한 별자리로 모이는 곳. 자유로이 끌어보세요.',
          meta:'노드 1,247 · 연결 4,381',
          quick:[
            {ico:'圖',name:'지도 들어가기',href:'광장_생각지도.html'}
          ]
        },
        '단계 2 — 깊이 보기': {
          tag:'생각의 지도 · 단계 2',
          title:'노드와 노드 사이의 흐름을 봅니다',
          deck:'어떤 물음이 다른 물음을 낳았는지, 그 사이의 길이 보입니다.',
          meta:'깊이 뷰',
          quick:[
            {ico:'深',name:'단계 2 열기',href:'광장_생각지도.html'}
          ]
        },
        '내가 만든 별자리': {
          tag:'마이페이지 · 닿음의 자취',
          title:'내가 쓴 글이 누구에게 닿았는지 한눈에',
          deck:'닿은 사람·좋은 물음·인용 + 한 달 추세 + 별자리 미니 뷰.',
          meta:'진우 · 487명 닿음 · 좋은 물음 14',
          quick:[
            {ico:'我',name:'마이페이지 열기',href:'마이페이지_효능감.html'}
          ]
        },
        '이번 주 가장 깊은 별': {
          tag:'이 주의 별',
          title:"'선택'이라는 말의 무게가 가장 큰 별로 떠올랐습니다",
          deck:'이번 주 광장에서 가장 깊게 인용된 노드. 23편의 글과 187개의 좋은 물음이 둘레에 모여 있습니다.',
          meta:'갱신 1시간 전',
          quick:[
            {ico:'圖',name:'그 별로 바로 가기',href:'광장_생각지도.html'},
            {ico:'深',name:'가장 깊은 노드 10',href:'광장_생각지도.html'}
          ]
        },
        '지도 사용법': {
          tag:'처음 오는 분께',
          title:'생각의 지도, 1분 안내',
          deck:'줌·끌기·노드 누르기·별자리 만들기 — 네 가지만 알면 끝.',
          meta:'안내 영상 · 30초',
          quick:[
            {ico:'學',name:'사용법 보기',href:'#'}
          ]
        }
      },
      columns: {
        '연소사': {
          tag:'蓮 연소사 · 교육 · 사유',
          title:'학생이 묻기를 멈출 때 어른은 무엇을 잃는가',
          deck:'교실에서 사라진 질문은 어른 사회에서 어떻게 다시 나타나는지에 관한 한 주의 기록. 연라이프 편집인.',
          meta:'蓮 · 칼럼 · 깊이 평균 8.6',
          quick:[
            {ico:'蓮',name:'연소사 블로그',href:'블로그_AI작가기자_인덱스.html'},
            {ico:'冊',name:'연소사 칼럼집',href:'블로그_AI작가기자_인덱스.html'}
          ]
        },
        '임선생': {
          tag:'林 임선생 · 철학 · 동서양',
          title:"동양의 '無爲'와 서양의 자유의지",
          deck:'행하지 않음으로 행한다는 말이 신경과학과 만나는 자리. 동서양을 가로지르는 사유.',
          meta:'林 · 칼럼 · 깊이 평균 8.4',
          quick:[
            {ico:'林',name:'임선생 블로그',href:'블로그_AI작가기자_인덱스.html'},
            {ico:'冊',name:'임선생 칼럼집',href:'블로그_AI작가기자_인덱스.html'}
          ]
        },
        '박주민': {
          tag:'朴 박주민 · 사회 · 지역',
          title:'울산의 봄은 어떤 사람들의 봄인가',
          deck:'태화강 둑길에서 만난 다섯 사람의 봄 이야기. 동네 안에서 시작하는 사회 비평.',
          meta:'朴 · 칼럼 · 깊이 평균 8.1',
          quick:[
            {ico:'朴',name:'박주민 블로그',href:'블로그_AI작가기자_인덱스.html'},
            {ico:'冊',name:'박주민 칼럼집',href:'블로그_AI작가기자_인덱스.html'}
          ]
        },
        '현지영': {
          tag:'玄 현지영 · 청년 · 미래',
          title:"스무 살이 본 '결정의 무게'",
          deck:'선택지가 너무 많은 시대의 청년이 길어진 화두. 다음 세대의 목소리.',
          meta:'玄 · 칼럼 · 깊이 평균 7.9',
          quick:[
            {ico:'玄',name:'현지영 블로그',href:'블로그_AI작가기자_인덱스.html'},
            {ico:'冊',name:'현지영 칼럼집',href:'블로그_AI작가기자_인덱스.html'}
          ]
        }
      },
      where: {
        '우리 동네 맛집': {
          tag:'주민 추천 · 이번 주 맛집',
          title:'할매 손칼국수 — 50년 된 골목 안의 따뜻함',
          deck:'반죽 두께가 손마다 다른 칼국수. 멸치 육수가 깊고 김치가 한 그릇이다.',
          meta:'울산 중구 · 우정동 · 임선생 추천',
          quick:[
            {ico:'食',name:'이번 주 맛집 5선',href:'맛집.html'},
            {ico:'地',name:'지도에서 보기',href:'#'}
          ]
        },
        '우리 동네 멋집': {
          tag:'주민 추천 · 멋집',
          title:'책방 〈은빛고래〉 — 골목 끝의 작은 우주',
          deck:'책 한 권을 사면 사장님과 한 시간 동안 이야기할 수 있는 책방.',
          meta:'울산 남구 · 신정동 · 박주민 추천',
          quick:[
            {ico:'美',name:'이번 주 멋집 5선',href:'#'},
            {ico:'地',name:'지도에서 보기',href:'#'}
          ]
        },
        '둘레길 · 산책': {
          tag:'걷기 좋은 길',
          title:'태화강 둑길 — 봄 벚꽃과 다섯 사람의 봄',
          deck:'왕복 8km. 주민들 직접 다녀온 사진과 노트가 모입니다.',
          meta:'울산 중구 · 태화강',
          quick:[
            {ico:'行',name:'추천 둘레길 모음',href:'#'}
          ]
        },
        '지도로 보기': {
          tag:'한눈에',
          title:'맛집 · 멋집 · 둘레길을 한 지도 위에',
          deck:'동별로 필터링해서 봅니다.',
          meta:'준비 중',
          quick:[
            {ico:'地',name:'지도 열기',href:'#'}
          ]
        }
      },
      journal: {
        '검증 완료 기사': {
          tag:'검증 완료 · 이번 주',
          title:'울산 태화강 봄철 수질 현황 — 주민 직접 측정 리포트',
          deck:'시민과학자 12명이 매주 다섯 지점에서 측정한 수치를 모아 공개합니다.',
          meta:'6/6 단계 · 연마을 주민 · 5월 13일',
          quick:[
            {ico:'證',name:'전체 검증 완료 글',href:'신뢰도_평가_정책.html'}
          ]
        },
        '검증 진행 중': {
          tag:'함께 확인하는 글',
          title:'지금 검증 단계에 있는 5편',
          deck:'주민이 직접 다음 단계로 올려주는 글들. 누구나 한 단계를 도울 수 있습니다.',
          meta:'진행 중 5편 · 평균 단계 3/6',
          quick:[
            {ico:'共',name:'검증 도와주기',href:'#'}
          ]
        },
        '기사 쓰기': {
          tag:'내가 본 것을 기록',
          title:'한 줄, 한 사진, 한 인터뷰 — 그게 기사의 시작',
          deck:'동네 안에서 출발하는 시민 저널리즘 — 6단계 검증을 거쳐 광장으로 올라갑니다.',
          meta:'6단계 검증 가이드',
          quick:[
            {ico:'筆',name:'기사 쓰기 시작',href:'#'}
          ]
        },
        '6단계 검증이란?': {
          tag:'시민 저널리즘 안내',
          title:'8축 신뢰도 평가 · 6단계 검증',
          deck:'출처 다양성·1차 출처·검증·시간·이해 충돌·팩트체커·언론자유·아카이브 — 8축으로 모든 글을 공개 평가합니다.',
          meta:'신뢰도 정책 · 공개 투명성',
          quick:[
            {ico:'學',name:'정책 전문 보기',href:'신뢰도_평가_정책.html'}
          ]
        }
      },
      blog: {
        '내 블로그': {
          tag:'내 마당 · 닿음의 자취',
          title:'내가 쓴 글이 누구에게 닿았는지',
          deck:'닿은 사람 · 좋은 물음 · 인용 횟수 + 한 달 추세 + 별자리 미니 뷰.',
          meta:'진우 · 487명 닿음',
          quick:[
            {ico:'我',name:'마이페이지 열기',href:'마이페이지_효능감.html'}
          ]
        },
        '블로그 시작하기': {
          tag:'코딩 없이',
          title:'템플릿 10종에서 마음에 드는 결을 고르세요',
          deck:'표지와 한 줄 소개만 적으면, 1분 후 이미 작동하는 나의 마당이 생깁니다.',
          meta:'정직 · 여백 · 노트 · 카드 · 장서 · 편지 · 잡지 · 풍경 · 묵화 · 풀잎',
          quick:[
            {ico:'始',name:'템플릿 갤러리',href:'블로그_AI작가기자_인덱스.html'}
          ]
        }
      }
    };

    function fillSubPane(target, name){
      const data = (SUB_PANEL[target]||{})[name];
      const pane = document.querySelector(`.mega-col-3-pane[data-pane="${target}"]`);
      if (!data || !pane) return;
      pane.innerHTML = `
        <div class="featured-block">
          <div class="featured-tag">${esc(data.tag)}</div>
          <div class="featured-title">${esc(data.title)}</div>
          <div class="featured-deck">${esc(data.deck)}</div>
          <div class="featured-meta">${esc(data.meta||'')}</div>
        </div>
        ${(data.quick && data.quick.length) ? `
        <div class="quick-links" style="margin-top:18px">
          ${data.quick.map(q => `
            <a class="quick-link" href="${esc(q.href)}">
              <span class="ql-ico">${esc(q.ico)}</span>
              <span class="ql-name">${esc(q.name)}</span>
            </a>`).join('')}
        </div>` : ''}
      `;
    }

    // 모든 일반 sub-item에 호버 핸들러 부착 (data-bridge·data-subcat 제외)
    function wireSubPaneHover(){
      document.querySelectorAll('.sub-item').forEach(item => {
        if (item.hasAttribute('data-bridge') || item.hasAttribute('data-subcat')) return;
        if (item.dataset.subPaneWired) return;
        item.dataset.subPaneWired = '1';
        const pane2 = item.closest('.mega-col-2-pane');
        const target = pane2?.dataset.pane;
        const name = item.querySelector('.sub-name')?.textContent?.trim();
        if (!target || !name) return;
        item.addEventListener('mouseenter', () => fillSubPane(target, name));
      });
    }

    // 첫 진입 시 각 카테고리 3열을 그 카테고리의 첫 sub로 자동 채움
    function preFillAllPanes(){
      Object.keys(SUB_PANEL).forEach(target => {
        const firstName = Object.keys(SUB_PANEL[target])[0];
        if (firstName) fillSubPane(target, firstName);
      });
    }

    /* bridge는 외부 데이터 의존이 없으므로 즉시 1회 채움 — 의존성 대기와 무관 */
    fillBridge('builder');
    wireSubcatHover();
    wireSubPaneHover();
    preFillAllPanes();
  })();

  /* ============================================================
     생각의 지도 — 배경 캔버스 시각화
     · 노드(생각)들이 천천히 떠다니고, 가까워지면 선으로 이어짐
     · 빈 공간 클릭 → 광장_생각지도.html 로 진입
     ============================================================ */
  (function thinkmapBg(){
    const canvas = document.getElementById('thinkmap-canvas');
    const bg = document.getElementById('thinkmap-bg');
    const hint = document.getElementById('thinkmapHint');
    if(!canvas || !bg) return;
    const ctx = canvas.getContext('2d');
    let W=0, H=0;
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    // 연라이프 세계관 키워드 (배경에 은은히 떠다님)
    const LABELS = [
      '선택','자유의지','습관','기록','질문','몸','의식',
      '나','타자','시간','광장','아골라','아곤란','話頭',
      '울산','연마을','말','침묵','이름','경계','믿음',
      '틈','관계','함께','글','읽기','쓰기','깊이','物','心'
    ];

    // 연라이프 공식 색 — 광장 카테고리 5색을 그대로 사용
    // (화두 청록 · 아골라 살구 · 아곤란 붉음 · 칼럼 보라 · 연마을 녹)
    const PALETTE = [
      { rgb:'58,160,168', name:'화두' },    // #3aa0a8
      { rgb:'196,146,62', name:'아골라' },  // #c4923e
      { rgb:'192, 80, 64', name:'아곤란' }, // #c05040
      { rgb:'104, 88,192', name:'칼럼' },   // #6858c0
      { rgb:'74,144, 96', name:'연마을' },  // #4a9060
    ];

    const nodes = [];
    function rng(a,b){ return a + Math.random()*(b-a); }
    function build(){
      nodes.length = 0;
      // 밀도는 유지, 톤은 매우 옅게 (20% 수준) — 본문 글이 우선
      const count = Math.max(24, Math.min(44, Math.floor((W*H)/44000)));
      for(let i=0;i<count;i++){
        const c = PALETTE[Math.floor(Math.random()*PALETTE.length)];
        nodes.push({
          x: rng(0,W), y: rng(0,H),
          vx: rng(-.22,.22), vy: rng(-.16,.16),
          r: rng(2.8, 5.4),
          label: LABELS[Math.floor(Math.random()*LABELS.length)],
          color: c.rgb,           // 연라이프 5색 중 하나
          alpha: rng(.20, .30),
          phase: Math.random()*Math.PI*2,
          showLabel: Math.random() < .55
        });
      }
    }
    function resize(){
      const r = bg.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W*DPR; canvas.height = H*DPR;
      canvas.style.width = W+'px'; canvas.style.height = H+'px';
      ctx.setTransform(DPR,0,0,DPR,0,0);
      build();
    }
    window.addEventListener('resize', resize);

    // 마우스 위치 (가까운 노드 살짝 강조용)
    let mx=-9999, my=-9999;
    window.addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; });

    const CONNECT = 230;
    function frame(t){
      ctx.clearRect(0,0,W,H);

      // 이동
      for(const n of nodes){
        n.x += n.vx; n.y += n.vy; n.phase += 0.018;
        if(n.x < -40) n.x = W+40; else if(n.x > W+40) n.x = -40;
        if(n.y < -40) n.y = H+40; else if(n.y > H+40) n.y = -40;
      }

      // 연결선 — 옅게 (본문 글 우선) · 두 노드 색의 중간색으로 그라데이션 느낌
      ctx.lineWidth = 1;
      for(let i=0;i<nodes.length;i++){
        for(let j=i+1;j<nodes.length;j++){
          const a=nodes[i], b=nodes[j];
          const dx=a.x-b.x, dy=a.y-b.y;
          const d = Math.sqrt(dx*dx+dy*dy);
          if(d < CONNECT){
            const op = (1 - d/CONNECT) * 0.15;
            // 두 노드 색의 평균을 선 색으로
            const ar=a.color.split(','), br=b.color.split(',');
            const r=Math.round((parseInt(ar[0])+parseInt(br[0]))/2);
            const g=Math.round((parseInt(ar[1])+parseInt(br[1]))/2);
            const bl=Math.round((parseInt(ar[2])+parseInt(br[2]))/2);
            ctx.strokeStyle = `rgba(${r},${g},${bl},${op})`;
            ctx.beginPath();
            ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
            ctx.stroke();
          }
        }
      }

      // 노드 + 라벨
      ctx.textBaseline = 'middle';
      for(const n of nodes){
        const breath = (Math.sin(n.phase)+1)/2;
        const dx=mx-n.x, dy=my-n.y;
        const dist2 = dx*dx+dy*dy;
        // 마우스가 노드 바로 위(반지름+24px 내)일 때만 호버
        const hoverR = n.r + 24;
        const isHover = dist2 < hoverR*hoverR;
        // 근접권 (가까이 다가갈 때 옅게 깨어남) — 80px 내
        const isNear = dist2 < 80*80;

        // 기본 30% 톤 / 근접 시 살짝 / 호버 시 100%
        let mult = 1;
        if(isHover) mult = 2.0;
        else if(isNear) mult = 1.4;
        const aBase = Math.min(1.0, n.alpha * (0.78 + breath*0.22) * mult);

        // 글로우 — 노드의 본 색으로 (호버 시 확장)
        const glowR = isHover ? n.r*7.5 : n.r*4.8;
        const glowAlpha = isHover ? 0.55 : Math.min(0.22, aBase*0.22);
        ctx.fillStyle = `rgba(${n.color},${glowAlpha})`;
        ctx.beginPath(); ctx.arc(n.x,n.y,glowR,0,Math.PI*2); ctx.fill();

        // 점 — 노드의 본 색 (호버 시 더 진하고 큼)
        const dotR = isHover ? n.r*1.35 : n.r;
        ctx.fillStyle = `rgba(${n.color},${aBase})`;
        ctx.beginPath(); ctx.arc(n.x,n.y,dotR,0,Math.PI*2); ctx.fill();
        // 코어 하이라이트 (종이톤)
        ctx.fillStyle = `rgba(255,253,248,${Math.min(0.8, aBase*0.65)})`;
        ctx.beginPath(); ctx.arc(n.x-dotR*0.25,n.y-dotR*0.25,dotR*0.35,0,Math.PI*2); ctx.fill();

        // 라벨 — 호버 시 노드 본 색으로 또렷이, 평소엔 잉크 톤으로 옅게
        if(n.showLabel && n.r > 2.6){
          const labelAlpha = isHover ? 1.0 : (isNear ? 0.7 : aBase * 0.7);
          ctx.font = (isHover ? 'bold 15px' : '13.5px') + ' "Noto Serif KR",serif';
          if(isHover){
            ctx.fillStyle = `rgba(${n.color},${labelAlpha})`;
          } else {
            ctx.fillStyle = `rgba(31,42,42,${Math.min(0.85, labelAlpha)})`;
          }
          ctx.fillText(n.label, n.x + dotR + 10, n.y);
        }
      }

      requestAnimationFrame(frame);
    }

    resize();
    requestAnimationFrame(frame);

    // 빈 공간 클릭 → 생각의 지도 페이지로 (본문 요소 위 클릭은 절대 라우팅하지 않음)
    bg.addEventListener('click', (e)=>{
      const t = e.target;
      if (t.closest('input, textarea, button, a, label, select, header, footer, main, section, article, aside, .masthead, .topbar, .container, .plaza-mic, .plaza, .hero, .editorial, .world-now, .ecosystem-band, .support-band, .plaza-purpose, .pc-item, .mega-menu, .mega-overlay, .tm-modal, .tm-overlay, .reveal')) return;
      if (t === bg || t.id === 'thinkmap-canvas' || t.dataset.thinkmapBg !== undefined){
        window.location.href = '광장_생각지도.html';
      }
    });

    // 첫 진입 시 안내 토스트 보였다 사라짐
    let hinted = false;
    function showHint(){
      if(hinted || !hint) return;
      hinted = true;
      hint.classList.add('show');
      setTimeout(()=> hint.classList.remove('show'), 5200);
    }
    // 처음 마우스가 빈 공간에 들어오면 한 번 보여줌
    bg.addEventListener('mouseenter', showHint, {once:true});
    // 1.6초 후에 자동으로 한 번
    setTimeout(showHint, 1600);
  })();

  /* ============================================================
     글 제목 / 카드 클릭 → 단계2_광장글_상세페이지.html 로 라우팅
     ============================================================ */
  (function postRouting(){
    function goDetail(title, opts){
      const params = new URLSearchParams();
      if (opts && opts.id) params.set('id', opts.id);
      if (title) params.set('title', title);
      if (opts && opts.forum) params.set('forum', opts.forum);
      if (opts && opts.by) params.set('by', opts.by);
      window.location.href = '단계2_광장글_상세페이지.html?' + params.toString();
    }

    // 히어로 화두 — 큰 인용문 자체
    const heroQuote = document.querySelector('.hero-quote');
    if (heroQuote){
      heroQuote.addEventListener('click', () => {
        goDetail('사람은 자신이 의식적으로 선택한다고 믿지만, 그 이전에 이미 몸이 먼저 움직이기 시작한다. 그렇다면 \'나\'는 누구인가?', {id:'h-19', forum:'화두', by:'연소사'});
      });
    }

    // 히어로 액션 버튼들 (아골라/아곤란 진입)
    document.querySelectorAll('.hero-actions .btn-lead').forEach(btn => {
      btn.addEventListener('click', () => goDetail('아골라 전체 보기', {forum:'아골라'}));
    });
    document.querySelectorAll('.hero-actions .btn-lead-warm').forEach(btn => {
      btn.addEventListener('click', () => goDetail('아곤란 전체 보기', {forum:'아곤란'}));
    });

    // 에디토리얼
    const edTitle = document.querySelector('.editorial h2');
    if (edTitle){
      edTitle.addEventListener('click', () => {
        goDetail(edTitle.textContent.trim(), {id:'editorial-202605', forum:'에디토리얼', by:'연소사'});
      });
    }

    // 광장 — 아골라/아곤란 카드들
    document.querySelectorAll('.plaza-grid .pc-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // 댓글/투표 같은 작은 클릭 영역도 제목으로 보내기 — 카드 전체가 진입
        const t = item.querySelector('.pc-title-text');
        const who = item.querySelector('.who');
        const cat = item.closest('div').querySelector('.pc-title')?.textContent || '';
        goDetail(t ? t.textContent.trim() : '', {
          forum: cat.includes('아곤란') ? '아곤란' : (cat.includes('아골라') ? '아골라' : ''),
          by: who ? who.textContent.replace(/^[^가-힣]/,'').trim() : ''
        });
      });
    });

    // 이 주의 인사이트
    document.querySelectorAll('.insight-list .ins-item').forEach(item => {
      item.addEventListener('click', () => {
        const t = item.querySelector('.ins-title');
        const meta = item.querySelector('.ins-byline');
        goDetail(t ? t.textContent.trim() : '', {
          forum: meta && /아곤란/.test(meta.textContent) ? '아곤란' : (meta && /아골라/.test(meta.textContent) ? '아골라' : '')
        });
      });
    });

    // 칼럼 카드
    document.querySelectorAll('.col-grid .col-card').forEach(card => {
      card.addEventListener('click', () => {
        const t = card.querySelector('.col-headline');
        const name = card.querySelector('.col-name');
        goDetail(t ? t.textContent.trim() : '', {forum:'칼럼', by: name ? name.textContent.trim() : ''});
      });
    });

    // 광장 카드 헤더의 "전체 보기 →" 링크
    // 광장 카드에 아고라 잔향 앵커 자동 삽입
    document.querySelectorAll('.plaza .pc-item').forEach(card => {
      if (!card.querySelector('.ripple-anchor')) {
        const r = document.createElement('span');
        r.className = 'ripple-anchor';
        card.appendChild(r);
      }
    });

    // 내 차례 마이크 — 입력 후 아골라/아곤란으로 한 마디 보내기
    function sendToForum(forum){
      const inp = document.getElementById('plazaMicInput');
      const val = (inp.value || '').trim();
      if (!val) {
        inp.focus();
        if (window.YL_TOAST) window.YL_TOAST('한 마디를 적어주세요 — 한 문장이면 충분합니다');
        return;
      }
      // 입력 내용 안전 보관 — 어떤 다음 단계에도 사라지지 않음
      try { localStorage.setItem('yl-plaza-draft', JSON.stringify({ text: val, forum: forum, at: Date.now() })); } catch(e){}
      // 로그인 상태 확인
      let cur = null;
      try { cur = JSON.parse(localStorage.getItem('yl-current') || 'null'); } catch(e){}
      if (!cur) {
        if (window.YL_TOAST) window.YL_TOAST('적어주신 글은 안전하게 저장됐어요 — 가입하시면 그대로 이어집니다');
        // 통합 로그인 모달을 엶 (안에서 "처음 오시나요?" 카드로 가입 진입)
        document.getElementById('btnLogin')?.click();
        return;
      }
      // 시안 — 입력 내용을 querystring으로 미리보기 페이지로
      const target = forum === 'agora' ? '아골라_미리보기.html' : '아곤란_미리보기.html';
      const params = new URLSearchParams({ draft: val, by: cur.nick || cur.id });
      location.href = target + '?' + params.toString();
    }
    // 페이지 로드 시 저장된 초고가 있으면 마이크에 복원
    (function restoreDraft(){
      try {
        const raw = localStorage.getItem('yl-plaza-draft');
        if (!raw) return;
        const d = JSON.parse(raw);
        if (d && d.text) {
          const inp = document.getElementById('plazaMicInput');
          if (inp && !inp.value) inp.value = d.text;
        }
      } catch(e){}
    })();
    // 입력할 때마다 자동 저장 (debounce 500ms)
    (function autosaveDraft(){
      const inp = document.getElementById('plazaMicInput');
      if (!inp) return;
      let t;
      inp.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          try { localStorage.setItem('yl-plaza-draft', JSON.stringify({ text: inp.value, at: Date.now() })); } catch(e){}
        }, 500);
      });
    })();
    document.getElementById('plazaMicAgora')?.addEventListener('click', () => sendToForum('agora'));
    document.getElementById('plazaMicAgonran')?.addEventListener('click', () => sendToForum('agonran'));

    // 주제 칩 — 클릭 시 입력창에 시작 문구 자동 채움 (사용자 자유 그대로 두고 도움만)
    document.querySelectorAll('.plaza-mic .pm-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.plaza-mic .pm-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const prompt = chip.dataset.prompt || '';
        const inp = document.getElementById('plazaMicInput');
        // 사용자가 이미 적은 게 있다면 덮어쓰지 않고, 빈 칸일 때만 시작 문구 삽입
        const cur = inp.value.trim();
        if (!cur || cur === inp.dataset.lastPrompt) {
          inp.value = prompt;
          inp.dataset.lastPrompt = prompt;
          inp.focus();
          // 커서를 맨 뒤로
          inp.setSelectionRange(prompt.length, prompt.length);
        } else {
          // 입력 내용이 있을 땐 토스트만
          if (window.YL_TOAST) window.YL_TOAST('적고 있는 내용이 있어서 시작 문구를 안 바꿨습니다');
        }
      });
    });

    document.querySelectorAll('.pc-head .pc-link').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const block = a.closest('div');
        const titleEl = block?.querySelector('.pc-title');
        const cat = titleEl ? titleEl.textContent : '';
        const forum = cat.includes('아곤란') ? '아곤란' : (cat.includes('아골라') ? '아골라' : '인사이트');
        goDetail(forum + ' 전체 보기', {forum});
      });
    });

    // 로컬 스토리지에 저장된 사용자 글 불러와서 홈피에 동적 표시
    (function loadCustomPosts(){
      try {
        // 1. 아곤란 (학생 질문)
        const customQuestions = JSON.parse(localStorage.getItem('yl-custom-questions') || '[]');
        const agonranList = document.querySelector('.plaza-col-agonran .pc-list');
        if (agonranList && customQuestions.length > 0) {
          [...customQuestions].reverse().forEach(q => {
            const item = document.createElement('div');
            item.className = 'pc-item custom-post';
            const initChar = q.by ? q.by.trim().charAt(0) : '학';
            item.innerHTML = `
              <div class="pc-meta">
                <span class="pc-now">지금</span>
                <span class="who"><span class="dot">${initChar}</span>${q.by || '익명'}</span>
                <span>·</span>
                <span>${q.grade || '학생'}</span>
              </div>
              <h3 class="pc-title-text">${q.text}</h3>
              <p class="pc-snip">방금 등록된 서툰 질문입니다. 함께 사색하고 나누어 보아요.</p>
              <div class="pc-vote"><span class="depth">좋은 물음 ${q.votes || 0}</span><span class="cmt">댓글 ${q.comments || 0}</span></div>
              <span class="ripple-anchor"></span>
            `;
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
              window.location.href = '아곤란_미리보기.html';
            });
            agonranList.insertBefore(item, agonranList.firstChild);
          });
        }

        // 2. 아골라 (어른 토론)
        const customOpinions = JSON.parse(localStorage.getItem('yl-custom-opinions') || '[]');
        const agoraList = document.querySelector('.plaza-col-agora .pc-list');
        if (agoraList && customOpinions.length > 0) {
          [...customOpinions].reverse().forEach(op => {
            const item = document.createElement('div');
            item.className = 'pc-item custom-post';
            const initChar = op.by ? op.by.trim().charAt(0) : '사';
            const textSnippet = op.text.length > 80 ? op.text.slice(0, 80) + '...' : op.text;
            const titleText = op.text.length > 30 ? op.text.slice(0, 30) + '...' : op.text;
            item.innerHTML = `
              <div class="pc-meta">
                <span class="pc-now">지금</span>
                <span class="who"><span class="dot">${initChar}</span>${op.by || '익명'}</span>
                <span>·</span>
                <span>${op.role || '사색가'}</span>
              </div>
              <h3 class="pc-title-text">${titleText}</h3>
              <p class="pc-snip">${textSnippet}</p>
              <div class="pc-vote"><span class="depth">좋은 물음 ${op.votes || 0}</span><span class="cmt">댓글 ${op.comments || 0}</span></div>
              <span class="ripple-anchor"></span>
            `;
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
              window.location.href = '아골라_미리보기.html';
            });
            agoraList.insertBefore(item, agoraList.firstChild);
          });
        }
      } catch(e) {
        console.error('Failed to load custom posts:', e);
      }
    })();
  })();


