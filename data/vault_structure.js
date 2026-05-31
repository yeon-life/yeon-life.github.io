/*
 * 연라이프 광장 Vault 4단 분류 (YLV-4 §22 = YUV4 §21)
 * ───────────────────────────────────────────────────────────
 * 광장 생각의 지도의 각 노드는 다음 4단 폴더 트리에 분류된다.
 * AI(Gemma 4 26B)가 자동으로 키워드 5개 + main_folder + shortcut_folders 를 매김.
 *
 * 깊이 4단 규칙:
 *  ✅ 가능: 04_세계는지금/유럽/독일/베를린.md
 *  ❌ 금지: 5단 이상 — 태그(#키워드)로 대체
 *
 * 사용처:
 *  · 광장_생각지도.html — 노드별 카테고리 + 키워드 표시
 *  · 검수 백오피스 — 새 글의 자동 분류 후보
 *  · 개인 스크랩북 — 사용자 자료 자동 폴더 매핑
 */

window.YEON_VAULT_TREE = {
  /* ── 1단 → 2단 → 3단 (4단은 노드별 동적) ────────────── */
  '00_화두': {
    'desc': '연라이프 정체성. 이번 주 / 예비 / 아카이브',
    'children': {
      '이번주': '현재 진행 중인 화두',
      '예비': '제안된 화두 후보',
      '아카이브': '지난 화두들',
    },
  },
  '01_광장': {
    'desc': '아골라(어른 토론) + 아곤란(학생 질문)',
    'children': {
      '아골라': {
        '선택과_자유의지': '',
        '학(學)과_습(習)': '',
        '질문과_답': '',
        '울산과_지역': '',
      },
      '아곤란': {
        '학생질문': '학생이 던진 본질 질문',
        '학생작품': '학생 작가의 글',
      },
    },
  },
  '02_우리나라_이슈': {
    'desc': '한국 AI 기자 10명의 매일 해설',
    'children': {
      '사회': { '주거': '', '복지': '', '청년노동': '' },
      '정치': { '국회': '', '선거': '', '정당사': '' },
      '경제': { '금리': '', '환율': '', '부동산': '' },
      '문화': { '영화': '', '미술': '', '공연': '' },
      '과학': { 'AI': '', '의학': '', '환경': '' },
      '교육': { '입시': '', '논술': '', '학교': '' },
      '의료': { '수면': '', '청소년': '', '여성': '' },
      '울산': { '중구': '', '남구': '', '동구': '', '북구': '', '울주': '' },
    },
  },
  '03_세계는_지금': {
    'desc': '동적 Country of the Day + 분야별',
    'children': {
      '미국': {}, '일본': {}, '중국': {}, '영국': {}, '프랑스': {},
      '독일': {}, '베트남': {}, '인도네시아': {}, '인도': {}, '브라질': {},
      '오늘의시선': '매일 자동 선정되는 1~2개국 (동적)',
    },
  },
  '04_K-Wave': {
    'desc': '한국 콘텐츠 역방향 (영문판 출시 후)',
    'children': {
      'K-pop': {}, 'K-드라마': {}, 'K-푸드': {},
      'K-뷰티': {}, 'K-시·고전': {},
    },
  },
  '05_글로벌_마켓_시그널': {
    'desc': '증시 영향 큰 사건만 (임팩트 ≥ 9)',
    'children': {
      '금리·환율': '', '주요지수': '', '원자재': '', '캘린더': '',
    },
  },
  '06_작가_산문': {
    'desc': 'AI 작가 3명의 매일 산문',
    'children': {
      '류온': '성찰·일상', '백서원': '책·인문', '민하준': '사회 칼럼',
    },
  },
  '07_초대_필자': {
    'desc': '교수·선생·작가 (실인물)',
    'children': {
      '국문학_교수': '', '논술_선생': '', '작가_H': '', '작가_J': '',
    },
  },
  '08_사설_인사이트': {
    'desc': '편집인 연소사 + 이 주의 인사이트',
    'children': {
      '편집인의_글': '',
      '이주의_인사이트': '',
    },
  },
  '_보관': {
    'desc': '6개월 이상 된 발행물 아카이브',
    'children': {},
  },
};

/* 노드 → Vault 경로 자동 매핑 (Gemma 4 26B 호출 결과 형식과 동일) */
window.YEON_MAP_NODE_TO_VAULT = function(node){
  // 노드 카테고리 → 폴더 매핑
  const catMap = {
    '화두': '00_화두/이번주',
    '아골라': '01_광장/아골라',
    '아곤란': '01_광장/아곤란/학생질문',
    '칼럼': '06_작가_산문',
    '연마을': '01_광장/아골라/울산과_지역',
  };
  const base = catMap[node.cat] || '08_사설_인사이트/이주의_인사이트';
  return {
    keywords: extractKeywords(node),
    main_folder: base,
    shortcut_folders: suggestShortcuts(node, base),
    depth: base.split('/').length,
  };
};

function extractKeywords(node){
  // 간단 휴리스틱 — 실제는 Gemma 4 26B 호출
  const text = `${node.label} ${node.body || ''} ${node.subject || ''}`;
  const candidates = ['선택', '자유', '몸', '의식', '습관', '기록', '질문', '관계',
    '시간', '광장', '울산', '교육', '논술', '독립영화', '환경', '기후',
    '금리', '주거', '청년', '시민과학', '독서', '시'];
  return candidates.filter(k => text.includes(k)).slice(0, 5);
}

function suggestShortcuts(node, mainFolder){
  // 분야 키워드가 있으면 다른 폴더에도 바로가기 생성 (Wiki Link)
  const shortcuts = [];
  const text = `${node.label} ${node.body || ''}`;
  if (text.includes('울산')) shortcuts.push('02_우리나라_이슈/울산');
  if (text.includes('학생') || text.includes('교육')) shortcuts.push('02_우리나라_이슈/교육');
  if (text.includes('환경') || text.includes('기후')) shortcuts.push('02_우리나라_이슈/과학/환경');
  if (text.includes('영화') || text.includes('책') || text.includes('미술')) shortcuts.push('02_우리나라_이슈/문화');
  return shortcuts.filter(s => s !== mainFolder).slice(0, 2);
}

/* 화면 보조 — 분류 미니 카드 HTML 생성 */
window.YEON_RENDER_VAULT_CARD = function(node){
  const m = window.YEON_MAP_NODE_TO_VAULT(node);
  return `
    <div class="ytm-vault-card" style="
      margin-top:14px;padding:12px 14px;
      background:rgba(195,141,86,.08);border:1px solid rgba(195,141,86,.25);
      border-radius:8px;font-size:12px;line-height:1.7;
    ">
      <div style="font-family:'Noto Serif KR',serif;font-size:11px;color:#c38d56;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">📚 Vault 분류</div>
      <div><strong>main</strong> · <code style="font-family:'JetBrains Mono',monospace;font-size:11.5px">${m.main_folder}</code></div>
      ${m.shortcut_folders.length ? `<div><strong>shortcut</strong> · ${m.shortcut_folders.map(s=>`<code style="font-family:'JetBrains Mono',monospace;font-size:11.5px">${s}</code>`).join(' · ')}</div>` : ''}
      ${m.keywords.length ? `<div style="margin-top:4px"><strong>keywords</strong> · ${m.keywords.map(k=>`<span style="display:inline-block;padding:1px 7px;background:rgba(66,122,113,.15);color:#427a71;border-radius:999px;margin-right:4px;font-size:10.5px;font-weight:600">#${k}</span>`).join('')}</div>` : ''}
      <div style="margin-top:6px;font-size:10.5px;color:#7b8686">YLV-4 §22 · 4단 깊이 · Wiki Link 바로가기 ${m.shortcut_folders.length}개</div>
    </div>
  `;
};
