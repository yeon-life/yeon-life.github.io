// --- SCRIPT BLOCK 0 CONTAINING ADMIN LOGIC ---

/* ════════════════════════════════
   데이터 & 스토리지
════════════════════════════════ */
const LS = {
  get(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))},
};
function getUsers(){return LS.get('ylife_users')||[];}
function getDeletedPostIds(){return new Set(LS.get('ylife_deleted_post_ids')||[]);}
function markPostDeletedLocal(id){
  if(!id) return;
  const ids=LS.get('ylife_deleted_post_ids')||[];
  if(!ids.includes(id)){ids.push(id);LS.set('ylife_deleted_post_ids',ids.slice(-2000));}
}
function hasMojibake(s){return /[ÃÂÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿ ]|ê|ë|ì|í|î|ï|ð|ñ|ò|ó|ô|õ|ö|ù|ú|û|ü|ý|þ|ÿ/.test(String(s||''));}
function tryFixMojibake(s){
  s=String(s||'').trim();
  if(!s) return '';
  try{
    const decoded=decodeURIComponent(escape(s));
    if(decoded && decoded!==s && !hasMojibake(decoded)) return decoded;
  }catch(e){}
  return s;
}
function cleanNick(n){
  let s=tryFixMojibake(n).replace(/<[^>]*>/g,'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
  if(!s) return '익명';
  if(s.length>24) s=s.slice(0,24);
  if(hasMojibake(s)) return '익명';
  return s;
}
function nickLooksBroken(n){return !String(n||'').trim() || hasMojibake(n);}
function displayNick(author,authorId){
  const users=getUsers();
  const u=authorId?users.find(x=>x.id===authorId):null;
  if(u && u.nick && !nickLooksBroken(u.nick)) return cleanNick(u.nick);
  return cleanNick(author);
}
function normalizePost(p){
  if(!p) return p;
  if(!Array.isArray(p.likes)) p.likes=[];
  if(!Array.isArray(p.comments)) p.comments=[];
  p.title=cleanUserText(p.title,120);
  p.body=cleanUserText(p.body,2000);
  p.author=displayNick(p.author,p.authorId);
  p.comments=p.comments.map(c=>({...c,author:displayNick(c.author,c.authorId),text:cleanUserText(c.text,300)})).filter(c=>c.text);
  return p;
}
function allPosts(){
  const deleted=getDeletedPostIds();
  return (LS.get('ylife_posts')||[]).filter(p=>p&&p.id&&!deleted.has(p.id)&&!p.deleted).map(normalizePost);
}
function getPosts(f){return allPosts().filter(p=>p.forum===f);}
function savePostsFiltered(posts){
  const deleted=getDeletedPostIds();
  LS.set('ylife_posts',(posts||[]).filter(p=>p&&p.id&&!deleted.has(p.id)&&!p.deleted).map(normalizePost));
}


/* ════════════════════════════════
   안전 입력/출력 공통 함수
   - 장난글 원천 차단
   - 관리자 대시보드 깨짐 방지
   - Firebase 저장 전 정리
════════════════════════════════ */
function stripDangerousControls(text){
  return String(text||'')
    .replace(/[\u202A-\u202E\u2066-\u2069]/g,'')
    .replace(/[\u200B-\u200F\uFEFF]/g,'')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,'');
}
function collapseLongRuns(text){
  return String(text||'')
    .replace(/([^\s])\1{7,}/gu,'$1$1$1$1…')
    .replace(/([ㄱ-ㅎㅏ-ㅣ])\1{5,}/gu,'$1$1$1…');
}
function cleanUserText(text, maxLen){
  let s = stripDangerousControls(text)
    .replace(/[<>]/g,'')
    .replace(/\r\n/g,'\n')
    .replace(/\n{4,}/g,'\n\n\n')
    .trim();
  s = collapseLongRuns(s);
  if(maxLen && s.length > maxLen) s = s.slice(0,maxLen);
  return s;
}
function safePreviewText(text, maxLen=80){
  let s = cleanUserText(text, maxLen + 10).replace(/\s+/g,' ').trim();
  if(s.length > maxLen) s = s.slice(0,maxLen) + '…';
  return s;
}
function hasTooMuchRepeat(text){
  const compact = String(text||'').replace(/\s+/g,'');
  if(/(.)\1{7,}/u.test(compact)) return true;
  if(/[ㄱ-ㅎㅏ-ㅣ]{8,}/u.test(compact)) return true;
  const chars=[...compact];
  if(chars.length>=12 && new Set(chars).size<=3) return true;
  return false;
}
function hasTooManySymbols(text){
  const t=String(text||'');
  const symbols = t.replace(/[가-힣a-zA-Z0-9\s.,!?~'"“”‘’()\-:;·]/g,'');
  return symbols.length >= 12;
}
function hasMeaningfulContent(text, min=6){
  const meaningful=(String(text||'').match(/[가-힣a-zA-Z0-9]/g)||[]).length;
  return meaningful >= min;
}
function validatePostBeforeSave(title, body, msgEl){
  const all = `${title||''} ${body||''}`;
  function fail(m){ if(msgEl) msgEl.textContent=m; else alert(m); return false; }
  if(!title || title.length < 2) return fail('제목을 두 글자 이상 입력해 주세요.');
  if(title.length > 40) return fail('제목이 너무 깁니다. 40자 이내로 줄여 주세요.');
  if(!body || body.length < 10) return fail('본문을 10자 이상 입력해 주세요.');
  if(body.length > 1200) return fail('본문이 너무 깁니다. 1200자 이내로 줄여 주세요.');
  if(hasTooMuchRepeat(all)) return fail('의미 없는 반복 문자나 장난성 글은 등록할 수 없습니다.');
  if(hasTooManySymbols(all)) return fail('특수문자가 너무 많습니다. 내용을 정리해서 다시 작성해 주세요.');
  if(!hasMeaningfulContent(all,8)) return fail('내용을 조금 더 의미 있게 작성해 주세요.');
  return true;
}
function validateCommentBeforeSave(text){
  const clean=cleanUserText(text,300);
  if(clean.length < 2){alert('댓글을 두 글자 이상 입력해 주세요.');return false;}
  if(clean.length > 300){alert('댓글은 300자 이내로 작성해 주세요.');return false;}
  if(hasTooMuchRepeat(clean) || hasTooManySymbols(clean) || !hasMeaningfulContent(clean,3)){
    alert('의미 없는 반복 문자, 장난성 댓글, 특수문자 과다 입력은 등록할 수 없습니다.');return false;
  }
  return true;
}
function sanitizePostForSave(post){
  const p={...(post||{})};
  p.title=cleanUserText(p.title,40);
  p.body=cleanUserText(p.body,1200);
  p.author=cleanNick(p.author);
  p.likes=Array.isArray(p.likes)?p.likes:[];
  p.comments=(Array.isArray(p.comments)?p.comments:[]).map(c=>({
    ...c,
    author:cleanNick(c.author),
    text:cleanUserText(c.text,300)
  })).filter(c=>c.text && !hasTooMuchRepeat(c.text));
  return p;
}

/* ── 자동 스크랩 ── */
function autoScrap(type, data){
  /* type: 'post'|'thought'|'reply'  data: {title,body,source,sourceId,date} */
  const scrap = LS.get('ylife_myscrap')||[];
  const entry = {
    id: Date.now().toString()+Math.floor(Math.random()*1000),
    type, title: data.title||'',
    body: data.body||'', source: data.source||'',
    sourceId: data.sourceId||'',
    date: data.date||new Date().toLocaleDateString('ko'),
    ts: Date.now()
  };
  /* 같은 sourceId면 업데이트 */
  const idx = scrap.findIndex(s=>s.sourceId&&s.sourceId===entry.sourceId);
  if(idx>=0) scrap[idx]=entry; else scrap.unshift(entry);
  if(scrap.length>500) scrap.splice(400);
  LS.set('ylife_myscrap',scrap);
}
function getMyScraps(){return LS.get('ylife_myscrap')||[];}
function getSettings(){return Object.assign({sitename:'y-life.kr',slogan:'삶·인연·소통',signup:true,comment:true,publicRead:true},LS.get('ylife_settings'));}
function getNewsData(){
  const def=defaultNews();
  const saved=LS.get('ylife_news');
  return saved||def;
}
function getHwadu(){return LS.get('ylife_hwadu')||{text:'사람은 자신이 의식적으로 선택한다고 믿지만, 그 이전에 이미 몸이 먼저 움직이기 시작한다. 그렇다면 \'나\'는 누구인가?',by:'— 연소사 제안 · Libet 실험에서 영감'};}
function getHwaduList(){return LS.get('ylife_hwadu_list')||[];}

let currentUser=null;
let adminLoggedIn=false;
let currentPostId=null;
let currentNewsCat='local';
let currentNewsMgmtCat='local';
let currentPostMgmtForum='all';

/* ════════════════════════════════
   기본 뉴스 데이터 (2026-04-25)
════════════════════════════════ */
function defaultNews(){
  return {
    local:[
      {title:'울산 쇠부리축제 개막 — 전통 제철 문화 체험 행사 성황',desc:'울산 북구 달천철장에서 열린 쇠부리축제가 25일 개막했다. 전통 제철 기술 시연, 철기 유물 전시, 체험 부스 등 다채로운 행사가 마련되어 가족 단위 관람객들의 발길이 이어졌다.',date:'2026.04.25',thought:''},
      {title:'울산 수산물경매시장 거래량 역대 최대치 기록',desc:'울산 남구 수산물경매시장이 올해 1분기 거래량에서 역대 최대치를 기록했다. 동해 어획량 증가와 물류 인프라 개선이 주요 원인으로 꼽히며, 시는 유통 시설 현대화를 추진 중이다.',date:'2026.04.24',thought:''},
      {title:'언양 지석묘군 훼손 논란 — 문화재 보호 조치 요구',desc:'울주군 언양읍 일대 청동기 시대 지석묘군이 주변 공사로 훼손 위기에 놓였다는 주장이 제기됐다. 문화재 단체들은 즉각적인 공사 중단과 정밀 실태 조사를 촉구하고 있다.',date:'2026.04.24',thought:''},
      {title:'울산 동성부부 법원 소송 — 가족관계 등록 판결 주목',desc:'울산 거주 동성 부부가 가족관계 등록 거부 처분 취소를 요청하는 행정 소송을 제기했다. 법조계는 이번 판결이 향후 동성 결합 법적 지위 논의에 중요한 선례가 될 것으로 보고 있다.',date:'2026.04.23',thought:''},
      {title:'울산 미세먼지 주의보 발령 — 외출 자제 권고',desc:'울산시는 25일 오전 미세먼지 주의보를 발령하고 시민들에게 외출 자제와 마스크 착용을 권고했다. 북서풍을 타고 유입된 중국발 황사가 주요 원인으로, 오후 늦게 해소될 전망이다.',date:'2026.04.25',thought:''},
    ],
    region:[
      {title:'현대차 울산공장 EV 전환 로드맵 발표 — 2028년 완전 전기화',desc:'현대자동차가 울산 1~5공장의 전기차 전환 로드맵을 공식 발표했다. 2028년까지 내연기관 생산 라인을 단계적으로 EV 라인으로 전환하며, 약 1조 원의 시설 투자와 함께 신규 고용 창출도 병행된다.',date:'2026.04.25',thought:''},
      {title:'경남·울산 광역교통망 연결 협약 체결',desc:'경남도와 울산시가 광역 교통망 연계 협약을 체결했다. 창원~울산 BRT(간선급행버스체계) 노선 신설과 광역 철도 환승 체계 구축이 핵심으로, 2028년 개통을 목표로 한다.',date:'2026.04.24',thought:''},
      {title:'남해안 관광벨트 조성 사업 착공 — 경남·전남·울산 공동',desc:'경남·전남·울산 3개 시도가 공동으로 추진하는 남해안 광역 관광벨트 조성 사업이 착공됐다. 해안 경관도로, 해양 레저 클러스터, 역사 문화 탐방로 등을 포함한 총 4,200억 원 규모 사업이다.',date:'2026.04.23',thought:''},
      {title:'태화강 생태복원 2단계 사업 예산 확보',desc:'울산시가 태화강 생태복원 2단계 사업 국비 350억 원을 확보했다. 중·상류 습지 확충과 외래 식물 제거, 연어 산란장 조성 등이 포함되며 2027년 완공 목표다.',date:'2026.04.22',thought:''},
      {title:'울산·경남 청년창업지원금 신청 접수 시작',desc:'울산·경남 청년창업 공동지원 사업의 올해 신청 접수가 시작됐다. 만 18~39세 예비·초기 창업자를 대상으로 최대 5,000만 원의 사업화 자금과 멘토링이 제공된다.',date:'2026.04.25',thought:''},
    ],
    korea:[
      {title:'1분기 GDP 성장률 +1.7% — 수출 회복세 지속',desc:'한국은행이 발표한 올해 1분기 실질 GDP 성장률(전분기 대비)이 +1.7%로 집계됐다. 반도체·자동차 수출 호조가 성장을 이끌었으며, 민간 소비도 완만한 회복세를 보였다.',date:'2026.04.25',thought:''},
      {title:'KOSPI 6388포인트 — 사상 최고치 경신',desc:'코스피 지수가 25일 장중 6,388포인트를 기록하며 사상 최고치를 경신했다. 외국인 순매수 확대와 반도체주 강세가 지수 상승을 이끌었으며, 코스닥도 함께 상승 마감했다.',date:'2026.04.24',thought:''},
      {title:'전세사기특별법 개정안 국회 본회의 통과',desc:'전세 피해자 지원 범위를 확대하는 전세사기특별법 개정안이 국회 본회의를 통과했다. 피해자 인정 요건 완화, 긴급 주거 지원 기간 연장, 보증금 반환 소송 비용 국가 지원 등이 골자다.',date:'2026.04.23',thought:''},
      {title:'이재명 대통령 인도 순방 마치고 귀환',desc:'이재명 대통령이 4박 5일간의 인도 공식 방문을 마치고 귀국했다. 모디 총리와의 정상회담에서 반도체·방산·우주 분야 협력 MOU를 체결했으며, 양국 교역 목표를 500억 달러로 상향 합의했다.',date:'2026.04.25',thought:''},
      {title:'한국은행 신현송 총재 취임 — 통화정책 방향 주목',desc:'신현송 한국은행 총재가 공식 취임했다. 취임사에서 "물가 안정을 최우선 과제로 삼되 성장 동력 훼손 없는 통화정책을 추진하겠다"고 밝혀 금리 방향에 관심이 쏠리고 있다.',date:'2026.04.22',thought:''},
      {title:'국민연금 개혁안 국회 제출 — 보험료율 13% 인상 핵심',desc:'정부가 보험료율을 현행 9%에서 13%로 인상하는 내용의 국민연금 개혁안을 국회에 제출했다. 소득대체율 43% 유지와 수급 개시 연령 단계적 조정도 포함되어 있어 국회 심의 과정에서 논란이 예상된다.',date:'2026.04.25',thought:''},
    ],
    world:[
      {title:'한-인도 정상회담 — 이재명·모디, 첨단기술 협력 협약',desc:'한국과 인도 정상이 뉴델리에서 회담을 갖고 반도체, 방산, 우주 분야 전략적 협력 협약을 체결했다. 양국은 2030년까지 교역 500억 달러 달성을 목표로 첨단 산업 공급망 협력을 강화하기로 했다.',date:'2026.04.25',thought:''},
      {title:'복합극한기후 발생 빈도 산업화 이전 대비 5배 — IPCC 보고',desc:'IPCC(기후변화에 관한 정부간 협의체)가 발표한 특별 보고서에 따르면 홍수·가뭄·폭염이 동시 발생하는 복합극한기후의 빈도가 산업화 이전보다 5배 증가한 것으로 나타났다.',date:'2026.04.24',thought:''},
      {title:'Blue Origin 뉴글렌 FAA 비행 정지 — 안전 점검',desc:'미 연방항공청(FAA)이 Blue Origin의 뉴글렌 로켓에 대해 잠정 비행 정지 명령을 내렸다. 지난 발사에서 발견된 1단 추진체 이상 징후를 정밀 점검하기 위한 조치로, 다음 발사 일정에 영향이 불가피하다.',date:'2026.04.24',thought:''},
      {title:'말레이시아 실종 한국인 구조 — 외교부 영사 지원',desc:'말레이시아 코타키나발루 인근 해상에서 실종됐던 한국인 관광객 3명이 현지 해경에 의해 구조됐다. 외교부는 현지 영사를 급파해 의료 지원과 귀국 절차를 돕고 있다.',date:'2026.04.23',thought:''},
      {title:'KATSEYE 방한 — K팝 글로벌 그룹 서울 공연',desc:'하이브와 글로벌 레이블 공동 제작 그룹 KATSEYE가 서울에서 첫 단독 콘서트를 개최했다. 한국·미국·필리핀 출신 6인조 걸그룹으로, 글로벌 팬덤과 함께 K팝의 새로운 세계화 모델로 주목받고 있다.',date:'2026.04.25',thought:''},
    ],
    sky:[
      {title:'혜성 PanSTARRS C/2023 V4 — 맨눈 관측 가능 시기 임박',desc:'혜성 C/2023 V4(PanSTARRS)가 5월 초 근일점 통과를 앞두고 밝기가 5등급대로 높아지고 있다. 천문학자들은 이달 말~다음 달 초 새벽 동쪽 하늘에서 쌍안경 없이도 관측 가능할 것으로 전망한다.',date:'2026.04.25',thought:''},
      {title:'SpaceX 스타링크 17-16 발사 성공 — 위성 인터넷 확장',desc:'SpaceX가 팔콘9 로켓을 이용해 스타링크 17-16 미션으로 위성 23기를 저궤도에 성공적으로 투입했다. 이로써 스타링크 위성 총수는 6,800기를 넘어섰으며, 한국 서비스 품질도 지속 향상될 전망이다.',date:'2026.04.24',thought:''},
      {title:'Rocket Lab, 일본 위성 궤도 투입 성공',desc:'Rocket Lab의 일렉트론 로켓이 일본 우주항공연구개발기구(JAXA)의 소형 지구관측위성을 예정 궤도에 정확히 투입했다. 이번 발사는 뉴질랜드 마히아 발사장에서 진행됐으며 완벽한 성공으로 기록됐다.',date:'2026.04.23',thought:''},
      {title:'달-레굴루스 엄폐 현상 — 25일 새벽 관측 기회',desc:'25일 새벽 2시경 달이 사자자리 1등성 레굴루스를 가리는 엄폐 현상이 한반도 전역에서 관측됐다. 망원경 없이도 육안으로 확인 가능했으며, 천문 동호회 회원들의 활발한 관측 기록이 이어졌다.',date:'2026.04.25',thought:''},
      {title:'기상청 "2026년 역대 최고기온 경신 전망"',desc:'기상청이 발표한 올해 기후 전망 보고서에 따르면 2026년 연평균 기온이 관측 사상 최고치를 경신할 가능성이 높다. 엘니뇨 현상 약화에도 불구하고 지구 온난화 기조가 기온 상승을 주도한다는 분석이다.',date:'2026.04.24',thought:''},
    ],
    land:[
      {title:'기후변화로 사과 주산지 강원도로 이동 — 농촌진흥청 발표',desc:'농촌진흥청이 발표한 기후변화 대응 농업 지도에 따르면 2040년경에는 경북 중심의 사과 주산지가 강원도와 경기 북부로 이동할 것으로 예측됐다. 배, 복숭아 등 다른 과수도 유사한 북상 패턴이 전망된다.',date:'2026.04.25',thought:''},
      {title:'복합극한기후, 농업 피해 5배 증가 — 기상청 경고',desc:'기상청 분석에 따르면 최근 10년간 홍수와 가뭄이 겹치는 복합 극한기후로 인한 농업 피해 규모가 이전 10년 대비 5배 이상 증가했다. 피해 보상 체계와 작물 다양화 정책 수립이 시급하다는 지적이다.',date:'2026.04.24',thought:''},
      {title:'전국 스마트팜 보급률 23% 증가 — 청년농 중심 확산',desc:'농림축산식품부가 발표한 스마트팜 현황에 따르면 올해 1분기 전국 스마트팜 보급률이 지난해 대비 23% 증가했다. 특히 30·40대 청년 농업인의 도입률이 높아 농촌 고령화 문제 해결에도 기여할 것으로 기대된다.',date:'2026.04.23',thought:''},
      {title:'산림 탄소흡수원 고시 면적 확대 — 탄소중립 기여',desc:'산림청이 탄소흡수원 공식 고시 면적을 기존 대비 12% 확대했다. 이번 조치로 국가 온실가스 인벤토리상 산림 부문 흡수량이 늘어나 2030 NDC(국가 온실가스 감축 목표) 달성에 도움이 될 전망이다.',date:'2026.04.22',thought:''},
      {title:'농업위성 1호 발사 계획 확정 — 2027년 목표',desc:'농림축산식품부와 한국항공우주연구원이 공동 개발 중인 농업전용 관측위성 1호의 발사 일정을 2027년 하반기로 확정했다. 작물 생육 모니터링, 병충해 조기 탐지, 토양 수분 분석 등에 활용될 예정이다.',date:'2026.04.25',thought:''},
    ],
    sea:[
      {title:'한반도 주변 해수면 온도 1.6°C 상승 — 해양수산부',desc:'해양수산부가 발표한 해양 기후 관측 결과에 따르면 한반도 주변 해역의 평균 해수면 온도가 1980년대 대비 1.6°C 상승한 것으로 나타났다. 난류성 어종의 북상과 한류성 어종의 감소가 뚜렷해지고 있다.',date:'2026.04.25',thought:''},
      {title:'3월 한국 바다 평균 수온 역대 2위 기록',desc:'국립해양조사원이 집계한 3월 평균 해수 표면 온도가 역대 2위를 기록했다. 전반적인 수온 상승 추세 속에 동해 북부 냉수대 형성이 지연되면서 명태·오징어 어획에 영향이 우려된다.',date:'2026.04.24',thought:''},
      {title:'해양 온난화가 지구 자전 속도 늦춘다 — 네이처 연구',desc:'국제 학술지 네이처에 발표된 연구에 따르면 해양 온난화로 인한 해수 팽창과 극지방 빙하 융해가 지구 자전 속도를 미세하게 늦추고 있는 것으로 나타났다. GPS 및 원자시계 보정에 영향을 줄 수 있다.',date:'2026.04.23',thought:''},
      {title:'해수부, 연안 생태복원 예산 147억 집행 계획',desc:'해양수산부가 올해 연안 생태복원 사업에 147억 원을 집행할 계획을 밝혔다. 갯벌 복원, 해조류 숲 조성, 산호 이식 등을 통해 연안 생태계 건강성을 회복하고 어업인 소득 증대에도 기여한다는 방침이다.',date:'2026.04.22',thought:''},
      {title:'해양기후변화 전망 보고서 발표 — 2040년 시나리오',desc:'한국해양과학기술원(KIOST)이 발간한 해양기후변화 전망 보고서는 2040년까지 동해 수온 2°C 추가 상승과 서해 저산소 현상 심화를 예측했다. 보고서는 해양 생태계 보전을 위한 긴급 대응책 마련을 촉구했다.',date:'2026.04.25',thought:''},
    ],
  };
}

const CAT_LABEL={local:'우리동네',region:'지역',korea:'대한민국',world:'지구촌',sky:'하늘',land:'땅',sea:'바다'};

/* ════════════════════════════════
   뉴스 렌더
════════════════════════════════ */
function renderNews(){
  const data=getNewsData();
  const cat=currentNewsCat;
  const items=data[cat]||[];
  const saved=LS.get('ylife_news_thoughts')||{};
  const CAT_ICON={
    local:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    region:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    korea:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
    world:'<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    sky:'<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>',
    land:'<path d="M12 22V12M12 12C12 7 7 3 2 3M12 12c0-5 5-9 10-9M2 22h20"/>',
    sea:'<path d="M2 12c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0M2 17c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0M2 7c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0"/>',
  };
  let html=`<div class="news-grid">`;
  items.forEach((n,i)=>{
    const key=`${cat}_${i}`;
    const thoughts=getNewsThoughts(key);
    const thoughtCount=thoughts.length;
    html+=`<div class="news-card" onclick="openNewsDetail('${cat}',${i})" style="cursor:pointer">
      <div class="card-image" data-cat="${cat}">
        <svg viewBox="0 0 24 24">${CAT_ICON[cat]||''}</svg>
      </div>
      <div class="card-content">
        <span class="category-tag">${CAT_LABEL[cat]}</span>
        <div class="news-title">${n.title}</div>
        ${n.desc?`<div class="news-desc">${n.desc}</div>`:''}
        <div class="news-date">${n.date}</div>
        <div class="news-thought" style="pointer-events:none">
          <input type="text" placeholder="클릭해서 기사 읽기 + 내 생각 남기기 →"
            value="${thoughtCount>0?thoughtCount+'개의 생각이 달려있어요':''}" readonly
            style="background:var(--surface);color:var(--ink-soft);cursor:pointer;">
        </div>
      </div>
    </div>`;
  });
  html+=`</div>`;
  document.getElementById('newsContent').innerHTML=html;
}
function switchNews(cat,el){
  currentNewsCat=cat;
  document.querySelectorAll('.news-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderNews();
}
/* ══════════════════════════════════
   뉴스 더보기 — Gemini 텍스트 + 이미지
══════════════════════════════════ */
const NEWS_MORE_TOPICS={
  local:['울산 소식','동네 행사','지역 교육','울산 환경','울산 경제'],
  region:['부산 소식','경남 소식','대구 소식','경북 소식','지방 정치'],
  korea:['국내 정치','경제 동향','사회 이슈','문화 소식','스포츠'],
  world:['미국 소식','일본·중국','유럽 소식','중동 뉴스','국제 경제'],
  sky:['날씨·기상','우주·천문','항공 소식','기후변화','환경'],
  land:['생태·자연','농업·식품','산림·공원','지진·지질','동식물'],
  sea:['해양 환경','수산업','항만·해운','해양 과학','독도·영해']
};
let _selNewsMoreTopic='';
function openNewsMore(){
  const drawer=document.getElementById('newsMoreDrawer');
  const isOpen=drawer.style.display!=='none';
  drawer.style.display=isOpen?'none':'block';
  if(!isOpen){
    /* 카테고리별 주제 버튼 렌더 */
    const topics=NEWS_MORE_TOPICS[currentNewsCat]||[];
    document.getElementById('newsMoreTopicBtns').innerHTML=topics.map(t=>`
      <button class="news-more-topic" onclick="selectMoreTopic('${t}',this)">${t}</button>`).join('');
    _selNewsMoreTopic='';
    document.getElementById('newsMoreKeyword').value='';
    document.getElementById('newsMoreResult').innerHTML='';
    document.getElementById('newsMoreStatus').textContent='';
  }
}
function selectMoreTopic(topic,el){
  _selNewsMoreTopic=topic;
  document.querySelectorAll('.news-more-topic').forEach(b=>b.classList.remove('sel'));
  el.classList.add('sel');
  document.getElementById('newsMoreKeyword').value=topic;
}
async function fetchMoreNews(){
  const keyword=document.getElementById('newsMoreKeyword').value.trim()||_selNewsMoreTopic||CAT_LABEL[currentNewsCat]||'';
  if(!keyword){document.getElementById('newsMoreStatus').textContent='주제를 선택하거나 키워드를 입력해주세요.';return;}
  const key=LS.get('ylife_gemini_key')||'';
  if(!key){
    document.getElementById('newsMoreStatus').innerHTML='Gemini API 키가 필요합니다. <a onclick="openModal(\'settingsModal\')" style="color:var(--thread);cursor:pointer">설정에서 입력 →</a>';
    return;
  }
  const btn=document.getElementById('newsMoreFetchBtn');
  btn.disabled=true;btn.textContent='검색 중…';
  document.getElementById('newsMoreStatus').textContent='Gemini가 뉴스를 수집하고 있습니다…';
  document.getElementById('newsMoreResult').innerHTML='';
  const today=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});
  const prompt=`오늘은 ${today}입니다. "${keyword}" 관련 최신 뉴스 5개를 아래 JSON 배열로만 답해주세요. 다른 말 없이 JSON만.

[
  {
    "title": "기사 제목 (실제 같은 구체적인 제목)",
    "desc": "2-3문장 핵심 요약",
    "body": "5-7문장 상세 본문. 구체적 수치·장소·인물 포함",
    "date": "${today}"
  }
]

조건: 한국어, 실제 뉴스처럼 구체적으로, 긍정/부정 균형있게, 최근 트렌드 반영`;
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],
        generationConfig:{temperature:0.7,maxOutputTokens:2000}})
    });
    const d=await res.json();
    let raw=d?.candidates?.[0]?.content?.parts?.[0]?.text||'[]';
    raw=raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    const items=JSON.parse(raw);
    if(!Array.isArray(items)||!items.length)throw new Error('뉴스를 가져오지 못했습니다.');
    /* localStorage에 추가 */
    const data=getNewsData();
    if(!data[currentNewsCat])data[currentNewsCat]=[];
    const newItems=items.slice(0,5).map(n=>({...n,aiGenerated:true,keyword}));
    data[currentNewsCat].push(...newItems);
    LS.set('ylife_news',data);
    document.getElementById('newsMoreStatus').textContent=`✓ ${newItems.length}개 뉴스를 추가했습니다!`;
    renderNews();
    /* 드로어 닫기 */
    setTimeout(()=>{
      document.getElementById('newsMoreDrawer').style.display='none';
    },1200);
  }catch(e){
    document.getElementById('newsMoreStatus').textContent='오류: '+e.message;
  }
  btn.disabled=false;btn.textContent='뉴스 가져오기';
}

/* ── 뉴스 본문 AI 확장 ── */
function _getExpandedBody(key){
  const cache=LS.get('ylife_news_body_cache')||{};
  return cache[key]||null;
}
function _saveExpandedBody(key,text){
  const cache=LS.get('ylife_news_body_cache')||{};
  cache[key]=text;
  LS.set('ylife_news_body_cache',cache);
}
function _renderExpandedBody(text){
  const paras=text.split(/\n{2,}/).filter(p=>p.trim());
  return `<div class="nds-article-expanded">${
    paras.map(p=>`<p>${p.trim()}</p>`).join('')
  }<div class="nds-expand-note">✦ Gemini AI가 생성한 기사 전문입니다</div></div>`;
}
async function expandNewsBody(cat,idx){
  const btn=document.getElementById('ndsExpandBtn');
  if(btn){btn.disabled=true;btn.textContent='⏳ 생성 중...';}
  const data=getNewsData();
  const n=(data[cat]||[])[idx];
  if(!n)return;
  const key=LS.get('ylife_gemini_key')||'';
  if(!key){alert('Gemini API 키가 없습니다.');return;}
  const prompt=`다음 뉴스 기사의 제목과 요약을 바탕으로, 실제 기사처럼 자연스러운 한국어 뉴스 본문을 작성해주세요.

제목: ${n.title}
카테고리: ${CAT_LABEL[cat]||cat}
날짜: ${n.date}
요약: ${n.desc||''}

조건:
- 400~600자 분량
- 단락 2~3개로 나누기 (단락 사이 빈 줄 포함)
- 육하원칙에 맞게 사실적으로 작성
- 신문 기사 문체 (경어체)
- 숫자·인물·기관명은 요약에 있는 것만 사용
- 추측·의견이 아닌 사실 서술 위주

본문만 출력하세요 (제목, 날짜 제외).`;
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
    });
    const d=await res.json();
    const text=d?.candidates?.[0]?.content?.parts?.[0]?.text||'';
    if(!text){throw new Error('생성 실패');}
    const newsKey=`${cat}_${idx}`;
    _saveExpandedBody(newsKey,text);
    const expandWrap=document.getElementById('ndsExpandWrap');
    if(expandWrap)expandWrap.innerHTML=_renderExpandedBody(text);
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='✦ AI로 기사 전문 생성 (재시도)';}
  }
}

/* ── Imagen 3 이미지 생성 ── */
const _imgCache={};
async function generateNewsImage(title,cat){
  const cacheKey=title.slice(0,30);
  if(_imgCache[cacheKey])return _imgCache[cacheKey];
  const key=LS.get('ylife_gemini_key')||'';
  if(!key)return null;
  const catKr=CAT_LABEL[cat]||'뉴스';
  const prompt=`Editorial news illustration for: "${title}". Category: ${catKr}. Minimalist, warm tones, no text, simple composition, suitable for Korean news website.`;
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:predict?key=${key}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({instances:[{prompt}],parameters:{sampleCount:1,aspectRatio:'16:9'}})
    });
    const d=await res.json();
    const b64=d?.predictions?.[0]?.bytesBase64Encoded;
    if(!b64)return null;
    const url=`data:image/png;base64,${b64}`;
    _imgCache[cacheKey]=url;
    return url;
  }catch{return null;}
}

/* ── 뉴스 생각 (멀티유저 배열) ── */
function getNewsThoughts(key){
  const all=LS.get('ylife_news_thoughts2')||{};
  return all[key]||[];
}
function saveNewsThought(key,text){
  if(!currentUser||!text.trim())return;
  const all=LS.get('ylife_news_thoughts2')||{};
  if(!all[key])all[key]=[];
  const today=new Date().toLocaleDateString('ko');
  /* 같은 유저가 이미 남긴 생각 있으면 업데이트 */
  const existing=all[key].findIndex(t=>t.authorId===currentUser.id);
  if(existing>=0){
    all[key][existing].text=text.trim();
    all[key][existing].date=today;
  }else{
    all[key].push({
      id:Date.now().toString(),text:text.trim(),
      author:cleanNick(currentUser.nick),authorId:currentUser.id,
      date:today,replies:[]
    });
  }
  LS.set('ylife_news_thoughts2',all);
  /* 자동 스크랩 — 뉴스 기사 제목 가져오기 */
  try{
    const newsTitle=document.getElementById('ndsArticleTitle')?.textContent||'뉴스 기사';
    autoScrap('thought',{title:'[뉴스 생각] '+newsTitle.slice(0,40),body:text.trim(),source:'시민 저널',sourceId:'thought_'+key+'_'+(currentUser.id||''),date:today});
  }catch(e){}
}
function addNewsReply(key,thoughtId,text){
  if(!currentUser||!text.trim())return;
  const all=LS.get('ylife_news_thoughts2')||{};
  const thoughts=all[key]||[];
  const t=thoughts.find(t=>t.id===thoughtId);
  if(!t)return;
  t.replies.push({id:Date.now().toString(),text:text.trim(),
    author:cleanNick(currentUser.nick),authorId:currentUser.id,
    date:new Date().toLocaleDateString('ko')});
  LS.set('ylife_news_thoughts2',all);
}
/* 구 데이터 마이그레이션 */
function saveThought(key,val){
  /* 하위호환 유지 — 실제론 saveNewsThought 사용 */
  if(currentUser)saveNewsThought(key,val);
}

/* ── 뉴스 상세 화면 ── */
let _currentNewsKey=null;
let _currentNewsItem=null;
function openNewsDetail(cat,idx){
  const data=getNewsData();
  const n=(data[cat]||[])[idx];
  if(!n)return;
  _currentNewsKey=`${cat}_${idx}`;
  _currentNewsItem={...n,cat,idx};
  /* 기사 채우기 */
  document.getElementById('ndsCatBadge').textContent=CAT_LABEL[cat]||cat;
  document.getElementById('ndsArticleCat').textContent=CAT_LABEL[cat]||cat;
  document.getElementById('ndsArticleTitle').textContent=n.title;
  document.getElementById('ndsArticleMeta').textContent=n.date+(n.link?' · 외부 기사':(n.aiGenerated?' · AI 생성 뉴스':''));
  document.getElementById('ndsArticleDesc').textContent=n.desc||'';
  document.getElementById('ndsArticleBody').textContent=n.body||'';
  /* AI 확장 기사 캐시 확인 */
  const newsKey=`${cat}_${idx}`;
  const cached=_getExpandedBody(newsKey);
  const expandWrap=document.getElementById('ndsExpandWrap');
  if(n.body){
    expandWrap.innerHTML='';
  } else if(cached){
    expandWrap.innerHTML=_renderExpandedBody(cached);
  } else {
    const key=LS.get('ylife_gemini_key')||'';
    expandWrap.innerHTML=key
      ?`<button class="nds-expand-btn" id="ndsExpandBtn" onclick="expandNewsBody('${cat}',${idx})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>
          ✦ AI로 기사 전문 생성
        </button>
        <div class="nds-expand-note">Gemini가 제목과 요약을 바탕으로 500자 전문을 생성합니다</div>`
      :'';
  }
  const origLink=document.getElementById('ndsOrigLink');
  if(n.link){origLink.href=n.link;origLink.style.display='';}
  else origLink.style.display='none';
  /* 이미지 처리 — 우선순위: ①원문 img URL ②base64 캐시 ③Imagen 생성 */
  const imgWrap=document.getElementById('ndsArticleTitle');
  const imgEl=document.getElementById('ndsHeroImg');
  if(imgEl)imgEl.remove();
  function _placeNewsImg(src,alt){
    const img=document.createElement('img');
    img.src=src;img.className='nds-gen-img';img.id='ndsHeroImg';img.alt=alt;
    img.onerror=()=>img.style.display='none'; /* 로드 실패 시 숨김 */
    imgWrap.before(img);
  }
  if(n.img && n.img.startsWith('http')){
    /* ① 원문에서 가져온 실제 이미지 URL */
    _placeNewsImg(n.img, n.title);
  } else if(n.img && n.img.startsWith('data:')){
    /* ② 이미 Imagen으로 생성된 base64 */
    _placeNewsImg(n.img, n.title);
  } else {
    /* ③ 이미지 없음 → Imagen 생성 시도 (API 키 있을 때만) */
    const apiKey=LS.get('ylife_gemini_key')||'';
    if(apiKey){
      const placeholder=document.createElement('div');
      placeholder.id='ndsHeroImg';
      placeholder.className='nds-gen-img-placeholder';
      placeholder.textContent='🖼 이미지 준비 중…';
      imgWrap.before(placeholder);
      generateNewsImage(n.title,cat).then(url=>{
        const ph=document.getElementById('ndsHeroImg');
        if(!ph)return;
        if(url){
          const img=document.createElement('img');
          img.src=url;img.className='nds-gen-img';img.id='ndsHeroImg';img.alt=n.title;
          ph.replaceWith(img);
        }else ph.style.display='none';
      });
    }
  }
  /* 생각 패널 */
  renderNdsThoughtInput();
  renderNdsThoughtList();
  /* 열기 */
  document.getElementById('newsDetailScreen').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeNewsDetail(){
  document.getElementById('newsDetailScreen').classList.remove('open');
  document.body.style.overflow='';
  renderNews(); /* 카드 생각 수 갱신 */
}
function renderNdsThoughtInput(){
  const wrap=document.getElementById('ndsThoughtInputWrap');
  if(!currentUser){
    wrap.innerHTML=`<div class="nds-thought-login">로그인하면 생각을 남길 수 있어요.<br><a onclick="openModal('loginModal');closeNewsDetail()">로그인하기 →</a></div>`;
    return;
  }
  const mine=getNewsThoughts(_currentNewsKey).find(t=>t.authorId===currentUser.id);
  const MAX=300;
  wrap.innerHTML=`
    <div class="nds-ai-suggest" id="ndsAiSuggest"></div>
    <div class="nds-guideline show" id="ndsGuideline">
      ✏️ <strong>작성 가이드</strong> · 최대 ${MAX}자<br>
      이 기사에서 가장 마음에 걸리는 부분은 무엇인가요?<br>
      그 이유와 함께 솔직하게 적어보세요.
    </div>
    <div class="nds-ai-bar">
      <button class="nds-ai-btn" onclick="ndsAiHelp()">✦ AI 생각 도우미</button>
      <span class="nds-char-count" id="ndsCharCount">0 / ${MAX}</span>
    </div>
    <textarea class="nds-thought-input" id="ndsThoughtTextarea"
      placeholder="이 기사를 읽고 어떤 생각이 드셨나요? (최대 ${MAX}자)"
      maxlength="${MAX}"
      oninput="ndsUpdateCount(this,${MAX})"
    >${mine?mine.text:''}</textarea>
    <button class="nds-thought-submit" onclick="submitNdsThought()">생각 남기기</button>
    <div style="clear:both"></div>`;
  /* 글자 수 초기 세팅 */
  const ta=document.getElementById('ndsThoughtTextarea');
  if(ta&&ta.value) ndsUpdateCount(ta,MAX);
  /* 기존 글 있으면 안내 숨기기 */
  if(mine) document.getElementById('ndsGuideline').classList.remove('show');
}
function ndsUpdateCount(ta,max){
  const cnt=ta.value.length;
  const el=document.getElementById('ndsCharCount');
  if(el){el.textContent=cnt+' / '+max;el.className='nds-char-count'+(cnt>=max*0.9?' warn':'');}
}
async function ndsAiHelp(){
  const key=localStorage.getItem('ylife_gemini_key');
  const btn=document.querySelector('.nds-ai-btn');
  const suggest=document.getElementById('ndsAiSuggest');
  if(!key){
    suggest.textContent='⚙️ 설정에서 Gemini API 키를 입력하면 AI 도우미를 사용할 수 있어요.';
    suggest.classList.add('show');return;
  }
  if(btn){btn.textContent='⏳ 생각 중...';btn.disabled=true;}
  const title=document.getElementById('ndsArticleTitle')?.textContent||'이 기사';
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:`다음 뉴스 기사에 대해 독자가 생각을 남기도록 돕는 짧은 생각 씨앗 문장 1~2개를 한국어로 만들어 주세요. 기사 제목: "${title}". 형식: "혹시 ~라는 생각이 드셨나요?" 또는 "이 기사에서 ~한 부분이 마음에 걸렸습니다." 처럼 부드럽게. 100자 이내로.`}]}]})
    });
    const d=await res.json();
    const txt=d?.candidates?.[0]?.content?.parts?.[0]?.text||'생각의 씨앗을 가져오지 못했어요.';
    suggest.textContent='💡 '+txt.trim();
    suggest.classList.add('show');
  }catch(e){suggest.textContent='AI 연결에 실패했어요.';suggest.classList.add('show');}
  if(btn){btn.innerHTML='✦ AI 생각 도우미';btn.disabled=false;}
}
function submitNdsThought(){
  const text=document.getElementById('ndsThoughtTextarea')?.value||'';
  if(!text.trim()){return;}
  saveNewsThought(_currentNewsKey,text);
  renderNdsThoughtList();
  renderNdsThoughtInput();
}
function renderNdsThoughtList(){
  const thoughts=getNewsThoughts(_currentNewsKey);
  const el=document.getElementById('ndsThoughtList');
  if(!thoughts.length){
    el.innerHTML=`<div class="nds-empty-thoughts">첫 번째 생각을 남겨보세요 ✍️</div>`;return;
  }
  el.innerHTML=thoughts.map(t=>`
    <div class="nds-thought-item">
      <div class="nds-thought-item-head">
        <div class="nds-thought-avatar">${t.author[0]}</div>
        <span class="nds-thought-nick">${escHtml(t.author)}</span>
        <span class="nds-thought-date">${t.date}</span>
      </div>
      <div class="nds-thought-text">${escHtml(t.text)}</div>
      ${currentUser?`<button class="nds-thought-reply-btn" onclick="toggleNdsReply('${t.id}')">↩ 답글</button>`:''}
      <div class="nds-reply-form" id="replyForm_${t.id}">
        <textarea class="nds-reply-input" placeholder="답글을 입력하세요..." rows="2" id="replyInput_${t.id}"></textarea>
        <button class="nds-reply-submit" onclick="submitNdsReply('${t.id}')">달기</button>
        <div style="clear:both"></div>
      </div>
      <div class="nds-reply-list">${(t.replies||[]).map(r=>`
        <div class="nds-reply-item">
          <span class="nds-reply-nick">${escHtml(r.author)}</span>${escHtml(r.text)}
          <span style="font-size:10px;color:var(--ink-faint);margin-left:6px">${r.date}</span>
        </div>`).join('')}
      </div>
    </div>`).join('');
}
function toggleNdsReply(thoughtId){
  const form=document.getElementById('replyForm_'+thoughtId);
  if(form)form.classList.toggle('open');
}
function submitNdsReply(thoughtId){
  const input=document.getElementById('replyInput_'+thoughtId);
  if(!input||!input.value.trim())return;
  addNewsReply(_currentNewsKey,thoughtId,input.value);
  renderNdsThoughtList();
}

/* ── 내 공간 ── */
function openMySpace(){
  if(!currentUser){openModal('loginModal');return;}
  renderMySpace();
  document.getElementById('mySpaceScreen').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeMySpace(){
  document.getElementById('mySpaceScreen').classList.remove('open');
  document.body.style.overflow='';
}
function renderMySpace(){
  /* 프로필 */
  document.getElementById('mysProfile').innerHTML=`
    <div class="mys-avatar-lg">${cleanNick(currentUser.nick)[0]}</div>
    <div>
      <div class="mys-name">${escHtml(cleanNick(currentUser.nick))}</div>
      <div class="mys-role-badge">${ROLE_LABEL[currentUser.role||'student']||'🎒 학생'}</div>
      <div style="font-size:12px;color:var(--ink-faint);margin-top:4px">가입일 ${currentUser.joinDate||'-'}</div>
    </div>`;
  /* 내가 남긴 뉴스 생각 */
  const all=LS.get('ylife_news_thoughts2')||{};
  const newsData=getNewsData();
  const cards=[];
  Object.entries(all).forEach(([key,thoughts])=>{
    const mine=thoughts.find(t=>t.authorId===currentUser.id);
    if(!mine)return;
    const [cat,idx]=key.split('_');
    const n=(newsData[cat]||[])[+idx];
    if(!n)return;
    const replies=thoughts.flatMap(t=>t.replies||[]).filter(r=>r.authorId!==currentUser.id&&thoughts.find(t=>t.authorId===currentUser.id));
    cards.push({key,cat,n,mine,allThoughts:thoughts,replies});
  });
  const el=document.getElementById('mysThoughtList');
  if(!cards.length){
    el.innerHTML=`<div style="text-align:center;padding:48px;color:var(--ink-faint);font-size:14px">아직 남긴 생각이 없습니다.<br>뉴스를 읽고 첫 생각을 남겨보세요.</div>`;
    return;
  }
  el.innerHTML=cards.map(({key,cat,n,mine,allThoughts,replies})=>`
    <div class="mys-thought-card">
      <div class="mys-thought-news-title" onclick="closeMySpace();openNewsDetail('${cat}',${key.split('_')[1]})">
        [${CAT_LABEL[cat]||cat}] ${escHtml(n.title)}
        <span style="font-size:11px;color:var(--ink-faint);margin-left:4px">${n.date}</span>
      </div>
      <div class="mys-thought-text">${escHtml(mine.text)}</div>
      ${allThoughts.length>1?`<div style="font-size:12px;color:var(--ink-faint);margin-bottom:6px">다른 사람들의 생각 ${allThoughts.length-1}개</div>
      <div class="mys-replies">${allThoughts.filter(t=>t.authorId!==currentUser.id).map(t=>`
        <div class="mys-reply-item"><span class="mys-reply-nick">${escHtml(t.author)}</span>${escHtml(t.text)}</div>`).join('')}
      </div>`:''}
    </div>`).join('');
}
function toggleNewsBody(id,btn){
  const el=document.getElementById(id);
  if(!el) return;
  el.classList.toggle('open');
  btn.textContent=el.classList.contains('open')?'▼ 본문 닫기':'▶ 본문 보기';
}

/* ════════════════════════════════
   모달
════════════════════════════════ */
/* ─── 모바일 드로어 ─── */
function openMobileDrawer(){
  const backdrop=document.getElementById('mobileDrawerBackdrop');
  const drawer=document.getElementById('mobileDrawer');
  backdrop.style.display='block';
  requestAnimationFrame(()=>{
    backdrop.classList.add('open');
    drawer.classList.add('open');
  });
  document.body.style.overflow='hidden';
}
function closeMobileDrawer(){
  const backdrop=document.getElementById('mobileDrawerBackdrop');
  const drawer=document.getElementById('mobileDrawer');
  backdrop.classList.remove('open');
  drawer.classList.remove('open');
  document.body.style.overflow='';
  setTimeout(()=>{backdrop.style.display='none';},300);
}
// 회전 시 드로어 닫기
window.addEventListener('orientationchange',closeMobileDrawer);
window.matchMedia('(orientation:landscape)').addEventListener('change',()=>{
  if(document.getElementById('mobileDrawer').classList.contains('open')) closeMobileDrawer();
});
// ESC 키
document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && document.getElementById('mobileDrawer').classList.contains('open')) closeMobileDrawer();
});

function openModal(id){
  if(id==='settingsModal') initSettingsModal();
  document.getElementById(id).classList.add('open');
  if(id==='loginModal')  { renderGoogleBtn('googleBtnLogin');  setTimeout(()=>renderGoogleBtn('googleBtnLogin'),300); }
  if(id==='signupModal') { renderGoogleBtn('googleBtnSignup'); setTimeout(()=>renderGoogleBtn('googleBtnSignup'),300); }
}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function switchModal(closeId,openId){closeModal(closeId);openModal(openId);}
document.querySelectorAll('.modal-backdrop').forEach(b=>{
  b.addEventListener('click',e=>{if(e.target===b)b.classList.remove('open');});
});

/* ════════════════════════════════
   인증
════════════════════════════════ */
function doLogin(){
  const id=document.getElementById('loginId').value.trim();
  const pw=document.getElementById('loginPw').value;
  const msg=document.getElementById('loginMsg');
  if(!id||!pw){msg.textContent='아이디와 비밀번호를 입력하세요.';return;}
  const users=getUsers();
  const u=users.find(u=>u.id===id&&u.pw===hashPw(pw));
  if(!u){msg.textContent='아이디 또는 비밀번호가 일치하지 않습니다.';return;}
  currentUser=u;
  LS.set('ylife_session',u.id);
  closeModal('loginModal');
  renderHeader();
  renderPlaza();
}
function updateRoleLabel(){
  const role=document.querySelector('input[name="signupRole"]:checked')?.value||'student';
  const hints={
    student:'학생은 아골라·아곤란 모두 참여 가능합니다.',
    adult:'성인은 아골라(토론)만 참여 가능합니다. 아곤란은 인증된 선생님만 참여할 수 있습니다.'
  };
  const el=document.getElementById('roleHint');
  if(el)el.textContent=hints[role]||'';
}
/* 역할 권한 체크 */
function canWriteAgonran(user){
  if(!user)return false;
  const role=user.role||'student';
  return role==='student'||role==='teacher'||role==='admin';
}
function doSignup(){
  const id=document.getElementById('signupId').value.trim();
  const nick=cleanNick(document.getElementById('signupNick').value.trim());
  const pw=document.getElementById('signupPw').value;
  const pw2=document.getElementById('signupPw2').value;
  const msg=document.getElementById('signupMsg');
  if(!id||!nick||!pw){msg.textContent='모든 항목을 입력해주세요.';return;}
  if(id.length<4){msg.textContent='아이디는 4자 이상이어야 합니다.';return;}
  if(pw.length<6){msg.textContent='비밀번호는 6자 이상이어야 합니다.';return;}
  if(pw!==pw2){msg.textContent='비밀번호가 일치하지 않습니다.';return;}
  const users=getUsers();
  if(users.find(u=>u.id===id)){msg.textContent='이미 사용 중인 아이디입니다.';return;}
  const role=document.querySelector('input[name="signupRole"]:checked')?.value||'student';
  const newUser={id,nick,pw:hashPw(pw),role,joinDate:new Date().toLocaleDateString('ko')};
  users.push(newUser);
  LS.set('ylife_users',users);
  currentUser=newUser;
  LS.set('ylife_session',newUser.id);
  pushUserToFirebase(newUser);
  closeModal('signupModal');
  renderHeader();
  renderPlaza();
  updateStats();
}
function doLogout(){
  currentUser=null;
  localStorage.removeItem('ylife_session');
  renderHeader();
  renderPlaza();
}
function hashPw(pw){
  // 간단한 해시 (실제 서버 없이 로컬 저장용)
  let h=0;for(let i=0;i<pw.length;i++){h=Math.imul(31,h)+pw.charCodeAt(i)|0;}return h.toString(36);
}
function restoreSession(){
  const sid=LS.get('ylife_session');
  if(sid){const u=getUsers().find(u=>u.id===sid);if(u){u.nick=cleanNick(u.nick);currentUser=u;}}
}

/* ════════════════════════════════
   헤더 렌더
════════════════════════════════ */
const QUICK_NAV_HTML=`<div class="quick-nav" id="quickNav">
  <button class="quick-nav-btn" onclick="toggleQuickNav()" title="빠른 이동">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  </button>
  <div class="quick-nav-drop" id="quickNavDrop">
    <div class="qn-label">빠른 이동</div>
    <a class="qn-item" onclick="goTo('hwadu')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>오늘의 화두</a>
    <a class="qn-item" onclick="goTo('news')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 9v11"/></svg>뉴스</a>
    <a class="qn-item" onclick="goTo('agora')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>광장 (아골라·아곤란)</a>
    <a class="qn-item" onclick="goTo('bridge')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>인연의 다리</a>
    <a class="qn-item" onclick="goTo('insight')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>베스트 인사이트</a>
    <a class="qn-item" onclick="goTo('editorial')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>에디토리얼</a>
    <a class="qn-item" onclick="goTo('journal')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>시민 저널</a>
    <a class="qn-item" onclick="goTo('builder')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>사이트 빌더</a>
    <a class="qn-item" onclick="goTo('eco')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>생태계</a>
  </div>
</div>`;

const QR_BTN_HTML=`<button class="qr-btn" onclick="openQrPopup()" title="QR 코드로 공유"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/><path d="M14 14h2v2h-2zM18 14h3M18 18h3M14 18v3M14 21h2"/></svg></button>`;
const SETTINGS_BTN_HTML=`<button class="settings-btn" onclick="openModal('settingsModal')" title="설정"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>`;

function renderHeader(){
  const el=document.getElementById('headerActions');
  if(currentUser){
    el.innerHTML=`<div class="user-badge">
      <div class="user-avatar" onclick="openMySpace()" title="내 공간" style="cursor:pointer">${cleanNick(currentUser.nick)[0]}</div>
      <span onclick="openMySpace()" style="cursor:pointer;text-decoration:underline dotted">${escHtml(cleanNick(currentUser.nick))}</span>
      <button class="btn-sm" onclick="doLogout()">로그아웃</button>
    </div>${QR_BTN_HTML}${QUICK_NAV_HTML}${SETTINGS_BTN_HTML}`;
  }else{
    el.innerHTML=`<button class="btn-sm" onclick="openModal('loginModal')">로그인</button>
      <button class="btn-primary" onclick="openModal('signupModal')">가입하기</button>
      ${QR_BTN_HTML}${QUICK_NAV_HTML}${SETTINGS_BTN_HTML}`;
  }
  /* 아골라 버튼 — 일반 학생에겐 힌트 표시 */
  const hint=document.getElementById('agoraStudentHint');
  const writeBtn=document.getElementById('agoraWriteBtn');
  if(hint&&writeBtn){
    const isStudent=currentUser&&(currentUser.role||'student')==='student';
    hint.style.display=isStudent?'block':'none';
    writeBtn.style.opacity=isStudent?'0.55':'1';
    writeBtn.title=isStudent?'아골라 글쓰기는 성인·학생 대표 전용입니다':'';
  }
}

/* ════════════════════════════════
   게시판
════════════════════════════════ */
/* ── 전체화면 글쓰기 광장 ── */
const PWS_META={
  agora:{
    kanji:'議',name:'아골라',hanja:'阿閣羅',
    desc:'깊이를 잃지 않는 토론.<br>답이 아니라 더 좋은 물음을 찾는 곳.',
    tip:'<strong>💡 토론의 마음씨</strong><br>상대의 입장을 먼저 이해하고,<br>내 생각을 솔직하게 담아보세요.',
    color:'agora'
  },
  agonran:{
    kanji:'問',name:'아곤란',hanja:'阿昆蘭',
    desc:'물음에 점수가 매겨지지 않는 곳.<br>서툰 질문이 가장 빛나는 자리.',
    tip:'<strong>💡 질문의 마음씨</strong><br>어떤 질문도 부끄럽지 않아요.<br>궁금한 것을 솔직하게 써보세요.',
    color:'agonran'
  }
};
function openWriteWithHwadu(forum){
  const h=getHwadu();
  openWrite(forum,'', h);  /* 제목 비움 — 화두는 왼쪽 사이드박스에만 표시 */
}
function openWrite(forum,prefix,hwadu){
  if(!currentUser){openModal('loginModal');return;}
  /* 아골라 — 일반 학생 차단 */
  if(forum==='agora'&&!canWriteAgora(currentUser)){
    showAgoraBlockMsg();
    return;
  }
  const m=PWS_META[forum]||PWS_META.agora;
  /* 포럼 정보 세팅 */
  document.getElementById('pwsForum').value=forum;
  document.getElementById('pwsKanji').textContent=m.kanji;
  document.getElementById('pwsSideName').textContent=m.name;
  document.getElementById('pwsSideDesc').innerHTML=m.desc;
  document.getElementById('pwsTip').innerHTML=m.tip;
  document.getElementById('pwsForumName').textContent=m.name;
  const badge=document.getElementById('pwsForumBadge');
  badge.className='pws-forum-badge '+m.color;
  const side=document.getElementById('pwsSide');
  side.className='pws-side '+m.color;
  /* 화두 박스 */
  const hwaduBox=document.getElementById('pwsHwaduBox');
  if(hwadu&&hwadu.text){
    document.getElementById('pwsHwaduText').textContent=hwadu.text;
    document.getElementById('pwsHwaduMeta').textContent=hwadu.by||'';
    hwaduBox.style.display='block';
  }else{
    hwaduBox.style.display='none';
  }
  /* 아곤란 접근 권한 체크 */
  const denied=document.getElementById('pwsAccessDenied');
  const editorInner=document.getElementById('pwsEditorInner');
  const aiBar=document.getElementById('pwsAiBar');
  const pwsSubmitBtn=document.querySelector('.pws-submit');
  if(forum==='agonran'&&!canWriteAgonran(currentUser)){
    denied.style.display='flex';
    editorInner.style.display='none';
    if(aiBar)aiBar.style.display='none';
    if(pwsSubmitBtn)pwsSubmitBtn.style.display='none';
  }else{
    denied.style.display='none';
    editorInner.style.display='block';
    if(aiBar)aiBar.style.display='flex';
    if(pwsSubmitBtn)pwsSubmitBtn.style.display='';
  }
  /* 에디터 초기화 */
  document.getElementById('pwsTitle').value=prefix||'';
  document.getElementById('pwsTitle').placeholder=hwadu
    ?'이 화두에 대한 나의 생각 (제목)'
    :'제목을 입력하세요';
  autoResizeTitle(document.getElementById('pwsTitle'));
  document.getElementById('pwsBody').value='';
  document.getElementById('pwsErrMsg').textContent='';
  document.getElementById('pwsCharCount').textContent='0자';
  discardPwsAiResult();
  /* 최근 글 로드 */
  renderPwsRecentList(forum);
  /* 열기 */
  const scr=document.getElementById('plazaWriteScreen');
  scr.classList.add('open');
  document.body.style.overflow='hidden';
  setTimeout(()=>document.getElementById('pwsBody').focus(),200);
}
function closePlazaWrite(){
  document.getElementById('plazaWriteScreen').classList.remove('open');
  document.body.style.overflow='';
}
function renderPwsRecentList(forum){
  /* 스크랩 전체 (모든 창 자동 저장) + 이번 포럼 글 병합 */
  const scraps = getMyScraps();
  /* 이번 포럼 글도 스크랩에 없으면 포함 */
  const me = currentUser;
  const forumPosts = getPosts(forum).filter(p=>!me||p.author===me.nick||p.authorId===me.id);
  forumPosts.forEach(p=>{
    if(!scraps.find(s=>s.sourceId==='post_'+p.id)){
      scraps.push({id:'fp_'+p.id,type:'post',title:p.title,body:p.body,
        source:{agora:'아골라',agonran:'아곤란'}[p.forum]||p.forum,
        sourceId:'post_'+p.id,date:p.date,ts:0});
    }
  });
  scraps.sort((a,b)=>(b.ts||0)-(a.ts||0));

  const total = scraps.length;
  const shown = scraps.slice(0,15);

  const countEl = document.getElementById('pwsPostCount');
  const bookEl  = document.getElementById('pwsBookCount');
  if(countEl) countEl.textContent = total+'편';
  if(bookEl)  bookEl.textContent  = total+'편 저장됨';
  const viewAllBtn = document.getElementById('pwsViewAllBtn');
  if(viewAllBtn) viewAllBtn.style.display = total>6 ? 'block' : 'none';

  const el = document.getElementById('pwsRecentList');
  if(!el) return;
  if(!total){
    el.innerHTML = `<div class="pws-no-posts">
      <div class="pws-no-posts-icon">✍️</div>
      <div class="pws-no-posts-text">아직 기록이 없습니다.<br>글을 쓰면 여기에 자동으로 저장됩니다.</div>
    </div>`;
    return;
  }

  el.innerHTML = shown.map(s=>{
    const snippet = (s.body||'').replace(/\n/g,' ').slice(0,42);
    const typeIcon = {post:'📝',thought:'💭',reply:'↩️'}[s.type]||'📄';
    return `<div class="pws-recent-item" onclick="viewPwsScrap('${escHtml(s.id)}')">
      <div class="pws-recent-item-title">${typeIcon} ${escHtml(s.title||'(제목 없음)')}</div>
      ${snippet?`<div class="pws-recent-item-body">${escHtml(snippet)}…</div>`:''}
      <div class="pws-recent-item-meta">
        <span class="pws-recent-item-date">${s.date||''}</span>
        <span class="pws-recent-item-forum">${escHtml(s.source||'')}</span>
      </div>
    </div>`;
  }).join('');
}

function viewPwsScrap(id){
  const all = getMyScraps();
  /* 포럼 글도 찾기 */
  let s = all.find(x=>x.id===id);
  if(!s){
    const pid = id.replace('fp_','');
    const p = allPosts().find(x=>x.id===pid);
    if(!p) return;
    s = {title:p.title, body:p.body, source:{agora:'아골라',agonran:'아곤란'}[p.forum]||p.forum, date:p.date};
  }
  document.getElementById('pwsPostViewTitle').textContent = s.title||'';
  document.getElementById('pwsPostViewBody').textContent  = s.body||'';
  document.getElementById('pwsPostViewDate').textContent  = s.date||'';
  document.getElementById('pwsPostViewForum').textContent = s.source||'';
  document.getElementById('pwsPostView').classList.add('open');
}
function viewPwsPost(id){ viewPwsScrap('fp_'+id); }

function viewPwsPost(id){
  const all = allPosts();
  const p = all.find(x=>x.id===id);
  if(!p) return;
  const forumLabel = {agora:'아골라', agonran:'아곤란'}[p.forum] || p.forum;
  document.getElementById('pwsPostViewTitle').textContent = p.title||'';
  document.getElementById('pwsPostViewBody').textContent  = p.body||'';
  document.getElementById('pwsPostViewDate').textContent  = p.date||'';
  document.getElementById('pwsPostViewForum').textContent = forumLabel;
  document.getElementById('pwsPostView').classList.add('open');
}
function closePwsPostView(){
  document.getElementById('pwsPostView').classList.remove('open');
}
function openMyBook(){
  /* 전체 기록 보기 — 현재는 내 공간으로 이동 */
  closePlazaWrite();
  setTimeout(()=>openMySpace(), 200);
}
function autoResizeTitle(el){
  el.style.height='auto';
  el.style.height=el.scrollHeight+'px';
}
function updateCharCount(){
  const v=document.getElementById('pwsBody').value;
  document.getElementById('pwsCharCount').textContent=v.length.toLocaleString()+'자';
}
/* 마지막 게시 시각 (도배 방지) */
let _lastPostTs = 0;

function doPlazaSubmit(){
  if(!currentUser)return;
  const rawTitle=document.getElementById('pwsTitle').value.trim();
  const rawBody=document.getElementById('pwsBody').value.trim();
  const forum=document.getElementById('pwsForum').value;
  const err=document.getElementById('pwsErrMsg');

  /* 입력 검증 */
  if(!rawTitle){err.textContent='제목을 입력해주세요.';return;}
  if(!rawBody){err.textContent='내용을 입력해주세요.';return;}
  if(rawTitle.length>200){err.textContent='제목은 200자 이내로 작성해주세요.';return;}
  if(rawBody.length>5000){err.textContent='내용은 5000자 이내로 작성해주세요.';return;}

  /* 도배 방지: 30초에 한 번만 */
  const now=Date.now();
  if(now-_lastPostTs<30000){
    const remain=Math.ceil((30000-(now-_lastPostTs))/1000);
    err.textContent=`잠깐! ${remain}초 후에 다시 올릴 수 있어요.`;
    return;
  }

  /* XSS 방지: HTML 태그 제거 */
  const title=rawTitle.replace(/<[^>]*>/g,'').substring(0,200);
  const body=rawBody.replace(/<[^>]*>/g,'').substring(0,5000);

  err.textContent='';
  _lastPostTs=now;

  const newId=makePostId();
  const today=new Date().toLocaleDateString('ko');
  const newPost={
    id:newId,forum,title,body,
    author:cleanNick(currentUser.nick),authorId:currentUser.id,
    date:today,ts:now,likes:[],comments:[],views:0
  };
  const posts=allPosts();
  posts.unshift(newPost);
  LS.set('ylife_posts',posts);
  autoScrap('post',{title,body,source:{agora:'아골라',agonran:'아곤란'}[forum]||forum,sourceId:'post_'+newId,date:today});
  /* Firebase 즉시 업로드 */
  pushPostToFirebase(newPost);
  closePlazaWrite();
  renderPlaza();updateStats();updateInsights();
  setTimeout(()=>document.getElementById('agora')?.scrollIntoView({behavior:'smooth'}),100);
}
/* AI 보조 (기존 Gemini 키 재사용) */
async function pwsAiAssist(cmd){
  const body=document.getElementById('pwsBody').value.trim();
  if(!body){document.getElementById('pwsErrMsg').textContent='먼저 내용을 입력해주세요.';return;}
  const loading=document.getElementById('pwsAiLoading');
  loading.style.display='inline';
  discardPwsAiResult();
  const PROMPTS={
    polish:'아래 글을 더 자연스럽고 읽기 좋게 다듬어주세요. 원래 의미는 유지하세요.\n\n',
    spell:'아래 글의 맞춤법과 문장 부호를 교정해주세요.\n\n',
    expand:'아래 글의 핵심 주장을 유지하면서 내용을 더 풍부하게 확장해주세요.\n\n',
    summary:'아래 글을 3문장 이내로 핵심만 요약해주세요.\n\n',
    formal:'아래 글을 격식 있는 문어체로 바꿔주세요.\n\n'
  };
  const prompt=(PROMPTS[cmd]||PROMPTS.polish)+body;
  try{
    const key=LS.get('ylife_gemini_key')||'';
    if(!key){
      document.getElementById('pwsErrMsg').textContent='Gemini API 키가 없습니다. 원래 글쓰기 창에서 키를 먼저 저장해주세요.';
      loading.style.display='none';return;
    }
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
    });
    const d=await res.json();
    const text=d?.candidates?.[0]?.content?.parts?.[0]?.text||'결과 없음';
    document.getElementById('pwsAiResultText').textContent=text;
    document.getElementById('pwsAiResult').style.display='block';
  }catch(e){
    document.getElementById('pwsErrMsg').textContent='AI 오류: '+e.message;
  }
  loading.style.display='none';
}
function applyPwsAiResult(){
  const text=document.getElementById('pwsAiResultText').textContent;
  document.getElementById('pwsBody').value=text;
  updateCharCount();
  discardPwsAiResult();
}
function discardPwsAiResult(){
  document.getElementById('pwsAiResult').style.display='none';
  document.getElementById('pwsAiResultText').textContent='';
}
function doSubmitPost(){
  if(!currentUser)return;
  const title=cleanUserText(document.getElementById('writeTitle').value,40);
  const body=cleanUserText(document.getElementById('writeBody').value,1200);
  const forum=document.getElementById('writeForum').value;
  const msg=document.getElementById('writeMsg');
  if(!validatePostBeforeSave(title,body,msg)) return;
  const now=Date.now();
  if(now-_lastPostTs<30000){
    const remain=Math.ceil((30000-(now-_lastPostTs))/1000);
    msg.textContent=`잠깐! ${remain}초 후에 다시 올릴 수 있어요.`;
    return;
  }
  _lastPostTs=now;
  const posts=allPosts();
  const post=sanitizePostForSave({
    id:makePostId(),forum,title,body,
    author:cleanNick(currentUser.nick),authorId:currentUser.id,
    date:new Date().toLocaleDateString('ko'),ts:now,likes:[],comments:[],views:0
  });
  posts.unshift(post);
  savePostsFiltered(posts);
  pushPostToFirebase(post);
  closeModal('writeModal');
  renderPlaza();updateStats();updateInsights();
}
/* ── 전체 화면 광장 열기/닫기 ── */
let _apmAllPosts = [];  // 현재 포럼의 전체 글 캐시
let _apmPollTimer = null; // 자동 새로고침 타이머

function openAllPosts(forum){
  window._apmForum = forum;
  const isAgora = forum === 'agora';
  const modal   = document.getElementById('allPostsModal');
  const header  = document.getElementById('apmHeader');
  const kanji   = document.getElementById('apmKanji');
  const title   = document.getElementById('apmTitle');
  const sub     = document.getElementById('apmSub');
  const writeBtn= document.getElementById('apmWriteBtn');
  const search  = document.getElementById('apmSearch');

  // 헤더 색상
  header.className = 'apm-header ' + (isAgora ? 'agora-hd' : 'agonran-hd');
  kanji.textContent = isAgora ? '議' : '問';
  title.textContent = isAgora ? '아골라' : '아곤란';
  sub.textContent   = isAgora ? '성인 토론의 마당' : '학생 질문의 마당';
  writeBtn.className= 'apm-write-btn' + (isAgora ? '' : ' agonran');
  writeBtn.textContent = isAgora ? '토론 글쓰기' : '질문 올리기';

  // 글쓰기 권한 체크
  const canWrite = isAgora ? (currentUser && canWriteAgora(currentUser)) : !!currentUser;
  writeBtn.style.display = canWrite ? '' : 'none';

  // 검색창 초기화
  if(search) search.value = '';

  // 글 목록 렌더
  _apmAllPosts = getPosts(forum);
  renderApmList(_apmAllPosts);

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';  // 뒷 페이지 스크롤 막기

  // 7초마다 자동으로 Firebase에서 새 글 당겨오기
  if(_apmPollTimer) clearInterval(_apmPollTimer);
  _apmPollTimer = setInterval(async ()=>{
    const added = await syncFromFirebase(false);
    if(added > 0){
      // 새 글이 있을 때만 목록 갱신
      const search = document.getElementById('apmSearch');
      _apmAllPosts = getPosts(window._apmForum);
      const q = search ? search.value.trim().toLowerCase() : '';
      if(q){
        const filtered = _apmAllPosts.filter(p=>
          (p.title||'').toLowerCase().includes(q)||
          (p.body||'').toLowerCase().includes(q)||
          (p.author||'').toLowerCase().includes(q)
        );
        renderApmList(filtered);
      } else {
        renderApmList(_apmAllPosts);
      }
      renderPlaza();
    }
  }, 7000);
}

function renderApmList(posts){
  const listEl  = document.getElementById('apmList');
  const countEl = document.getElementById('apmCount');
  countEl.textContent = '글 ' + posts.length + '편';
  if(!posts.length){
    listEl.innerHTML = '<div class="apm-empty">아직 글이 없습니다.<br>첫 번째 생각을 나눠보세요.</div>';
    return;
  }
  listEl.innerHTML = posts.map((p, i) => `
    <div class="apm-item" onclick="openPost('${p.id}')">
      <div class="apm-item-num">${posts.length - i}</div>
      <div class="apm-item-body">
        <div class="apm-item-title">${escHtml(safePreviewText(p.title,60))}</div>
        <div class="apm-item-preview">${escHtml(safePreviewText(p.body||'',120))}</div>
        <div class="apm-item-meta">
          <span>${escHtml(p.author||'익명')}</span>
          <span>${p.date||''}</span>
          ${(p.comments||[]).length ? `<span>💬 ${(p.comments||[]).length}</span>` : ''}
          ${(p.likes||[]).length ? `<span>♡ ${(p.likes||[]).length}</span>` : ''}
        </div>
      </div>
    </div>`).join('');
}

function filterApmList(keyword){
  const q = keyword.trim().toLowerCase();
  if(!q){ renderApmList(_apmAllPosts); return; }
  const filtered = _apmAllPosts.filter(p =>
    (p.title||'').toLowerCase().includes(q) ||
    (p.body||'').toLowerCase().includes(q) ||
    (p.author||'').toLowerCase().includes(q)
  );
  renderApmList(filtered);
}

function closeAllPosts(){
  const modal = document.getElementById('allPostsModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  if(_apmPollTimer){ clearInterval(_apmPollTimer); _apmPollTimer=null; }
}

function closeAllPostsOnBg(e){
  if(e.target === document.getElementById('allPostsModal')) closeAllPosts();
}

function renderPlaza(){
  renderForum('agora','agoraList');
  renderForum('agonran','agonranList');
}
function renderForum(forum,listId){
  const el=document.getElementById(listId);
  const posts=getPosts(forum).slice(0,8);
  if(!posts.length){el.innerHTML=`<div class="post-empty">${forum==='agora'?'첫 번째 글을 남겨보세요':'첫 번째 생각을 나눠보세요'}</div>`;return;}
  el.innerHTML=posts.map(p=>`
    <div class="post-item" onclick="openPost('${p.id}')">
      <div class="post-title">${escHtml(safePreviewText(p.title,60))}</div>
      <div class="post-meta">
        <span class="post-meta-item">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          ${escHtml(displayNick(p.author,p.authorId))}
        </span>
        <span class="post-meta-item">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${p.date}
        </span>
        <span class="post-meta-item">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${(p.likes||[]).length}
        </span>
        <span class="post-meta-item">
          <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          ${(p.comments||[]).length}
        </span>
      </div>
    </div>
  `).join('');
}
function openPost(id){
  const posts=allPosts();
  const p=posts.find(x=>x.id===id);
  if(!p)return;
  currentPostId=id;
  // 조회수
  p.views=(p.views||0)+1;
  LS.set('ylife_posts',posts);
  document.getElementById('postDetailTitle').textContent=p.title;
  document.getElementById('postDetailMeta').textContent=`${displayNick(p.author,p.authorId)} · ${p.date} · 조회 ${p.views}`;
  document.getElementById('postDetailBody').textContent=p.body;
  const liked=currentUser&&p.likes.includes(currentUser.id);
  const lb=document.getElementById('likeBtn');
  lb.className='like-btn'+(liked?' liked':'');
  document.getElementById('likeCount').textContent=(p.likes||[]).length;
  renderComments(p);
  openModal('postModal');
}
function toggleLike(){
  if(!currentUser){openModal('loginModal');return;}
  const posts=allPosts();
  const p=posts.find(x=>x.id===currentPostId);
  if(!p)return;
  if(!Array.isArray(p.likes)) p.likes=[];
  const idx=p.likes.indexOf(currentUser.id);
  if(idx>-1)p.likes.splice(idx,1);else p.likes.push(currentUser.id);
  LS.set('ylife_posts',posts);
  const liked=p.likes.includes(currentUser.id);
  document.getElementById('likeBtn').className='like-btn'+(liked?' liked':'');
  document.getElementById('likeCount').textContent=(p.likes||[]).length;
  updateInsights();
}
function renderComments(p){
  const list=document.getElementById('commentList');
  const comments=(p&&Array.isArray(p.comments))?p.comments:[];
  document.getElementById('commentCount').textContent=comments.length;
  if(!comments.length){list.innerHTML='<div style="font-size:13px;color:var(--ink-faint);padding:8px 0">아직 댓글이 없습니다.</div>';return;}
  list.innerHTML=comments.map(c=>`
    <div class="comment-item">
      <div class="comment-nick">${escHtml(displayNick(c.author,c.authorId))}</div>
      <div class="comment-text">${escHtml(c.text)}</div>
      <div class="comment-date">${c.date}</div>
    </div>
  `).join('');
}
function doAddComment(){
  if(!currentUser){openModal('loginModal');return;}
  const inp=document.getElementById('commentInput');
  const text=cleanUserText(inp.value,300);
  if(!text)return;
  if(!validateCommentBeforeSave(text)) return;
  const posts=allPosts();
  const p=posts.find(x=>x.id===currentPostId);
  if(!p)return;
  if(!Array.isArray(p.comments)) p.comments=[];
  p.comments.push({author:cleanNick(currentUser.nick),authorId:currentUser.id,text,date:new Date().toLocaleDateString('ko'),ts:Date.now()});
  savePostsFiltered(posts);
  pushPostToFirebase(p);
  inp.value='';
  renderComments(p);renderPlaza();
}

/* ════════════════════════════════
   통계 업데이트
════════════════════════════════ */
function updateStats(){
  document.getElementById('statUsers').textContent=getUsers().length;
  document.getElementById('statPosts').textContent=allPosts().length;
}
function updateInsights(){
  const posts=allPosts().sort((a,b)=>(b.likes||[]).length-(a.likes||[]).length).slice(0,3);
  const el=document.getElementById('insightList');
  if(!posts.length){el.innerHTML='<div class="post-empty" style="color:#fff">아직 인사이트가 없습니다. 광장에서 첫 글을 남겨보세요.</div>';return;}
  el.innerHTML=posts.map((p,i)=>`
    <div class="insight-item" onclick="openPost('${p.id}')" style="cursor:pointer">
      <div class="insight-rank">${i+1}</div>
      <div class="insight-content">
        <div class="insight-title">${escHtml(p.title)}</div>
        <div class="insight-by">${escHtml(displayNick(p.author,p.authorId))} · 공감 ${(p.likes||[]).length} · ${CAT_LABEL[p.forum]||p.forum}</div>
      </div>
    </div>
  `).join('');
}

/* ════════════════════════════════
   화두 렌더
════════════════════════════════ */
/* ── 주차 계산 유틸 ── */
function getISOWeek(d){
  const date=new Date(d);
  date.setHours(0,0,0,0);
  date.setDate(date.getDate()+3-(date.getDay()+6)%7);
  const week1=new Date(date.getFullYear(),0,4);
  return [date.getFullYear(), 1+Math.round(((date-week1)/86400000-3+(week1.getDay()+6)%7)/7)];
}
function getWeekKey(d){
  const [y,w]=getISOWeek(d||new Date());
  return `${y}-W${String(w).padStart(2,'0')}`;
}
function weekKeyToLabel(k){
  if(!k)return'';
  const [y,w]=k.split('-W');
  return `${y}년 ${w}주차`;
}
/* ── 화두 자동 적용 (주차 매칭) ── */
function autoApplyWeeklyHwadu(){
  const thisWeek=getWeekKey();
  const list=getHwaduList();
  const match=list.find(h=>h.week===thisWeek);
  if(match){
    const cur=getHwadu();
    if(cur.text!==match.text){
      LS.set('ylife_hwadu',{text:match.text,by:match.by||''});
    }
  }
}
function renderHwadu(){
  autoApplyWeeklyHwadu();
  const h=getHwadu();
  const el=document.getElementById('hwaduText');
  const by=document.getElementById('hwaduBy');
  const lbl=document.getElementById('hwaduWeekLabel');
  if(el)el.textContent=h.text;
  if(by)by.textContent=h.by;
  if(lbl){
    const [y,w]=getISOWeek(new Date());
    lbl.textContent=`THIS WEEK · ${y}년 ${w}주차`;
  }
}

/* ════════════════════════════════
   비밀의 문 — 안정화 버전
   1) 緣 3번 클릭
   2) Ctrl + Alt + A
   3) 주소 끝에 #admin 입력
════════════════════════════════ */
let logoClicks=[];
function openAdminSecretDoor(){
  const modal=document.getElementById('adminLoginModal');
  const input=document.getElementById('adminPwInput');
  const msg=document.getElementById('adminLoginMsg');
  if(!modal){alert('관리자 로그인 창을 찾지 못했습니다. index.html을 다시 확인해 주세요.');return;}
  openModal('adminLoginModal');
  if(input){input.value='';setTimeout(()=>input.focus(),80);}
  if(msg)msg.textContent='';
}
function showSecretHint(text){
  const hint=document.getElementById('secretHint');
  if(!hint) return;
  hint.textContent=text||'緣 클릭 중... 관리자 모드';
  hint.classList.add('show');
  clearTimeout(hint._t);
  hint._t=setTimeout(()=>hint.classList.remove('show'),1500);
}
function bindSecretDoor(){
  const kanji=document.getElementById('logoKanji');
  if(kanji && !kanji.dataset.adminBound){
    kanji.dataset.adminBound='1';
    kanji.style.cursor='pointer';
    kanji.title='비밀의 문: 빠르게 3번 클릭';
    kanji.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      const now=Date.now();
      logoClicks=logoClicks.filter(t=>now-t<2500);
      logoClicks.push(now);
      showSecretHint(`관리자 문 ${logoClicks.length}/3`);
      if(logoClicks.length>=3){
        logoClicks=[];
        openAdminSecretDoor();
      }
    },true);
  }
}
bindSecretDoor();
document.addEventListener('DOMContentLoaded',bindSecretDoor);
document.addEventListener('keydown',function(e){
  if(e.ctrlKey && e.altKey && String(e.key).toLowerCase()==='a'){
    e.preventDefault();
    openAdminSecretDoor();
  }
});
window.addEventListener('hashchange',function(){
  if(location.hash==='#admin') openAdminSecretDoor();
});
if(location.hash==='#admin') setTimeout(openAdminSecretDoor,300);

/* ════════════════════════════════
   관리자 로그인
════════════════════════════════ */
/* 비밀번호 보기/숨기기 토글 */
function toggleAdminPwView(){
  const inp=document.getElementById('adminPwInput');
  const btn=document.getElementById('adminPwEyeBtn');
  if(inp.type==='password'){inp.type='text';btn.textContent='🙈';}
  else{inp.type='password';btn.textContent='👁';}
}
/* 한글·대문자 → 영문 소문자 자동 변환 */
function adminPwAutoFix(el){
  const pos=el.selectionStart;
  const fixed=el.value
    .replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g,'')  /* 한글 제거 */
    .toLowerCase();                        /* 대문자 → 소문자 */
  if(el.value!==fixed){
    el.value=fixed;
    el.setSelectionRange(pos,pos);
  }
}
function getAdminPw(){return LS.get('ylife_admin_pw')||'yeon2026';}
function doAdminLogin(){
  const pw=document.getElementById('adminPwInput').value;
  if(pw==='yeon2026'||pw===getAdminPw()){
    /* 마스터키로 들어온 경우 localStorage 초기화 */
    if(pw==='yeon2026') LS.set('ylife_admin_pw','yeon2026');
    adminLoggedIn=true;
    closeModal('adminLoginModal');
    openAdminDashboard();
  }else{
    document.getElementById('adminLoginMsg').textContent='비밀번호가 틀렸습니다.';
  }
}
let _adminSyncTimer = null;
function openAdminDashboard(){
  loadAdminDashboard();
  document.getElementById('adminOverlay').classList.add('open');
  // 30초마다 자동 동기화
  _adminSyncTimer = setInterval(async ()=>{
    await syncFromFirebase(false);
    await syncUsersFromFirebase();
    loadAdminDashboard();
    const active = document.querySelector('.admin-panel.active');
    if(active && active.id==='panel-user-mgmt') loadUserMgmt();
  }, 30000);
}
function closeAdmin(){
  document.getElementById('adminOverlay').classList.remove('open');
  if(_adminSyncTimer){ clearInterval(_adminSyncTimer); _adminSyncTimer=null; }
}
function showAdminPanel(id,el){
  document.querySelectorAll('.admin-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  el.classList.add('active');
  if(id==='news-mgmt')loadNewsMgmt();
  if(id==='post-mgmt')loadPostMgmt();
  if(id==='user-mgmt')loadUserMgmt();
  if(id==='hwadu-mgmt')loadHwaduMgmt();
  if(id==='site-builder'){const ifr=document.getElementById('builderIframe');if(!ifr.src||ifr.src==='about:blank'||ifr.src==='')ifr.src='builder.html';}
}
function loadAdminDashboard(){
  const users=getUsers();
  const posts=allPosts();
  document.getElementById('adminStatGrid').innerHTML=`
    <div class="admin-stat"><div class="admin-stat-num">${users.length}</div><div class="admin-stat-label">전체 회원</div></div>
    <div class="admin-stat"><div class="admin-stat-num">${posts.length}</div><div class="admin-stat-label">전체 글</div></div>
    <div class="admin-stat"><div class="admin-stat-num">${posts.filter(p=>p.forum==='agora').length}</div><div class="admin-stat-label">아골라</div></div>
    <div class="admin-stat"><div class="admin-stat-num">${posts.filter(p=>p.forum==='agonran').length}</div><div class="admin-stat-label">아곤란</div></div>
    <div class="admin-stat"><div class="admin-stat-num">${posts.reduce((s,p)=>s+(p.likes||[]).length,0)}</div><div class="admin-stat-label">총 공감</div></div>
    <div class="admin-stat"><div class="admin-stat-num">${posts.reduce((s,p)=>s+(p.comments||[]).length,0)}</div><div class="admin-stat-label">총 댓글</div></div>
  `;
  const recent=posts.slice(0,10);
  document.getElementById('adminRecentPosts').innerHTML=recent.length?`
    <table class="admin-table">
      <thead><tr><th>제목</th><th>작성자</th><th>광장</th><th>날짜</th><th>공감</th></tr></thead>
      <tbody>${recent.map(p=>`<tr><td>${escHtml(safePreviewText(p.title||'',60))}</td><td>${escHtml(displayNick(p.author,p.authorId))}</td><td>${p.forum||''}</td><td>${p.date||''}</td><td>${(p.likes||[]).length}</td></tr>`).join('')}</tbody>
    </table>`:'<p style="color:var(--ink-faint);font-size:13px">아직 게시글이 없습니다.</p>';
}
function loadNewsMgmt(){
  const cats=Object.keys(CAT_LABEL);
  document.getElementById('newsMgmtTabs').innerHTML=cats.map(c=>`
    <button class="news-tab ${c===currentNewsMgmtCat?'active':''}" onclick="switchNewsMgmtCat('${c}',this)">${CAT_LABEL[c]}</button>
  `).join('');
  renderNewsMgmtContent();
}
function switchNewsMgmtCat(cat,el){
  currentNewsMgmtCat=cat;
  document.querySelectorAll('#newsMgmtTabs .news-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderNewsMgmtContent();
}
function renderNewsMgmtContent(){
  const data=_pendingNews||getNewsData();
  const items=data[currentNewsMgmtCat]||[];
  document.getElementById('newsMgmtContent').innerHTML=`<div class="news-edit-list" id="newsEditList">${
    items.map((n,i)=>`<div class="news-edit-item" data-idx="${i}">
      <input type="text" value="${escHtml(n.title)}" placeholder="뉴스 제목" onchange="updateNewsItem(${i},'title',this.value)">
      <input type="text" value="${n.date}" placeholder="날짜" onchange="updateNewsItem(${i},'date',this.value)">
      <div class="news-edit-actions">
        <button class="btn-danger" onclick="deleteNewsItem(${i})">삭제</button>
      </div>
    </div>`).join('')
  }</div>`;
}
let _pendingNews=null;
function updateNewsItem(idx,field,val){
  if(!_pendingNews)_pendingNews=JSON.parse(JSON.stringify(getNewsData()));
  _pendingNews[currentNewsMgmtCat][idx][field]=val;
}
function deleteNewsItem(idx){
  if(!_pendingNews)_pendingNews=JSON.parse(JSON.stringify(getNewsData()));
  _pendingNews[currentNewsMgmtCat].splice(idx,1);
  renderNewsMgmtContent();
}
function adminAddNews(){
  if(!_pendingNews)_pendingNews=JSON.parse(JSON.stringify(getNewsData()));
  const today=new Date();
  const dateStr=today.getFullYear()+'.'+(String(today.getMonth()+1).padStart(2,'0'))+'.'+String(today.getDate()).padStart(2,'0');
  _pendingNews[currentNewsMgmtCat].push({title:'새 뉴스 제목',date:dateStr,thought:'',url:''});
  renderNewsMgmtContent();
  /* 새로 추가된 항목으로 스크롤 */
  setTimeout(()=>{
    const list=document.getElementById('newsEditList');
    if(list)list.lastElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'});
  },80);
}
function saveNews(){
  if(_pendingNews){LS.set('ylife_news',_pendingNews);_pendingNews=null;}
  renderNews();
  alert('뉴스가 저장되었습니다.');
}
async function batchGenerateImages(){
  const key=LS.get('ylife_gemini_key')||'';
  if(!key){
    alert('Gemini API 키를 먼저 설정에서 입력해주세요.');return;
  }
  const btn=document.getElementById('batchImgBtn');
  const status=document.getElementById('batchImgStatus');
  const data=JSON.parse(JSON.stringify(getNewsData()));
  const cats=Object.keys(data);
  let total=0,done=0,skipped=0;
  /* 이미지 없는 항목 수 파악 */
  cats.forEach(cat=>data[cat].forEach(n=>{if(!n.img)total++;}));
  if(total===0){status.textContent='모든 뉴스에 이미지가 있습니다.';return;}
  btn.disabled=true;
  btn.textContent='⏳ 생성 중...';
  status.textContent=`0 / ${total} 생성 중...`;
  for(const cat of cats){
    for(let i=0;i<data[cat].length;i++){
      const n=data[cat][i];
      if(n.img){skipped++;continue;}
      status.textContent=`${done} / ${total} — "${n.title.slice(0,16)}..."`;
      try{
        const url=await generateNewsImage(n.title,cat);
        if(url){data[cat][i].img=url;done++;}
        else{done++;} /* 실패해도 건너뜀 */
      }catch{done++;}
      /* 1초 간격 (API rate limit 방지) */
      await new Promise(r=>setTimeout(r,1000));
    }
  }
  LS.set('ylife_news',data);
  renderNews();
  btn.disabled=false;
  btn.textContent='✦ 이미지 일괄 생성';
  status.textContent=`✓ ${done}개 생성 완료! (${skipped}개 이미 있음)`;
}
function loadPostMgmt(){renderPostMgmtTable();}
let postMgmtSpamOnly=false;
let adminSelectedPostIds=new Set();
function switchPostMgmtTab(forum){
  currentPostMgmtForum=forum;
  adminSelectedPostIds.clear();
  document.querySelectorAll('[id^="postMgmtTab-"]').forEach(t=>t.classList.remove('active'));
  document.getElementById('postMgmtTab-'+forum).classList.add('active');
  const detail=document.getElementById('postMgmtDetail');
  if(detail){detail.classList.remove('open');detail.innerHTML='';}
  renderPostMgmtTable();
}
function jsArg(v){return String(v||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ');}
function shortText(v,n){return safePreviewText(v,n||80);}
function isAdminSuspiciousText(text){
  const s=cleanUserText(text,1600).trim();
  if(!s) return true;
  const compact=s.replace(/\s+/g,'');
  if(compact.length<2) return true;
  if(hasTooMuchRepeat(compact)) return true;
  if(/[a-zA-Z]{40,}/.test(compact)) return true;
  if(hasTooManySymbols(compact)) return true;
  if(!hasMeaningfulContent(compact,3)) return true;
  return false;
}
function isAdminSuspiciousPost(p){const comments=Array.isArray(p?.comments)?p.comments:[];return isAdminSuspiciousText(p?.title||'')||isAdminSuspiciousText(p?.body||'')||comments.some(c=>isAdminSuspiciousText(c.text));}
function adminToggleSpamOnly(){postMgmtSpamOnly=!postMgmtSpamOnly;const btn=document.getElementById('postMgmtSpamBtn');if(btn) btn.textContent=postMgmtSpamOnly?'전체 글 보기':'의심글만 보기';renderPostMgmtTable();}
function forumLabel(forum){return forum==='agora'?'아골라':(forum==='agonran'?'아곤란':(forum||'-'));}
function getPostMgmtSource(){const posts=currentPostMgmtForum==='all'?allPosts():getPosts(currentPostMgmtForum);return posts.slice().sort((a,b)=>(b.ts||0)-(a.ts||0)||String(b.date||'').localeCompare(String(a.date||''))||String(b.id||'').localeCompare(String(a.id||'')));}
function getPostMgmtFilteredPosts(){
  const q=(document.getElementById('postMgmtSearch')?.value||'').trim().toLowerCase();
  let posts=getPostMgmtSource();
  if(q){posts=posts.filter(p=>(p.title||'').toLowerCase().includes(q)||(p.body||'').toLowerCase().includes(q)||displayNick(p.author,p.authorId).toLowerCase().includes(q)||forumLabel(p.forum).toLowerCase().includes(q));}
  if(postMgmtSpamOnly) posts=posts.filter(isAdminSuspiciousPost);
  return posts;
}
function adminToggleSelectPost(id,checked){if(checked) adminSelectedPostIds.add(id); else adminSelectedPostIds.delete(id); updateAdminSelectionCount();}
function adminToggleSelectVisible(checked){getPostMgmtFilteredPosts().forEach(p=>{if(checked) adminSelectedPostIds.add(p.id); else adminSelectedPostIds.delete(p.id);});renderPostMgmtTable();}
function updateAdminSelectionCount(){const el=document.getElementById('adminSelectionCount');if(el) el.textContent=adminSelectedPostIds.size+'개 선택됨';}
function adminAutoSelectSuspiciousPosts(){
  const targets=getPostMgmtFilteredPosts().filter(isAdminSuspiciousPost);
  targets.forEach(p=>adminSelectedPostIds.add(p.id));
  postMgmtSpamOnly=true;
  const btn=document.getElementById('postMgmtSpamBtn'); if(btn) btn.textContent='전체 글 보기';
  renderPostMgmtTable(); alert('의심글 '+targets.length+'개를 자동 선택했습니다. 확인 후 [선택 삭제]를 누르세요.');
}
function renderPostMgmtTable(){
  const posts=getPostMgmtFilteredPosts();
  const basePosts=getPostMgmtSource();
  const suspiciousCount=basePosts.filter(isAdminSuspiciousPost).length;
  const scopeLabel=currentPostMgmtForum==='all'?'전체':forumLabel(currentPostMgmtForum);
  const allVisibleSelected=posts.length && posts.every(p=>adminSelectedPostIds.has(p.id));
  document.getElementById('postMgmtTable').innerHTML=posts.length?`
    <div class="admin-selection-bar">
      <label style="display:flex;align-items:center;gap:6px"><input class="admin-post-check" type="checkbox" ${allVisibleSelected?'checked':''} onchange="adminToggleSelectVisible(this.checked)"> 현재 목록 전체 선택</label>
      <span class="admin-selection-count" id="adminSelectionCount">${adminSelectedPostIds.size}개 선택됨</span>
      <span>${scopeLabel} · 총 ${posts.length}개 표시 · 의심글 ${suspiciousCount}개</span>
    </div>
    <table class="admin-table">
      <thead><tr><th class="admin-check-cell">선택</th><th>공간</th><th>제목 / 미리보기</th><th>작성자</th><th>날짜</th><th>공감</th><th>댓글</th><th>관리</th></tr></thead>
      <tbody>${posts.map(p=>`
      <tr>
        <td class="admin-check-cell"><input class="admin-post-check" type="checkbox" ${adminSelectedPostIds.has(p.id)?'checked':''} onchange="adminToggleSelectPost('${jsArg(p.id)}',this.checked)"></td>
        <td><span class="admin-forum-badge ${p.forum==='agonran'?'agonran':'agora'}">${forumLabel(p.forum)}</span></td>
        <td><div class="admin-post-title-cell">${escHtml(safePreviewText(p.title||'제목 없음',60))}${isAdminSuspiciousPost(p)?'<span class="admin-spam-badge">확인 필요</span>':''}</div><div class="admin-post-preview">${escHtml(safePreviewText(p.body||'',110))}</div></td>
        <td>${escHtml(displayNick(p.author,p.authorId))}${nickLooksBroken(p.author)?'<span class="admin-nick-warn">닉네임 보정</span>':''}</td>
        <td>${p.date||'-'}</td><td>${(p.likes||[]).length}</td><td>${(p.comments||[]).length}</td>
        <td><div class="admin-post-actions"><button class="btn-soft" onclick="adminViewPost('${jsArg(p.id)}')">보기</button><button class="btn-danger" onclick="adminDeletePost('${jsArg(p.id)}')">삭제</button></div></td>
      </tr>`).join('')}</tbody></table>`:`<p style="color:var(--ink-faint);font-size:13px">표시할 게시글이 없습니다.</p>`;
}
function adminViewPost(id){
  const p=allPosts().find(x=>x.id===id); const box=document.getElementById('postMgmtDetail'); if(!p||!box)return;
  const comments=Array.isArray(p.comments)?p.comments:[];
  box.classList.add('open');
  box.innerHTML=`<div class="admin-post-detail-head"><div><div class="admin-post-detail-title">${escHtml(safePreviewText(p.title||'제목 없음',100))}${isAdminSuspiciousPost(p)?'<span class="admin-spam-badge">확인 필요</span>':''}</div><div class="admin-post-detail-meta">공간 ${forumLabel(p.forum)} · ${escHtml(displayNick(p.author,p.authorId))} · ${p.date||'-'} · 공감 ${(p.likes||[]).length} · 댓글 ${comments.length}</div></div><div class="admin-post-actions"><button class="btn-soft" onclick="openPost('${jsArg(p.id)}')">사용자 화면으로 보기</button><button class="btn-danger" onclick="adminDeletePost('${jsArg(p.id)}')">글 삭제</button><button class="btn-soft" onclick="document.getElementById('postMgmtDetail').classList.remove('open')">닫기</button></div></div><div class="admin-post-detail-body">${escHtml(cleanUserText(p.body||'내용 없음',2000))}</div><div class="admin-comment-admin-list"><div class="admin-comment-admin-title">댓글 관리 ${comments.length}개</div>${comments.length?comments.map((c,i)=>`<div class="admin-comment-admin-item"><div style="flex:1"><div class="admin-comment-admin-meta">${escHtml(displayNick(c.author,c.authorId))} · ${c.date||'-'} ${isAdminSuspiciousText(c.text)?'<span class="admin-spam-badge">확인 필요</span>':''}</div><div class="admin-comment-admin-text">${escHtml(cleanUserText(c.text||'',300))}</div></div><button class="btn-danger" onclick="adminDeleteComment('${jsArg(p.id)}',${i})">댓글 삭제</button></div>`).join(''):'<div style="font-size:13px;color:var(--ink-faint);padding:8px 0">댓글이 없습니다.</div>'}</div>`;
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function adminDeletePost(id){
  if(!confirm('이 게시글을 삭제하시겠습니까?'))return;
  markPostDeletedLocal(id); savePostsFiltered(allPosts().filter(p=>p.id!==id)); await deletePostFromFirebase(id); adminSelectedPostIds.delete(id);
  const detail=document.getElementById('postMgmtDetail'); if(detail){detail.classList.remove('open');detail.innerHTML='';}
  renderPostMgmtTable();renderPlaza();updateStats();updateInsights();
}
async function adminDeleteSelectedPosts(){
  const ids=[...adminSelectedPostIds]; if(!ids.length){alert('선택된 글이 없습니다.');return;}
  if(!confirm(`선택한 글 ${ids.length}개를 삭제하시겠습니까?`))return;
  for(const id of ids){markPostDeletedLocal(id);} savePostsFiltered(allPosts().filter(p=>!adminSelectedPostIds.has(p.id)));
  for(const id of ids){await deletePostFromFirebase(id);} adminSelectedPostIds.clear();
  const detail=document.getElementById('postMgmtDetail'); if(detail){detail.classList.remove('open');detail.innerHTML='';}
  renderPostMgmtTable();renderPlaza();updateStats();updateInsights();
}
async function adminDeleteComment(id,index){
  const posts=allPosts(); const p=posts.find(x=>x.id===id); if(!p||!Array.isArray(p.comments)||!p.comments[index])return;
  if(!confirm('이 댓글을 삭제하시겠습니까?'))return; p.comments.splice(index,1); savePostsFiltered(posts); await pushPostToFirebase(p);
  renderPostMgmtTable();adminViewPost(id);renderPlaza();updateInsights();
}
async function adminDeleteSpamPosts(){
  const posts=allPosts(); const targets=posts.filter(p=>(currentPostMgmtForum==='all'||p.forum===currentPostMgmtForum)&&isAdminSuspiciousPost(p));
  if(!targets.length){alert('정리할 의심글이 없습니다.');return;}
  if(!confirm(`의심글 ${targets.length}개를 삭제하시겠습니까?\n\n검토 없이 바로 삭제됩니다. 검토하려면 [의심글 자동 선택]을 먼저 누르세요.`))return;
  const targetIds=new Set(targets.map(p=>p.id)); for(const id of targetIds){markPostDeletedLocal(id);} savePostsFiltered(posts.filter(p=>!targetIds.has(p.id)));
  for(const id of targetIds){await deletePostFromFirebase(id);} adminSelectedPostIds.clear();
  const detail=document.getElementById('postMgmtDetail'); if(detail){detail.classList.remove('open');detail.innerHTML='';}
  renderPostMgmtTable();renderPlaza();updateStats();updateInsights();
}
const ROLE_LABEL={'student':'🎒 학생','student_rep':'🏅 학생 대표','adult':'🧑 성인','teacher':'📚 선생님','admin':'⚙️ 관리자'};
/* 아골라 글쓰기 가능 역할 — 학생(일반)은 제외 */
function canWriteAgora(user){
  if(!user) return false;
  const r=user.role||'student';
  return r==='adult'||r==='teacher'||r==='admin'||r==='student_rep';
}
function showAgoraBlockMsg(){
  let modal=document.getElementById('agoraBlockModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='agoraBlockModal';
    modal.style.cssText='position:fixed;inset:0;z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);';
    modal.innerHTML=`
      <div style="background:#fff;border-radius:20px;padding:36px 32px 28px;max-width:360px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:qrPop .2s cubic-bezier(.22,1,.36,1);">
        <div style="font-size:40px;margin-bottom:12px;">議</div>
        <div style="font-family:var(--font-serif);font-size:18px;font-weight:700;color:var(--agora);margin-bottom:8px;">아골라는 성인 토론의 마당</div>
        <div style="font-size:14px;color:var(--ink-soft);line-height:1.75;margin-bottom:20px;">
          아골라에는 성인·선생님·<strong>인증 학생 대표</strong>만<br>글을 남길 수 있어요.<br>
          <span style="font-size:12px;color:var(--ink-faint);">학생은 아곤란에서 자유롭게 질문하고<br>생각을 나눌 수 있습니다.</span>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button onclick="document.getElementById('agoraBlockModal').remove();openWrite('agonran','')" style="background:var(--agonran);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;">아곤란으로 이동</button>
          <button onclick="document.getElementById('agoraBlockModal').remove()" style="background:var(--color-surface,#EDE5D8);border:none;border-radius:10px;padding:10px 20px;font-size:13px;color:var(--ink-soft);cursor:pointer;">닫기</button>
        </div>
      </div>`;
    modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
    document.body.appendChild(modal);
  } else {
    modal.style.display='flex';
  }
}
function loadUserMgmt(){
  // Firebase에서 먼저 최신 회원 목록 가져오기
  syncUsersFromFirebase().then(()=>{
    const users=getUsers();
    document.getElementById('userMgmtTable').innerHTML=users.length?`
    <table class="admin-table">
      <thead><tr><th>아이디</th><th>닉네임</th><th>역할</th><th>가입일</th><th>글수</th><th>관리</th></tr></thead>
      <tbody>${users.map(u=>`<tr>
        <td>${escHtml(u.id)}</td>
        <td>${escHtml(u.nick)}</td>
        <td>
          <select onchange="changeUserRole('${u.id}',this.value)" style="font-size:12px;padding:3px 6px;border:1px solid var(--border);border-radius:6px;background:var(--bg);">
            ${['student','student_rep','adult','teacher','admin'].map(r=>`<option value="${r}"${(u.role||'student')===r?' selected':''}>${ROLE_LABEL[r]}</option>`).join('')}
          </select>
        </td>
        <td>${u.joinDate||'-'}</td>
        <td>${allPosts().filter(p=>p.authorId===u.id).length}</td>
        <td><button class="btn-danger" style="font-size:11px;padding:3px 10px" onclick="adminDeleteUser('${u.id}')">삭제</button></td>
      </tr>`).join('')}</tbody>
    </table>`:'<p style="color:var(--ink-faint);font-size:13px">회원이 없습니다.</p>';
  });
}
function changeUserRole(userId,newRole){
  const users=getUsers();
  const u=users.find(u=>u.id===userId);
  if(!u)return;
  u.role=newRole;
  LS.set('ylife_users',users);
  /* 현재 로그인한 사용자라면 세션도 갱신 */
  if(currentUser&&currentUser.id===userId){currentUser.role=newRole;}
  /* Firebase에도 역할 반영 */
  pushUserRoleToFirebase(userId, newRole);
}
function adminDeleteUser(userId){
  if(!confirm('이 회원을 삭제하시겠습니까?'))return;
  LS.set('ylife_users',getUsers().filter(u=>u.id!==userId));
  loadUserMgmt();
}
function loadHwaduMgmt(){
  const h=getHwadu();
  document.getElementById('adminHwaduText').value=h.text;
  document.getElementById('adminHwaduBy').value=h.by||'';
  const [y,w]=getISOWeek(new Date());
  const lbl=document.getElementById('thisWeekLabel');
  if(lbl)lbl.textContent=`(${y}년 ${w}주차)`;
  renderHwaduList();
}
function renderHwaduList(){
  const list=getHwaduList();
  const thisWeek=getWeekKey();
  /* 주차 옵션 생성 (이번 주 ~ 26주 후) */
  function weekOptions(selected){
    let opts='<option value="">-- 주차 미지정 --</option>';
    const now=new Date();
    for(let i=0;i<=25;i++){
      const d=new Date(now);
      d.setDate(d.getDate()+i*7);
      const k=getWeekKey(d);
      const [y,w]=getISOWeek(d);
      const label=i===0?`${y}년 ${w}주차 (이번 주)`:`${y}년 ${w}주차`;
      opts+=`<option value="${k}"${selected===k?' selected':''}>${label}</option>`;
    }
    return opts;
  }
  document.getElementById('hwaduList').innerHTML=list.length===0
    ?'<div style="font-size:13px;color:var(--ink-faint);padding:12px 0">목록이 비어있습니다. AI로 생성하거나 직접 추가하세요.</div>'
    :list.map((h,i)=>`
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px;${h.week===thisWeek?'border-color:var(--gold);box-shadow:0 0 0 2px var(--gold-soft);':''}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <select style="font-size:12px;border:1px solid var(--border);border-radius:6px;padding:3px 8px;background:var(--bg);color:var(--ink);"
          onchange="setHwaduWeek(${i},this.value)">${weekOptions(h.week||'')}</select>
        ${h.week===thisWeek?'<span style="font-size:11px;font-weight:700;color:var(--gold)">● 이번 주 자동 적용</span>':''}
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn-primary" style="font-size:11px;padding:4px 10px" onclick="setHwaduFromList(${i})">지금 적용</button>
          <button class="btn-danger" style="font-size:11px;padding:4px 10px" onclick="deleteHwaduItem(${i})">삭제</button>
        </div>
      </div>
      <div style="font-size:13px;color:var(--ink);line-height:1.6">${escHtml(h.text)}</div>
      <div style="font-size:11px;color:var(--ink-faint);margin-top:4px">${escHtml(h.by||'')}</div>
    </div>
  `).join('');
}
function setHwaduWeek(i,week){
  const list=getHwaduList();
  list[i].week=week;
  LS.set('ylife_hwadu_list',list);
  renderHwaduList();
  renderHwadu();
}
function saveHwadu(){
  const text=document.getElementById('adminHwaduText').value.trim();
  const by=document.getElementById('adminHwaduBy').value.trim();
  if(!text)return;
  LS.set('ylife_hwadu',{text,by});
  renderHwadu();
  alert('화두가 저장되었습니다.');
}
function adminAddHwadu(){
  const list=getHwaduList();
  list.push({text:'새 화두를 입력하세요',by:'— 출처',week:''});
  LS.set('ylife_hwadu_list',list);
  renderHwaduList();
}
async function genHwaduBatch(){
  const key=LS.get('ylife_gemini_key')||'';
  const btn=document.getElementById('hwaduGenBtn');
  const status=document.getElementById('hwaduGenStatus');
  if(!key){status.textContent='⚙️ 설정에서 Gemini API 키를 먼저 입력해주세요.';return;}
  btn.disabled=true;btn.textContent='⏳ 생성 중...';status.textContent='';
  const prompt=`당신은 철학·인문·사회·자연·교육·삶에 대해 깊이 있는 질문을 만드는 전문가입니다.
한국의 중학생~성인이 함께 토론하기 좋은 '이 주의 화두(話頭)' 20개를 만들어 주세요.
각 화두는:
- 정답이 없는 열린 질문
- 1~2문장, 70자 이내
- 다양한 주제 (자아·관계·사회·자연·기술·역사·미래 등)
- 한국어로 작성

JSON 배열로만 응답하세요. 형식:
[{"text":"화두 내용","by":"— 주제영역 · 참고사항"},...]`;
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],
        generationConfig:{responseMimeType:'application/json'}})
    });
    const d=await res.json();
    const raw=d?.candidates?.[0]?.content?.parts?.[0]?.text||'[]';
    let items=[];
    try{items=JSON.parse(raw);}catch{
      const m=raw.match(/\[[\s\S]*\]/);
      if(m)items=JSON.parse(m[0]);
    }
    if(!Array.isArray(items)||items.length===0)throw new Error('파싱 실패');
    const list=getHwaduList();
    items.forEach(it=>list.push({text:it.text||'',by:it.by||'— AI 생성',week:''}));
    LS.set('ylife_hwadu_list',list);
    renderHwaduList();
    status.textContent=`✓ ${items.length}개 생성 완료! 각 항목에서 주차를 지정하세요.`;
    status.style.color='var(--agonran)';
  }catch(e){
    status.textContent='생성 실패: '+e.message;
    status.style.color='#C05020';
  }
  btn.disabled=false;btn.textContent='✦ 20개 생성하기';
}
function setHwaduFromList(i){
  const list=getHwaduList();
  LS.set('ylife_hwadu',list[i]);
  renderHwadu();
  document.getElementById('adminHwaduText').value=list[i].text;
  document.getElementById('adminHwaduBy').value=list[i].by;
  alert('화두가 적용되었습니다.');
}
function deleteHwaduItem(i){
  const list=getHwaduList();
  list.splice(i,1);
  LS.set('ylife_hwadu_list',list);
  renderHwaduList();
}
/* ── 글씨 크기 실시간 조절 ── */
function previewFontSize(val){
  val=parseInt(val);
  const d=val-15; /* 기준 15px 대비 증감 */
  document.getElementById('fontsize-val').textContent=val+'px';
  let el=document.getElementById('live-fontsize');
  if(!el){el=document.createElement('style');el.id='live-fontsize';document.head.appendChild(el);}
  el.textContent=`
/* === 사이트 본문 글씨 크기 (기준 ${val}px) === */

/* 히어로 섹션 */
.hero-sub{font-size:${val+2}px!important;}
.hero h1{font-size:clamp(${32+d}px,5vw,${56+d}px)!important;}

/* 섹션 제목·설명 */
.section-title{font-size:clamp(${22+d}px,3vw,${30+d}px)!important;}
.section-sub{font-size:${val-1}px!important;}

/* 화두 */
.hwadu-text{font-size:${val+3}px!important;}
.hwadu-sub,.hwadu-meta{font-size:${val-2}px!important;}

/* 광장 카드 */
.plaza-card-desc{font-size:${val-1}px!important;}
.plaza-card .post-title{font-size:${val-2}px!important;}
.plaza-card .post-meta{font-size:${val-4}px!important;}

/* 뉴스 기사 */
.nds-article-title{font-size:clamp(${20+d}px,3vw,${30+d}px)!important;}
.nds-article-desc{font-size:${val}px!important;}
.nds-article-body{font-size:${val-1}px!important;}
.nds-article-expanded p{font-size:${val-1}px!important;}
.nds-thought-text{font-size:${val-2}px!important;}

/* 뉴스 목록 카드 */
.news-card-title{font-size:${val-1}px!important;}
.news-card-desc{font-size:${val-2}px!important;}

/* 에디토리얼 */
.editorial-text,.editorial-body{font-size:${val}px!important;}

/* 생태계 */
.eco-name{font-size:${val-1}px!important;}
.eco-url{font-size:${val-4}px!important;}

/* 게시글 목록 */
.post-list-title,.post-item-title{font-size:${val-1}px!important;}
.post-list-body,.post-item-body,.post-preview{font-size:${val-2}px!important;}
.post-title{font-size:${val-2}px!important;}

/* 내 공간 */
.mys-thought-text{font-size:${val-1}px!important;}

/* 일반 p 태그 (섹션 안) */
.section-inner p, .section p{font-size:${val}px!important;}

/* 헤더·UI·어드민은 건드리지 않음 */
.site-header,.site-header *,
.admin-panel,.admin-panel *,
button,.btn,.btn-sm,.btn-primary,.btn-lg,
.quick-nav,.quick-nav *,
.modal-header,.settings-panel{font-size:revert!important;}
  `;
  /* 프리뷰 박스 */
  const box=document.getElementById('fontPreviewBox');
  if(box){
    box.style.fontSize=val+'px';
    box.style.lineHeight='1.75';
  }
  LS.set('ylife_fontsize',val);
}
/* ── 색상 테마 ── */
const COLOR_THEMES={
  'warm-linen':{
    '--gold':'#B08040','--thread':'#B08040','--color-primary':'#7A6A52',
    '--color-bg':'#F8F2EA','--color-surface':'#EDE5D8','--color-text':'#2A2018',
    '--agora':'#3D5F8A','--agonran':'#3D6E3D','--ink-deep':'#1A150E',
    name:'Warm Linen'},
  'mint-tide':{
    '--gold':'#4A9B8A','--thread':'#4A9B8A','--color-primary':'#3A7A6C',
    '--color-bg':'#E8F5F2','--color-surface':'#C8E6E0','--color-text':'#1A2E2A',
    '--agora':'#2D6B7A','--agonran':'#3A6B4A','--ink-deep':'#0E2420',
    name:'Mint Tide'},
  'agora-blue':{
    '--gold':'#3D5F8A','--thread':'#3D5F8A','--color-primary':'#2E4A70',
    '--color-bg':'#EBF0F8','--color-surface':'#C8D8EE','--color-text':'#1A2030',
    '--agora':'#2E4A70','--agonran':'#3A6B4A','--ink-deep':'#0E1828',
    name:'Agora Blue'},
  'mauve-fog':{
    '--gold':'#7B5E88','--thread':'#7B5E88','--color-primary':'#614870',
    '--color-bg':'#EEE8F4','--color-surface':'#D8CCE4','--color-text':'#20102A',
    '--agora':'#3D5F8A','--agonran':'#4A6A5A','--ink-deep':'#180E22',
    name:'Mauve Fog'},
  'wood-dark':{
    '--gold':'#B08040','--thread':'#A06830','--color-primary':'#5D4037',
    '--color-bg':'#F2EBE0','--color-surface':'#E0D0C0','--color-text':'#1E1208',
    '--agora':'#3D5F5A','--agonran':'#4A5E2A','--ink-deep':'#0E0800',
    name:'Wood Dark'},
};
function _applyThemeVars(vars,hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  Object.entries(vars).forEach(([k,v])=>{if(k!=='name')document.documentElement.style.setProperty(k,v);});
  /* 파생 투명도 색상 재계산 */
  document.documentElement.style.setProperty('--gold-soft',`rgba(${r},${g},${b},0.12)`);
  document.documentElement.style.setProperty('--agora-s',`rgba(${r},${g},${b},0.1)`);
  document.documentElement.style.setProperty('--agonran-s',`rgba(${r},${g},${b},0.1)`);
}
function applyColorTheme(theme,el){
  document.querySelectorAll('.color-preset').forEach(p=>p.classList.remove('active'));
  if(el)el.classList.add('active');
  const vars=COLOR_THEMES[theme]||COLOR_THEMES['warm-linen'];
  const hex=vars['--gold'];
  _applyThemeVars(vars,hex);
  const picker=document.getElementById('colorCustomPicker');
  if(picker)picker.value=hex;
  const nameEl=document.getElementById('colorThemeName');
  if(nameEl)nameEl.textContent=vars.name||theme;
  LS.set('ylife_color_theme',theme);
  LS.set('ylife_custom_color',null);
}
function applyCustomColor(hex){
  /* 커스텀: gold/thread만 변경, bg/surface는 유지 */
  document.querySelectorAll('.color-preset').forEach(p=>p.classList.remove('active'));
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  /* 밝기 계산으로 배경색 자동 생성 */
  const lightness=(r*299+g*587+b*114)/1000;
  const bgLight=lightness>100;
  document.documentElement.style.setProperty('--gold',hex);
  document.documentElement.style.setProperty('--thread',hex);
  document.documentElement.style.setProperty('--color-primary',hex);
  document.documentElement.style.setProperty('--gold-soft',`rgba(${r},${g},${b},0.12)`);
  document.documentElement.style.setProperty('--agora-s',`rgba(${r},${g},${b},0.1)`);
  const nameEl=document.getElementById('colorThemeName');
  if(nameEl)nameEl.textContent='사용자 지정 '+hex;
  LS.set('ylife_custom_color',hex);
  LS.set('ylife_color_theme',null);
}
function initDesignSettings(){
  /* 폰트 크기 복원 */
  const fs=LS.get('ylife_fontsize');
  if(fs){
    const el=document.getElementById('cfg-fontsize');
    const label=document.getElementById('fontsize-val');
    if(el)el.value=fs;
    if(label)label.textContent=fs+'px';
    previewFontSize(fs);
  }
  initAdminThemeSettings();
  /* 커스텀 색상 복원 */
  const customHex=LS.get('ylife_custom_color');
  if(customHex){
    applyCustomColor(customHex);
    const picker=document.getElementById('colorCustomPicker');
    if(picker)picker.value=customHex;
    return;
  }
  /* 프리셋 테마 복원 */
  const theme=LS.get('ylife_color_theme');
  if(theme){
    const vars=COLOR_THEMES[theme];
    if(vars){
      const hex=vars['--gold'];
      _applyThemeVars(vars,hex);
      const picker=document.getElementById('colorCustomPicker');
      if(picker)picker.value=hex;
      const nameEl=document.getElementById('colorThemeName');
      if(nameEl)nameEl.textContent=vars.name||theme;
    }
    document.querySelectorAll('.color-preset').forEach(p=>{
      p.classList.toggle('active',p.dataset.theme===theme);
    });
  }
}


/* ── 관리자 대시보드 색상 설정 ── */
const ADMIN_THEME_DEFAULTS={
  bg:'#F8F2EA',panel:'#FFFDF8',sidebar:'#EEE6D6',header:'#1A150E',
  text:'#2A2018',muted:'#6F6256',accent:'#B08040',border:'#D8CBB8'
};
const ADMIN_THEME_PRESETS={
  light:{bg:'#F7F7F2',panel:'#FFFFFF',sidebar:'#EFE8D8',header:'#1F1A14',text:'#111111',muted:'#555555',accent:'#9A6A25',border:'#D7CAB8'},
  cream:{bg:'#F8F2EA',panel:'#FFFDF8',sidebar:'#EEE6D6',header:'#1A150E',text:'#2A2018',muted:'#6F6256',accent:'#B08040',border:'#D8CBB8'},
  dark:{bg:'#151515',panel:'#242424',sidebar:'#1E1E1E',header:'#000000',text:'#F2F2F2',muted:'#C5C5C5',accent:'#D6A84F',border:'#4A4A4A'},
  green:{bg:'#F1F5EC',panel:'#FFFFFF',sidebar:'#E1EAD8',header:'#263D25',text:'#172016',muted:'#53614F',accent:'#4F7A3A',border:'#C7D4BF'}
};
function applyAdminTheme(t,save){
  t=Object.assign({},ADMIN_THEME_DEFAULTS,t||{});
  const vars={
    '--admin-bg':t.bg,'--admin-panel':t.panel,'--admin-sidebar':t.sidebar,'--admin-header':t.header,
    '--admin-text':t.text,'--admin-muted':t.muted,'--admin-accent':t.accent,'--admin-border':t.border
  };
  Object.entries(vars).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
  const ids={bg:'cfg-admin-bg',panel:'cfg-admin-panel',sidebar:'cfg-admin-sidebar',header:'cfg-admin-header',text:'cfg-admin-text',muted:'cfg-admin-muted',accent:'cfg-admin-accent',border:'cfg-admin-border'};
  Object.entries(ids).forEach(([k,id])=>{const el=document.getElementById(id); if(el)el.value=t[k];});
  if(save)LS.set('ylife_admin_theme',t);
}
function getAdminThemeFromInputs(){
  const val=(id,fallback)=>{const el=document.getElementById(id);return el?el.value:fallback;};
  return {
    bg:val('cfg-admin-bg',ADMIN_THEME_DEFAULTS.bg),
    panel:val('cfg-admin-panel',ADMIN_THEME_DEFAULTS.panel),
    sidebar:val('cfg-admin-sidebar',ADMIN_THEME_DEFAULTS.sidebar),
    header:val('cfg-admin-header',ADMIN_THEME_DEFAULTS.header),
    text:val('cfg-admin-text',ADMIN_THEME_DEFAULTS.text),
    muted:val('cfg-admin-muted',ADMIN_THEME_DEFAULTS.muted),
    accent:val('cfg-admin-accent',ADMIN_THEME_DEFAULTS.accent),
    border:val('cfg-admin-border',ADMIN_THEME_DEFAULTS.border)
  };
}
function previewAdminTheme(){applyAdminTheme(getAdminThemeFromInputs(),true);}
function applyAdminThemePreset(name){applyAdminTheme(ADMIN_THEME_PRESETS[name]||ADMIN_THEME_DEFAULTS,true);}
function resetAdminTheme(){applyAdminTheme(ADMIN_THEME_DEFAULTS,true);}
function initAdminThemeSettings(){
  const saved=LS.get('ylife_admin_theme');
  applyAdminTheme(saved||ADMIN_THEME_DEFAULTS,false);
}
function saveAdminThemeSettings(){LS.set('ylife_admin_theme',getAdminThemeFromInputs());}

function saveSettings(){
  const s={
    sitename:document.getElementById('cfg-sitename').value,
    slogan:document.getElementById('cfg-slogan').value,
    signup:document.getElementById('cfg-signup').checked,
    comment:document.getElementById('cfg-comment').checked,
    publicRead:document.getElementById('cfg-public-read').checked,
  };
  LS.set('ylife_settings',s);
  saveAdminThemeSettings();
  alert('설정이 저장되었습니다.');
}
function changeAdminPw(){
  const p1=document.getElementById('newAdminPw').value;
  const p2=document.getElementById('newAdminPw2').value;
  const msg=document.getElementById('adminPwMsg');
  if(p1.length<6){msg.textContent='6자 이상 입력하세요.';return;}
  if(p1!==p2){msg.textContent='비밀번호가 일치하지 않습니다.';return;}
  LS.set('ylife_admin_pw',p1);
  msg.style.color='#6B8F71';
  msg.textContent='비밀번호가 변경되었습니다.';
}

/* ════════════════════════════════
   유틸
════════════════════════════════ */
function escHtml(s){
  if(!s)return'';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'});}

/* ════════════════════════════════
   (Three.js 제거 — CSS 지구로 교체)
════════════════════════════════ */
(function(){
  // CSS 지구: Three.js 불필요, CSS animation으로 구현됨
  if(false){
  const cnv=null;
  function loadScript(src,cb){
    const s=document.createElement('script');
    s.src=src;s.onload=cb;document.head.appendChild(s);
  }

  loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',function(){
    const parent=cnv.parentElement;
    let W=parent.offsetWidth, H=parent.offsetHeight;

    // 렌더러
    const renderer=new THREE.WebGLRenderer({canvas:cnv,alpha:true,antialias:true});
    renderer.setSize(W,H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setClearColor(0x000000,0);

    // 씬
    const scene=new THREE.Scene();

    // 카메라 — 오른쪽 하단 구도
    const camera=new THREE.PerspectiveCamera(38,W/H,0.1,100);
    camera.position.set(0,0,3.2);

    // 지구 구
    const geo=new THREE.SphereGeometry(1.18,64,64);
    const loader=new THREE.TextureLoader();
    loader.crossOrigin='anonymous';

    // 실사 텍스처 (three.js 공식 예제 — CORS OK)
    const earthTex=loader.load(
      'https://unpkg.com/three@0.128.0/examples/textures/planets/earth_atmos_2048.jpg',
      undefined,undefined,
      ()=>{ /* 실패 시 fallback 색상 유지 */ }
    );
    const mat=new THREE.MeshPhongMaterial({
      map:earthTex,
      specular:new THREE.Color(0x111111),
      shininess:8,
    });
    const earth=new THREE.Mesh(geo,mat);
    // 오른쪽 하단으로 오프셋
    earth.position.set(0.9,-0.3,0);
    scene.add(earth);

    // 대기권 글로우 (반투명 셸)
    const atmoGeo=new THREE.SphereGeometry(1.25,64,64);
    const atmoMat=new THREE.MeshPhongMaterial({
      color:new THREE.Color(0xB08040),
      transparent:true,opacity:0.06,
      side:THREE.FrontSide,
      depthWrite:false,
    });
    const atmo=new THREE.Mesh(atmoGeo,atmoMat);
    atmo.position.copy(earth.position);
    scene.add(atmo);

    // 조명 — 왼쪽 위에서 따뜻한 광원
    scene.add(new THREE.AmbientLight(0x7A6050,0.65));
    const sun=new THREE.DirectionalLight(0xFFE8B0,1.8);
    sun.position.set(-4,2,3);
    scene.add(sun);

    // 히어로 텍스트 쪽 왼쪽 페이드 (2D canvas overlay)
    const overlay=document.createElement('canvas');
    overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    parent.appendChild(overlay);
    function drawOverlay(){
      overlay.width=parent.offsetWidth;
      overlay.height=parent.offsetHeight;
      const oc=overlay.getContext('2d');
      const fade=oc.createLinearGradient(0,0,overlay.width*0.6,0);
      fade.addColorStop(0,'rgba(15,10,6,0.88)');
      fade.addColorStop(1,'transparent');
      oc.fillStyle=fade;
      oc.fillRect(0,0,overlay.width,overlay.height);
    }
    drawOverlay();

    // 리사이즈
    window.addEventListener('resize',()=>{
      W=parent.offsetWidth;H=parent.offsetHeight;
      camera.aspect=W/H;camera.updateProjectionMatrix();
      renderer.setSize(W,H);
      drawOverlay();
    });

    // 애니메이션
    function animate(){
      requestAnimationFrame(animate);
      earth.rotation.y+=0.0008;
      atmo.rotation.y=earth.rotation.y;
      renderer.render(scene,camera);
    }
    animate();
  });
  } // end if(false)
})();

/* ════════════════════════════════
   초기화
════════════════════════════════ */
function init(){
  restoreSession();
  renderHeader();
  renderHwadu();
  renderNews();
  renderPlaza();
  updateStats();
  updateInsights();
}
init();

/* ════════════════════════════════
   구글 소셜 로그인
   ════════════════════════════════ */
let GOOGLE_CLIENT_ID = '93942249284-nm9mookvhfe50n6i8upsfvev3gl8d1a7.apps.googleusercontent.com';

function saveGoogleClientId(){
  const val = document.getElementById('googleClientIdInput').value.trim();
  if(!val){alert('Client ID를 입력하세요.');return;}
  localStorage.setItem('ylife_google_client_id', val);
  GOOGLE_CLIENT_ID = val;
  document.getElementById('googleClientIdStatus').textContent = '✓ 저장 완료 — 페이지 새로고침 후 구글 버튼이 나타납니다.';
  document.getElementById('googleClientIdInput').value = '';
  initGoogleAuth();
}

function initGoogleAuth(){
  if(!GOOGLE_CLIENT_ID || !window.google) return;
  try {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      ux_mode: 'popup',
    });
  } catch(e){ console.warn('Google Auth init error:', e); }
}

function renderGoogleBtn(containerId){
  const wrap = document.getElementById(containerId);
  if(!wrap) return;
  wrap.innerHTML = '';
  if(!window.google){ return; }
  try {
    google.accounts.id.renderButton(wrap, {
      theme:'outline', size:'large', text:'signin_with',
      locale:'ko', width:300, shape:'rectangular',
    });
  } catch(e){ console.warn('Google button render error:', e); }
}

function handleGoogleCredential(response){
  try {
    // JWT payload 디코딩 (검증 불필요 — GSI가 이미 검증함)
    const b64 = response.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    const payload = JSON.parse(decodeURIComponent(atob(b64).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    const { sub, email, name, picture } = payload;
    const users = getUsers();
    let user = users.find(u => u.googleSub === sub);
    if(!user){
      // 신규 — 자동 계정 생성
      user = {
        id: 'g_' + sub.slice(-10),
        nick: cleanNick(name || email.split('@')[0]),
        email: email || '',
        pw: '',
        googleSub: sub,
        provider: 'google',
        joined: new Date().toLocaleDateString('ko'),
      };
      users.push(user);
      LS.set('ylife_users', users);
      pushUserToFirebase(user);
    }
    currentUser = user;
    LS.set('ylife_session', user.id);
    closeModal('loginModal');
    closeModal('signupModal');
    renderHeader();
    renderPlaza();
    updateStats();
  } catch(e){
    console.error('Google 로그인 처리 오류:', e);
    alert('구글 로그인 처리 중 오류가 발생했습니다.');
  }
}

// Google GSI 스크립트 로드 완료 후 초기화
window.addEventListener('load', function(){
  setTimeout(initGoogleAuth, 500);
  initDesignSettings();
});

/* ESC 키로 광장 닫기 */
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    const modal = document.getElementById('allPostsModal');
    if(modal && modal.classList.contains('open')) closeAllPosts();
  }
});

/* ════════════════════════════════
   빠른 이동 메뉴
   ════════════════════════════════ */
function toggleQuickNav(){
  const drop = document.getElementById('quickNavDrop');
  drop.classList.toggle('open');
}
function goTo(id){
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  document.getElementById('quickNavDrop').classList.remove('open');
}
// 바깥 클릭 시 닫기
document.addEventListener('click', function(e){
  const nav = document.getElementById('quickNav');
  if(nav && !nav.contains(e.target)){
    document.getElementById('quickNavDrop').classList.remove('open');
  }
});

/* ════════════════════════════════
   Firebase 실시간 공유
   ════════════════════════════════ */
const FIREBASE_URL = 'https://y-life-e191d-default-rtdb.firebaseio.com';

function makePostId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

async function pushPostToFirebase(post){
  post=sanitizePostForSave(post);
  if(!post || !post.id){ console.warn('pushPostToFirebase: id 없음'); return null; }
  try{
    const url = FIREBASE_URL+'/posts/'+encodeURIComponent(post.id)+'.json';
    const res = await fetch(url,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(post)
    });
    if(!res.ok){
      const errText = await res.text();
      if(res.status === 403){
        const retryPost = {...post, id: makePostId(), ts: Date.now()};
        const posts = allPosts();
        const idx2 = posts.findIndex(p=>p.id===post.id);
        if(idx2>=0){ posts[idx2]=retryPost; LS.set('ylife_posts',posts); }
        const r2 = await fetch(FIREBASE_URL+'/posts/'+encodeURIComponent(retryPost.id)+'.json',{
          method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(retryPost)
        });
        if(!r2.ok) console.warn('재시도 실패:', r2.status, await r2.text());
        else console.log('Firebase 재시도 성공:', retryPost.id);
      } else {
        console.warn('Firebase 업로드 실패:', res.status, errText);
      }
    }
    return res;
  }catch(e){ console.warn('Firebase 네트워크 오류:',e); return null; }
}

async function fetchDeletedPostIdsFromFirebase(){
  try{
    const res=await fetch(FIREBASE_URL+'/deletedPosts.json');
    if(!res.ok) return getDeletedPostIds();
    const data=await res.json();
    const ids=Object.keys(data||{});
    if(ids.length){const merged=new Set([...(LS.get('ylife_deleted_post_ids')||[]),...ids]);LS.set('ylife_deleted_post_ids',[...merged].slice(-2000));}
    return getDeletedPostIds();
  }catch(e){return getDeletedPostIds();}
}
async function markPostDeletedFirebase(id){
  if(!id) return;
  try{await fetch(FIREBASE_URL+'/deletedPosts/'+encodeURIComponent(id)+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,deletedAt:Date.now()})});}
  catch(e){console.warn('Firebase 삭제 기록 저장 오류:',e);}
}
async function deletePostFromFirebase(id){
  if(!id) return null;
  markPostDeletedLocal(id);
  await markPostDeletedFirebase(id);
  try{
    const res = await fetch(FIREBASE_URL+'/posts/'+encodeURIComponent(id)+'.json',{method:'DELETE'});
    if(!res.ok){
      console.warn('Firebase 게시글 삭제 실패:', res.status, await res.text());
      try{await fetch(FIREBASE_URL+'/posts/'+encodeURIComponent(id)+'.json',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({deleted:true,deletedAt:Date.now(),title:'삭제된 글',body:''})});}catch(e){}
    }
    return res;
  }catch(e){ console.warn('Firebase 게시글 삭제 네트워크 오류:',e); return null; }
}

async function syncFromFirebase(showMsg){
  try{
    const deletedIds=await fetchDeletedPostIdsFromFirebase();
    let localRaw=LS.get('ylife_posts')||[];
    localRaw=localRaw.filter(p=>p&&p.id&&!deletedIds.has(p.id)&&!p.deleted);
    const res = await fetch(FIREBASE_URL+'/posts.json');
    if(!res.ok){ console.warn('syncFromFirebase 실패:', res.status); savePostsFiltered(localRaw); return 0; }
    const data = await res.json();
    const fbPosts = Object.values(data||{}).filter(p=>p && p.id && !p.deleted && !deletedIds.has(p.id)).map(sanitizePostForSave);
    const byId=new Map(localRaw.map(p=>[p.id,p]));
    let added = 0;
    fbPosts.forEach(p=>{p.likes=p.likes||[]; p.comments=p.comments||[]; if(!byId.has(p.id)){added++;} byId.set(p.id,p);});
    const merged=[...byId.values()].filter(p=>p&&p.id&&!deletedIds.has(p.id)&&!p.deleted).map(normalizePost).sort((a,b)=>(b.ts||0)-(a.ts||0));
    LS.set('ylife_posts', merged);
    if(showMsg) alert('동기화 완료! 새 글 '+added+'편을 받았습니다. 삭제 기록도 반영했습니다.');
    return added;
  }catch(e){ console.warn('Firebase 동기화 오류:',e); return 0; }
}

async function syncUsersFromFirebase(){
  try{
    const res = await fetch(FIREBASE_URL+'/users.json');
    if(!res.ok) return;
    const data = await res.json();
    if(!data) return;
    const fbUsers = Object.values(data).filter(u=>u && u.id);
    const local = allUsers();
    const localIds = new Set(local.map(u=>u.id));
    let added = 0;
    fbUsers.forEach(u=>{ if(!localIds.has(u.id)){ local.push(u); added++; } });
    if(added) LS.set('ylife_users', local);
  }catch(e){ console.warn('Users 동기화 오류:',e); }
}

async function pushUserToFirebase(user){
  if(!user || !user.id) return;
  try{
    await fetch(FIREBASE_URL+'/users/'+encodeURIComponent(user.id)+'.json',{
      method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(user)
    });
  }catch(e){ console.warn('User 업로드 오류:',e); }
}

async function pushLocalPostsToFirebase(){
  try{
    const res = await fetch(FIREBASE_URL+'/posts.json?shallow=true');
    const fbKeys = res.ok ? (await res.json()||{}) : {};
    const local = allPosts();
    for(const p of local){ if(!p.id) continue; if(!fbKeys[p.id]) await pushPostToFirebase(p); }
  }catch(e){ console.warn('로컬 글 업로드 오류:',e); }
}

/* 시작 1.2초 후 동기화 */
setTimeout(async ()=>{
  await pushLocalPostsToFirebase();
  const added = await syncFromFirebase(false);
  if(added > 0){ renderPlaza(); updateStats(); updateInsights(); }
  await syncUsersFromFirebase();
}, 1200);

/* 15초마다 자동 새 글 확인 */
setInterval(async ()=>{
  const added = await syncFromFirebase(false);
  if(added > 0){ renderPlaza(); updateStats(); updateInsights(); }
}, 15000);


/* ===== 사랑방 자료실 관리 ===== */
(function(){
  const SB_BOOKS_KEY = 'ylife_saranbang_books';
  const SB_GH_TOKEN_KEY = 'ylife_gh_token';
  const SB_REPO = 'yeon-life/yeon-life.github.io';

  const DEFAULT_BOOK = {
    id: 'obsidian',
    path: 'saranbang/obsidian/index.html',
    versionsPath: 'saranbang/obsidian',
    title: '옵시디언 활용법',
    tagline: '두 번째 뇌를 짓는 노트의 길',
    author: '연소사',
    source: { name: '연플래닝', url: 'https://y-life.kr/ulsan/yeon-planning/' },
    versions: [
      { version: 'v1.0', date: '2026-05-07', summary: '최초 공개 — 옵시디언을 처음 만나는 분부터, 한 걸음 더 깊이 들어가고 싶은 분까지 함께 읽을 수 있도록 풀어 썼습니다.', isLatest: true, body: '' }
    ]
  };

  function loadBooks(){
    try {
      const raw = localStorage.getItem(SB_BOOKS_KEY);
      if(raw) return JSON.parse(raw);
    } catch(e){}
    return [JSON.parse(JSON.stringify(DEFAULT_BOOK))];
  }
  function saveBooks(books){
    try { localStorage.setItem(SB_BOOKS_KEY, JSON.stringify(books)); } catch(e){}
  }

  let SB_CURRENT = 'obsidian';

  function escapeHtml(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function suggestNextVersion(cur){
    const m = (cur || 'v1.0').match(/v?(\d+)\.(\d+)/);
    if(!m) return 'v1.1';
    return 'v' + m[1] + '.' + (parseInt(m[2]) + 1);
  }

  // Markdown → HTML (간단 변환)
  function md2html(md){
    let h = md;
    h = h.replace(/```([\s\S]*?)```/g, (m,c) => '<pre><code>' + escapeHtml(c.trim()) + '</code></pre>');
    h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    h = h.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
    h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    h = h.replace(/^(\s*)- (.+)$/gm, '$1<li>$2</li>');
    h = h.replace(/(<li>[^<]*<\/li>(\s|\n)*)+/g, m => '<ul>'+m+'</ul>');
    h = h.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    const blocks = h.split(/\n\n+/);
    return blocks.map(b => {
      const t = b.trim();
      if(!t) return '';
      if(t.startsWith('<h') || t.startsWith('<ul') || t.startsWith('<pre') || t.startsWith('<blockquote') || t.startsWith('<table') || t.startsWith('<img')) return t;
      return '<p>' + t.replace(/\n/g, '<br/>') + '</p>';
    }).join('\n');
  }

  function processBody(text, format){
    text = text || '';
    if(format === 'auto') format = /<\/?\w+[^>]*>/.test(text) ? 'html' : 'markdown';
    if(format === 'html') return text;
    if(format === 'markdown') return md2html(text);
    if(format === 'plain'){
      const blocks = text.split(/\n\n+/);
      return blocks.map(b => '<p>' + escapeHtml(b.trim()).replace(/\n/g,'<br/>') + '</p>').join('\n');
    }
    return text;
  }

  // ─── 렌더 ───
  window.renderSaranbangAdmin = function(){
    const books = loadBooks();
    const list = document.getElementById('saranbangBookList');
    if(!list) return;
    list.innerHTML = books.map(b => `
      <div class="settings-group" style="cursor:pointer;transition:all .15s;border:${b.id===SB_CURRENT?'2px solid var(--gold)':'1px solid var(--border)'};" onclick="sbSelectBook('${b.id}')">
        <div style="display:flex;gap:14px;align-items:center;">
          <div style="width:48px;height:64px;border-radius:5px;background:linear-gradient(155deg,#1A0F2E 0%,#2D1B4E 100%);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#D4AF79;font-family:'Nanum Myeongjo',serif;font-size:11px;font-weight:700;">緣</div>
          <div style="flex:1;">
            <div style="font-family:'Nanum Myeongjo',serif;font-size:17px;font-weight:800;color:var(--ink);">${escapeHtml(b.title)}</div>
            <div style="font-size:12px;color:var(--ink-faint);margin-top:3px;">${escapeHtml(b.author)} · 제작 ${escapeHtml(b.source.name)}</div>
            <div style="font-size:11px;color:var(--ink-faint);margin-top:5px;">최신 ${b.versions.find(v=>v.isLatest)?.version || b.versions[0]?.version || '-'} · ${b.versions.length}개 버전</div>
          </div>
          <div style="font-size:13px;color:var(--gold);font-weight:700;">관리 →</div>
        </div>
      </div>
    `).join('');

    sbSelectBook(SB_CURRENT);
  };

  window.sbSelectBook = function(bookId){
    SB_CURRENT = bookId;
    const book = loadBooks().find(b => b.id === bookId);
    if(!book) return;
    document.getElementById('saranbangBookDetail').style.display = 'block';
    document.getElementById('sbBookTitle').textContent = book.title;
    const latest = book.versions.find(v=>v.isLatest) || book.versions[0];
    document.getElementById('sbCurrentVer').textContent = latest?.version || 'v1.0';
    document.getElementById('sbNewVersion').value = suggestNextVersion(latest?.version);
    document.getElementById('sbNewDate').value = new Date().toISOString().slice(0,10);
    sbRenderHistory();

    // Re-highlight book card
    const list = document.getElementById('saranbangBookList');
    if(list){
      Array.from(list.children).forEach(c => {
        const isCurrent = c.getAttribute('onclick')?.includes("'"+bookId+"'");
        c.style.border = isCurrent ? '2px solid var(--gold)' : '1px solid var(--border)';
      });
    }
  };

  window.sbSwitchTab = function(tab){
    document.getElementById('sbTab-new').classList.toggle('active', tab === 'new');
    document.getElementById('sbTab-history').classList.toggle('active', tab === 'history');
    document.getElementById('sbPanelNew').style.display = tab === 'new' ? 'block' : 'none';
    document.getElementById('sbPanelHistory').style.display = tab === 'history' ? 'block' : 'none';
    if(tab === 'history') sbRenderHistory();
  };

  function sbRenderHistory(){
    const book = loadBooks().find(b => b.id === SB_CURRENT);
    if(!book) return;
    const list = document.getElementById('sbVersionList');
    if(!list) return;
    list.innerHTML = book.versions.map(v => `
      <div style="background:var(--surface);border:1px solid ${v.isLatest?'var(--gold)':'var(--border)'};${v.isLatest?'background:#FCF6EC;':''}border-radius:10px;padding:14px 18px;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;">
        <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:7px;font-size:12.5px;font-weight:800;font-family:'Nanum Myeongjo',serif;background:${v.isLatest?'var(--gold)':'#EFE7D6'};color:${v.isLatest?'#fff':'var(--ink)'};">${v.version}</span>
        <div>
          <div style="font-size:13.5px;color:var(--ink);font-weight:500;">${escapeHtml(v.summary)}</div>
          <div style="font-size:11.5px;color:var(--ink-faint);margin-top:2px;">${v.date} · 본문 ${v.body && v.body.trim() ? '있음' : '비어있음'}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
          <span style="font-size:11px;color:${v.isLatest?'var(--gold)':'var(--ink-faint)'};font-weight:700;">${v.isLatest?'최신':'이전'}</span>
          <button class="btn-sm" style="padding:4px 10px;font-size:11px;" onclick="sbEditVersion('${v.version}')">편집</button>
        </div>
      </div>
    `).join('');
  }

  window.sbEditVersion = function(versionId){
    const book = loadBooks().find(b => b.id === SB_CURRENT);
    if(!book) return;
    const v = book.versions.find(x => x.version === versionId);
    if(!v) return;
    if(!confirm('버전 ' + versionId + '를 편집 화면으로 불러올까요? (현재 입력 내용은 사라집니다)')) return;
    document.getElementById('sbNewVersion').value = v.version;
    document.getElementById('sbNewDate').value = v.date;
    document.getElementById('sbNewSummary').value = v.summary;
    document.getElementById('sbNewBody').value = v.body || '';
    document.getElementById('sbBodyFormat').value = 'html';
    document.getElementById('sbReplaceLatest').checked = !!v.isLatest;
    sbSwitchTab('new');
    document.getElementById('sbStatus').innerHTML = '<span style="color:#3D5F8A;">✏ ' + versionId + '를 불러왔습니다. 수정 후 다시 게시하세요.</span>';
  };

  function sbCollectFormData(){
    const status = document.getElementById('sbStatus');
    const version = document.getElementById('sbNewVersion').value.trim();
    const date = document.getElementById('sbNewDate').value;
    const summary = document.getElementById('sbNewSummary').value.trim();
    const body = document.getElementById('sbNewBody').value;
    const format = document.getElementById('sbBodyFormat').value;
    const replaceLatest = document.getElementById('sbReplaceLatest').checked;

    if(!version){ if(status) status.innerHTML='<span style="color:#c0392b;">⚠ 버전 번호를 입력하세요.</span>'; return null; }
    if(!date){ if(status) status.innerHTML='<span style="color:#c0392b;">⚠ 발행일을 선택하세요.</span>'; return null; }
    if(!summary){ if(status) status.innerHTML='<span style="color:#c0392b;">⚠ 이번 업데이트 내용을 적어주세요.</span>'; return null; }
    if(!body || body.trim().length < 10){ if(status) status.innerHTML='<span style="color:#c0392b;">⚠ 본문이 너무 짧습니다.</span>'; return null; }

    if(status) status.innerHTML = '';

    const book = loadBooks().find(b => b.id === SB_CURRENT);
    return { book, version, date, summary, body, format, replaceLatest, processedBody: processBody(body, format) };
  }

  // 새 버전을 책 데이터에 적용 (returns updated book)
  function applyNewVersion(book, data){
    const updated = JSON.parse(JSON.stringify(book));
    // Remove existing version with same id (for edit)
    updated.versions = updated.versions.filter(v => v.version !== data.version);
    // Demote all latest if replacing
    if(data.replaceLatest){
      updated.versions.forEach(v => v.isLatest = false);
    }
    updated.versions.unshift({
      version: data.version,
      date: data.date,
      summary: data.summary,
      isLatest: data.replaceLatest,
      body: data.processedBody
    });
    // Sort by date desc
    updated.versions.sort((a,b)=>{
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return db - da;
    });
    return updated;
  }

  // 책 페이지 HTML 다시 만들기 (BOOK_DATA만 교체)
  async function regenerateBookPage(updatedBook){
    // 현재 페이지 내용을 fetch (상대 경로)
    let template;
    try {
      const res = await fetch(updatedBook.path + '?cache=' + Date.now());
      if(!res.ok) throw new Error('fetch failed: ' + res.status);
      template = await res.text();
    } catch(e){
      // fallback: 임베디드 템플릿이 없으면 사용자가 수동으로 처리하도록 알림
      throw new Error('책 페이지 템플릿을 불러오지 못했습니다. (네트워크 또는 경로 확인)');
    }

    const newDataJson = JSON.stringify({
      title: updatedBook.title,
      tagline: updatedBook.tagline,
      author: updatedBook.author,
      source: updatedBook.source,
      versions: updatedBook.versions
    }, null, 2);

    // BOOK_DATA 블록을 안전하게 교체
    const replaced = template.replace(
      /window\.BOOK_DATA\s*=\s*\{[\s\S]*?\n\};/,
      'window.BOOK_DATA = ' + newDataJson + ';'
    );

    return replaced;
  }

  function downloadFile(filename, content, mime){
    const blob = new Blob([content], { type: (mime || 'text/html') + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  // ─── 미리보기 ───
  window.sbPreviewNewVersion = async function(){
    const data = sbCollectFormData();
    if(!data) return;
    const status = document.getElementById('sbStatus');
    status.innerHTML = '<span style="color:var(--ink-faint);">미리보기 준비 중…</span>';
    try {
      const updated = applyNewVersion(data.book, data);
      const html = await regenerateBookPage(updated);
      const w = window.open('', '_blank');
      w.document.open(); w.document.write(html); w.document.close();
      status.innerHTML = '<span style="color:#1B5E20;">✓ 새 창으로 미리보기를 띄웠습니다.</span>';
    } catch(e){
      status.innerHTML = '<span style="color:#c0392b;">⚠ ' + e.message + '</span>';
    }
  };

  // ─── 초안 저장 ───
  window.sbSaveDraft = function(){
    const v = document.getElementById('sbNewVersion').value;
    const d = document.getElementById('sbNewDate').value;
    const s = document.getElementById('sbNewSummary').value;
    const b = document.getElementById('sbNewBody').value;
    const f = document.getElementById('sbBodyFormat').value;
    try {
      localStorage.setItem('ylife_sb_draft_'+SB_CURRENT, JSON.stringify({v,d,s,b,f,t:Date.now()}));
      document.getElementById('sbStatus').innerHTML = '<span style="color:#1B5E20;">✓ 초안이 저장되었습니다 (이 컴퓨터에).</span>';
    } catch(e){
      document.getElementById('sbStatus').innerHTML = '<span style="color:#c0392b;">⚠ 저장 실패: ' + e.message + '</span>';
    }
  };

  // ─── 파일 다운로드 게시 ───
  window.sbPublishNewVersion = async function(){
    const data = sbCollectFormData();
    if(!data) return;
    const status = document.getElementById('sbStatus');
    status.innerHTML = '<span style="color:var(--ink-faint);">파일 만드는 중…</span>';
    try {
      const updated = applyNewVersion(data.book, data);
      const html = await regenerateBookPage(updated);

      // localStorage 저장
      const allBooks = loadBooks();
      const idx = allBooks.findIndex(b => b.id === SB_CURRENT);
      if(idx >= 0) allBooks[idx] = updated; else allBooks.push(updated);
      saveBooks(allBooks);

      // 다운로드
      downloadFile('index.html', html);

      status.innerHTML = `<div style="background:#E8F5E8;border:1px solid #4CAF50;border-radius:8px;padding:12px 16px;color:#1B5E20;line-height:1.6;">
        ✓ <strong>index.html</strong>이 다운로드되었습니다.<br>
        <span style="font-size:12px;">업로드 위치: <code>${updated.path}</code> 자리에 덮어쓰기</span>
      </div>`;
      sbRenderHistory();
    } catch(e){
      status.innerHTML = '<span style="color:#c0392b;">⚠ ' + e.message + '</span>';
    }
  };

  // ─── GitHub 직접 배포 ───
  window.sbDeployToGithub = async function(){
    const data = sbCollectFormData();
    if(!data) return;
    const status = document.getElementById('sbStatus');

    let token = localStorage.getItem(SB_GH_TOKEN_KEY);
    if(!token){
      token = prompt('GitHub Personal Access Token을 입력하세요\n(public_repo 권한 필요. 이 컴퓨터에만 저장됩니다)');
      if(!token) return;
      try { localStorage.setItem(SB_GH_TOKEN_KEY, token); } catch(e){}
    }

    status.innerHTML = '<span style="color:var(--ink-faint);">GitHub에 배포 중…</span>';

    try {
      const updated = applyNewVersion(data.book, data);
      const newHtml = await regenerateBookPage(updated);

      // 1. 현재 파일의 SHA 가져오기
      const apiBase = 'https://api.github.com/repos/' + SB_REPO;
      const getRes = await fetch(apiBase + '/contents/' + updated.path, {
        headers: { Authorization: 'token ' + token }
      });
      if(!getRes.ok){
        if(getRes.status === 401){
          localStorage.removeItem(SB_GH_TOKEN_KEY);
          throw new Error('토큰이 유효하지 않습니다. 다시 시도하세요.');
        }
        throw new Error('파일 조회 실패: ' + getRes.status);
      }
      const meta = await getRes.json();

      // 2. PUT (commit)
      const putRes = await fetch(apiBase + '/contents/' + updated.path, {
        method: 'PUT',
        headers: {
          Authorization: 'token ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '자료실: ' + updated.title + ' ' + data.version + ' 게시',
          content: btoa(unescape(encodeURIComponent(newHtml))),
          sha: meta.sha
        })
      });
      if(!putRes.ok){
        const err = await putRes.text();
        throw new Error('커밋 실패: ' + putRes.status + ' ' + err);
      }
      const result = await putRes.json();

      // localStorage 갱신
      const allBooks = loadBooks();
      const idx = allBooks.findIndex(b => b.id === SB_CURRENT);
      if(idx >= 0) allBooks[idx] = updated; else allBooks.push(updated);
      saveBooks(allBooks);

      status.innerHTML = `<div style="background:#E8F5E8;border:1px solid #4CAF50;border-radius:8px;padding:12px 16px;color:#1B5E20;line-height:1.6;">
        ✓ <strong>GitHub에 배포 완료!</strong><br>
        <span style="font-size:12px;">커밋: <a href="${result.commit.html_url}" target="_blank" style="color:#1B5E20;text-decoration:underline;">${result.commit.sha.slice(0,7)}</a> · 1~2분 안에 사이트에 반영됩니다.</span><br>
        <a href="${updated.path}" target="_blank" style="font-size:12px;color:var(--gold);font-weight:700;">결과 확인 →</a>
      </div>`;
      sbRenderHistory();
    } catch(e){
      status.innerHTML = '<span style="color:#c0392b;">⚠ ' + e.message + '</span>';
    }
  };

})();


/* ===== FINAL SAFETY PATCH: admin entrance + global function exposure ===== */
(function(){
  const VERSION = 'y-life-admin-final-repair-2026-04-27-0209';
  window.YLIFE_PATCH_VERSION = VERSION;

  function safeOpenAdminLogin(){
    const modal = document.getElementById('adminLoginModal');
    if(modal){
      modal.classList.add('open');
      return true;
    }
    if(typeof window.openModal === 'function'){
      window.openModal('adminLoginModal');
      return true;
    }
    alert('관리자 로그인창을 찾지 못했습니다. index.html 반영 상태를 확인하세요.');
    return false;
  }

  window.safeOpenAdminLogin = safeOpenAdminLogin;

  document.addEventListener('keydown', function(e){
    if(e.ctrlKey && e.altKey && String(e.key || '').toLowerCase() === 'a'){
      e.preventDefault();
      safeOpenAdminLogin();
    }
  });

  window.addEventListener('load', function(){
    if(location.hash === '#admin'){
      setTimeout(safeOpenAdminLogin, 300);
    }
  });

  window.addEventListener('hashchange', function(){
    if(location.hash === '#admin'){
      safeOpenAdminLogin();
    }
  });

  // 기존 함수들이 전역에서 보이지 않는 경우를 대비한 노출 확인
  try {
    if(typeof openAllPosts === 'function') window.openAllPosts = openAllPosts;
    if(typeof closeAllPosts === 'function') window.closeAllPosts = closeAllPosts;
    if(typeof doAdminLogin === 'function') window.doAdminLogin = doAdminLogin;
    if(typeof openAdminDashboard === 'function') window.openAdminDashboard = openAdminDashboard;
    if(typeof closeModal === 'function') window.closeModal = closeModal;
    if(typeof adminPwAutoFix === 'function') window.adminPwAutoFix = adminPwAutoFix;
    if(typeof toggleAdminPwView === 'function') window.toggleAdminPwView = toggleAdminPwView;
  } catch(e) {
    console.warn('YLIFE function exposure check failed:', e);
  }

  console.log('YLIFE PATCH VERSION:', VERSION);
})();



