/* ──────────────────────────────────────────────
   연플래닝 · 곳간 데이터 + 공유 동작
   새 글이 늘면 POSTS 배열 맨 위에 한 줄 추가
   ────────────────────────────────────────────── */

const POSTS = [
  { no: 12, cat: '학습법',     title: '5.2.5.5 복습법이 통하는 진짜 이유',                            excerpt: '5분, 2분, 5시간, 5일. 이 네 박자가 단순한 시간표가 아니라 뇌의 망각곡선과 정확히 맞물리는 이유.',         date: '2026.05.08', views: 312, isNew: true,  href: '#post-12' },
  { no: 11, cat: '도구·자료',  title: '연플래너로 하루 1분, 5.2.5.5를 자동화하는 법',                  excerpt: '체크리스트 하나로 복습 주기가 알아서 굴러갑니다. 학생이 직접 켜본 화면 위주로 정리.',                date: '2026.05.02', views: 268, isNew: true,  href: '#post-11' },
  { no: 10, cat: '시간관리',   title: '하루를 셋으로 — 배려·배움·놀기 시간배분 실전',                 excerpt: '학원에 7시간 매여있는 중학생이 어떻게 세 시간을 떼어 쓸 수 있는지, 실제 학생 사례 두 개.',          date: '2026.04.24', views: 421, isNew: false, href: '#post-10' },
  { no: 9,  cat: '멘탈·동기',  title: '시험 일주일 전, 마음이 무너질 때 가장 먼저 해야 할 것',         excerpt: '계획표를 다시 짜는 게 아니라 호흡 한 번. 의식적 몰입은 마음이 가라앉은 자리에서 시작됩니다.',         date: '2026.04.18', views: 567, isNew: false, href: '#post-9' },
  { no: 8,  cat: '학습법',     title: '의식적 몰입은 결과가 아니라 과정입니다',                        excerpt: '진짜 몰입은 집중에서 흩어짐, 다시 돌아옴이 반복되는 그 과정 전체에 있습니다.',                       date: '2026.04.10', views: 891, isNew: false, href: '#post-8' },
  { no: 7,  cat: '과목별',     title: '수학 — 답을 맞히고도 오답인 풀이는 왜 위험한가',                excerpt: '수풀AI가 풀이 1·2·3을 보여주는 이유. 같은 답이라도 어떤 개념으로 도달했는지가 다음 문제를 결정합니다.', date: '2026.04.03', views: 612, isNew: false, href: '#post-7' },
  { no: 6,  cat: '시험·입시',  title: '내신 한 달 전, 학생이 가장 많이 흔들리는 세 가지',              excerpt: '점수에 대한 두려움, 친구와의 비교, 부모의 기대. 셋 중 어느 것 하나도 단순하지 않습니다.',           date: '2026.03.28', views: 743, isNew: false, href: '#post-6' },
  { no: 5,  cat: '도구·자료',  title: '스무고개 상담카드 — 신입 학생의 첫 한 시간을 다르게 시작하는 법', excerpt: '20개 질문이 뭘 가능하게 하는지, 실제 상담 기록 두 편을 바탕으로.',                                date: '2026.03.20', views: 489, isNew: false, href: '#post-5' },
  { no: 4,  cat: '멘탈·동기',  title: '100일 습관에서 가장 위험한 시기는',                              excerpt: '15일에서 21일 사이. 이 일주일이 뇌가 \'이게 정말 나의 새 일상인가\'를 판단하는 분기점입니다.',         date: '2026.03.12', views: 1024, isNew: false, href: '#post-4' },
  { no: 3,  cat: '학습법',     title: '복습은 같은 책을 두 번 읽는 게 아닙니다',                       excerpt: '복습의 본질은 \'다른 각도에서 다시 만나기\'. 같은 자세, 같은 형광펜으로 두 번 읽는 건 복습이 아닙니다.', date: '2026.03.05', views: 658, isNew: false, href: '#post-3' },
  { no: 2,  cat: '시간관리',   title: '아침 10분, 손글씨 한 페이지가 하루를 잡는 이유',                excerpt: '의식적 몰입의 출발점은 \'몸을 먼저 앉히는 의식\'에 있습니다. 명상·손글씨·짧은 일기가 같은 자리.',     date: '2026.02.27', views: 532, isNew: false, href: '#post-2' },
  { no: 1,  cat: '도구·자료',  title: '학습 도구는 결국 \'기록\'으로 결정됩니다',                       excerpt: '아무리 좋은 앱도 기록이 끊기면 무용지물. 어떤 기록이 살아남는지에 대한 12년치 관찰.',                date: '2026.02.20', views: 814, isNew: false, href: '#post-1' }
];

const CATEGORIES = [
  { name: '학습법',    en: 'METHODS',    desc: '5.2.5.5, 의식적 몰입, 100일 습관 — 공부의 뼈대가 되는 방법들.' },
  { name: '도구·자료', en: 'TOOLS',      desc: '연플래너·수풀AI·스무고개 같은 디지털 도구와 종이 양식.' },
  { name: '시간관리',  en: 'TIME',       desc: '하루를 셋으로 — 배려·배움·놀기. 그 균형을 잡는 실전.' },
  { name: '멘탈·동기', en: 'MIND',       desc: '시험 전 무너지는 마음, 100일 고비, 부모와의 대화.' },
  { name: '과목별',    en: 'BY SUBJECT', desc: '수학, 영어, 국어 — 과목마다 다른 결의 공부법.' },
  { name: '시험·입시', en: 'EXAMS',      desc: '내신·수능·진학. 한 시기를 한 편의 글로.' }
];

let currentCategory = '전체';
let currentSearch = '';
let viewMode = 'topic';
let activeShare = null;

const SHARE_MINI_ICONS = `
  <span class="share-label">SHARE</span>
  <button class="share-mini" data-mini="kakao"    type="button" aria-label="카카오톡 공유"><svg viewBox="0 0 24 24"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.84 5.34 4.6 6.74-.2.69-.71 2.5-.81 2.89-.13.48.18.48.37.35.15-.1 2.39-1.62 3.36-2.27.83.12 1.69.19 2.48.19 5.52 0 10-3.58 10-8s-4.48-7.9-10-7.9z" fill="#FEE500"/></svg></button>
  <button class="share-mini" data-mini="facebook" type="button" aria-label="페이스북 공유"><svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.5 9.9V14.9H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7A10 10 0 0022 12z" fill="#1877F2"/></svg></button>
  <button class="share-mini" data-mini="x"        type="button" aria-label="X 공유"><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z" fill="#000"/></svg></button>
  <button class="share-mini" data-mini="band"     type="button" aria-label="네이버 밴드 공유"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#21C531"/><text x="12" y="16" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="9" fill="#fff">B</text></svg></button>
  <button class="share-mini" data-mini="more"     type="button" aria-label="더보기"><svg viewBox="0 0 24 24" fill="none" stroke="#3C3C38" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></button>
`;

const SHARE_BTN_HTML = `
  <button class="share-btn" type="button" aria-label="공유하기">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  </button>
`;

function getFiltered() {
  return POSTS.filter(p => {
    const catOk = (currentCategory === '전체') || (p.cat === currentCategory);
    const q = currentSearch.trim().toLowerCase();
    const searchOk = !q || (p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
    return catOk && searchOk;
  });
}

function postUrl(p) {
  const base = location.origin + location.pathname.replace(/index\.html$/, '');
  return base + (p.href || '');
}

function findPostByNo(no) { return POSTS.find(p => p.no === Number(no)); }

function renderTopicView() {
  const wrap = document.getElementById('topicView');
  const filtered = getFiltered();
  const showCats = (currentCategory === '전체')
    ? CATEGORIES
    : CATEGORIES.filter(c => c.name === currentCategory);

  if (filtered.length === 0) {
    wrap.innerHTML = `<div class="gokgan-empty"><div class="t">검색 결과가 없습니다</div><div class="d">다른 키워드나 분류로 다시 시도해보세요.</div></div>`;
    return;
  }

  let html = '';
  showCats.forEach(cat => {
    const posts = filtered.filter(p => p.cat === cat.name).sort((a,b) => b.no - a.no).slice(0, 6);
    html += `
      <div class="topic-block">
        <div class="topic-block-head">
          <div>
            <div class="topic-block-title">
              <span class="ko">${cat.name}</span>
              <span class="count">${cat.en} · ${posts.length}편</span>
            </div>
            <div class="topic-block-desc">${cat.desc}</div>
          </div>
          <button class="topic-block-more" data-jump="${cat.name}" type="button">전체 보기 →</button>
        </div>
        <div class="topic-block-list">
          ${posts.length === 0
            ? `<div class="gokgan-empty" style="grid-column:1/-1; padding:30px 16px;"><div class="d">아직 이 분류의 글이 없습니다. 곧 채워질 자리입니다.</div></div>`
            : posts.map(p => `
                <div class="topic-card" data-no="${p.no}">
                  ${p.isNew ? '<span class="new">NEW</span>' : ''}
                  <div class="num">No. ${String(p.no).padStart(2,'0')}</div>
                  <div class="t-title">${p.title}</div>
                  <p class="t-excerpt">${p.excerpt}</p>
                  <div class="t-meta">
                    <span>${p.date}</span>
                    <span>${p.views.toLocaleString()} 읽음</span>
                  </div>
                  <div class="share-row">${SHARE_MINI_ICONS}</div>
                </div>
              `).join('')
          }
        </div>
      </div>
    `;
  });
  wrap.innerHTML = html;
}

function renderBoard() {
  const tbody = document.getElementById('boardBody');
  const empty = document.getElementById('boardEmpty');
  const filtered = getFiltered();

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = filtered.map(p => `
    <tr data-no="${p.no}">
      <td class="no">${String(p.no).padStart(2,'0')}</td>
      <td class="cat"><span class="pill">${p.cat}</span></td>
      <td class="title-c" data-href="${p.href}">
        ${p.title}${p.isNew ? '<span class="new">NEW</span>' : ''}
        <span class="excerpt">${p.excerpt}</span>
      </td>
      <td class="date" data-href="${p.href}">${p.date}</td>
      <td class="views" data-href="${p.href}">${p.views.toLocaleString()}</td>
      <td class="share-c">${SHARE_BTN_HTML}</td>
    </tr>
  `).join('');
}

function setView(mode) {
  viewMode = mode;
  document.getElementById('viewBtnTopic').classList.toggle('active', mode === 'topic');
  document.getElementById('viewBtnBoard').classList.toggle('active', mode === 'board');
  document.getElementById('topicView').style.display       = (mode === 'topic') ? 'block' : 'none';
  document.getElementById('boardTable').style.display      = (mode === 'board') ? 'table' : 'none';
  document.getElementById('boardPagination').style.display = (mode === 'board') ? 'flex' : 'none';
  document.getElementById('boardEmpty').style.display = 'none';
}

function renderAll() {
  if (viewMode === 'topic') renderTopicView();
  else renderBoard();
}

function filterBoard() {
  currentSearch = document.getElementById('boardSearch').value;
  renderAll();
}

/* ───── 공유 기능 ───── */

function openSharePop(post, anchor) {
  activeShare = post;
  const pop = document.getElementById('sharePop');
  document.getElementById('sharePopTitle').textContent = post.title;
  pop.classList.add('open');
  const r = anchor.getBoundingClientRect();
  const popW = 290;
  let x = r.left + r.width/2 - popW/2;
  let y = r.bottom + 8;
  const vw = window.innerWidth;
  if (x + popW > vw - 12) x = vw - popW - 12;
  if (x < 12) x = 12;
  if (y + 280 > window.innerHeight) y = r.top - 280 - 8;
  pop.style.left = x + 'px';
  pop.style.top  = y + 'px';
}

function closeSharePop() {
  document.getElementById('sharePop').classList.remove('open');
  activeShare = null;
}

function showToast(msg) {
  const t = document.getElementById('shareToast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

function shareTo(sns, post) {
  const url = postUrl(post);
  const text = `[연플래닝 곳간] ${post.title}`;
  const enc = encodeURIComponent;
  switch(sns) {
    case 'facebook':
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, '_blank', 'width=600,height=500');
      break;
    case 'x':
      window.open(`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(text)}`, '_blank', 'width=600,height=500');
      break;
    case 'band':
      window.open(`https://band.us/plugin/share?body=${enc(text + '\n' + url)}&route=${enc(url)}`, '_blank', 'width=600,height=500');
      break;
    case 'story':
      window.open(`https://story.kakao.com/share?url=${enc(url)}`, '_blank', 'width=600,height=500');
      break;
    case 'kakao':
      copyToClipboard(text + '\n' + url, '카카오톡에 붙여넣을 내용이 복사되었습니다 ✓');
      break;
    case 'insta':
      copyToClipboard(url, 'URL 복사됨 — 인스타 스토리·DM에 붙여넣기 ✓');
      break;
    case 'copy':
      copyToClipboard(url, 'URL이 복사되었습니다 ✓');
      break;
    case 'native':
      if (navigator.share) {
        navigator.share({ title: post.title, text: text, url: url }).catch(()=>{});
      } else {
        showToast('이 기기는 직접 공유를 지원하지 않습니다');
      }
      break;
  }
  closeSharePop();
}

function copyToClipboard(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackPrompt(text));
  } else {
    fallbackPrompt(text);
  }
}

function fallbackPrompt(text) {
  window.prompt('아래 내용을 복사하세요', text);
}

/* ───── 이벤트 바인딩 ───── */

document.addEventListener('DOMContentLoaded', () => {
  setView('topic');
  renderAll();

  document.getElementById('viewBtnTopic').addEventListener('click', () => { setView('topic'); renderAll(); });
  document.getElementById('viewBtnBoard').addEventListener('click', () => { setView('board'); renderAll(); });

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.dataset.cat;
      renderAll();
    });
  });

  document.getElementById('boardSearch').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); filterBoard(); }
  });

  // 주제별 카드 위임
  document.getElementById('topicView').addEventListener('click', (e) => {
    const jump = e.target.closest('[data-jump]');
    if (jump) {
      const target = jump.dataset.jump;
      setView('board');
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.cat === target));
      currentCategory = target;
      renderAll();
      document.querySelector('.board-toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const mini = e.target.closest('.share-mini');
    if (mini) {
      e.stopPropagation();
      const card = mini.closest('.topic-card');
      const post = findPostByNo(card.dataset.no);
      const sns = mini.dataset.mini;
      if (sns === 'more') openSharePop(post, mini);
      else shareTo(sns, post);
      return;
    }
    const card = e.target.closest('.topic-card');
    if (card && !e.target.closest('.share-row')) {
      const post = findPostByNo(card.dataset.no);
      if (post) location.href = post.href;
    }
  });

  // 게시판 위임
  document.getElementById('boardBody').addEventListener('click', (e) => {
    const btn = e.target.closest('.share-btn');
    if (btn) {
      e.stopPropagation();
      const tr = btn.closest('tr');
      const post = findPostByNo(tr.dataset.no);
      openSharePop(post, btn);
      return;
    }
    const cell = e.target.closest('[data-href]');
    if (cell && cell.dataset.href) {
      location.href = cell.dataset.href;
    }
  });

  // 팝오버 버튼
  document.getElementById('sharePop').addEventListener('click', (e) => {
    const b = e.target.closest('.share-pop-btn');
    if (b && activeShare) shareTo(b.dataset.sns, activeShare);
  });

  // 외부 클릭 시 팝오버 닫기
  document.addEventListener('click', (e) => {
    if (!document.getElementById('sharePop').contains(e.target) &&
        !e.target.closest('.share-btn') &&
        !e.target.closest('.share-mini[data-mini="more"]')) {
      closeSharePop();
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSharePop(); });

  // 북마크 호환 (#tools → #gokgan)
  if (location.hash === '#tools') location.hash = '#gokgan';

  /* ───── 상단 회전 띠 (4초 간격) ───── */
  const promoItems = document.querySelectorAll('#promoStrip .promo-item');
  const promoDots  = document.querySelectorAll('#promoStrip .promo-dots span');
  if (promoItems.length > 0) {
    let pIdx = 0;
    function showPromo(i) {
      promoItems.forEach((el, k) => el.classList.toggle('active', k === i));
      promoDots.forEach((el, k) => el.classList.toggle('active', k === i));
      pIdx = i;
    }
    setInterval(() => { showPromo((pIdx + 1) % promoItems.length); }, 4000);
    promoDots.forEach((dot, k) => dot.addEventListener('click', () => showPromo(k)));
  }

  /* ───── 활동 타임라인 연도 필터 ───── */
  const yearTabs = document.querySelectorAll('.activity-tab');
  const actRows  = document.querySelectorAll('.activity-row');
  yearTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      yearTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const year = tab.dataset.year;
      actRows.forEach(row => {
        row.style.display = (year === 'all' || row.dataset.year === year) ? '' : 'none';
      });
    });
  });
});
