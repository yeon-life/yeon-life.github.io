/* 연수학꾸러미 학생 입장 — 표준 _규칙\학생입장_표준_v1.0_20261029.md · 부품 원본 _학생입장.js 를 이 쪽에 맞게 싼 것 */
(function(){
/* 내 컴퓨터 파일·localhost 로 열면 입장창 없이(제작 확인용) — 선생님은 입장창의 «선생님 입장» 단추(구글 로그인+서버 명단) */
try{if(location.protocol==='file:'||location.hostname==='localhost')return}catch(e){}
const P={id:'eng-gogh-m2',title:'영어 예술가 교재 1 · 빈센트 반 고흐 (중2)',login:true};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store=window.__AS_STORE||{get(k,d){return d},set(k,v){}};
const closeAll=()=>{};
if(!document.getElementById('ykChip')){const c=document.createElement('span');c.id='ykChip';c.className='ykChip';c.style.display='none';document.body.appendChild(c)}
/* ── 학생 입장 : 이름 · 학년 · 전화 끝 4자리 · 비번 — 그 기기에서 처음 한 번만, 그다음은 자동 인식 ──
   표준 _규칙\학생입장_표준_v1.0_20261029.md · Firebase Auth(y-life-e191d) 영구 로그인(Persistence.LOCAL)
   · 같은 주소(yeon-send.web.app) 아래 모든 자료가 한 로그인을 쓴다 · 기록은 student_profiles / student_results / student_marks
   · 시험할 때는 window.__YK_MOCK 으로 통째 바꿔 끼운다(운영 서버에 시험용 가입을 만들지 않는다) */
(function(){
const NEED=P.login!==false;
const GRADES=['초1','초2','초3','초4','초5','초6','중1','중2','중3','고1','고2','고3','기타'];
const DOMAIN='@student.yeon.local';
const DEF_PW='9339yeon';                              // 연소사 정함(10-30): 모든 학생 공통 비밀번호 «9339»(Firebase 6자 이상 규칙에 맞춰 뒤에 글자를 붙인다) — 학생에게는 묻지 않는다
const SRV_MAX_Q=40;                                   // 서버 규칙 한도(문항 40)
const LS={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};

function sha256hex(msg){
 const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const bytes=new TextEncoder().encode(msg),l=bytes.length,nb=((l+9+63)>>6);
 const w=new Uint8Array(nb*64);w.set(bytes);w[l]=0x80;
 const dv=new DataView(w.buffer);dv.setUint32(nb*64-4,(l*8)>>>0);dv.setUint32(nb*64-8,Math.floor(l*8/4294967296));
 let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
 const rotr=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let i=0;i<nb;i++){
  const W=new Array(64);for(let t=0;t<16;t++)W[t]=dv.getUint32(i*64+t*4);
  for(let t=16;t<64;t++){const s0=rotr(W[t-15],7)^rotr(W[t-15],18)^(W[t-15]>>>3),s1=rotr(W[t-2],17)^rotr(W[t-2],19)^(W[t-2]>>>10);W[t]=(W[t-16]+s0+W[t-7]+s1)>>>0}
  let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
  for(let t=0;t<64;t++){const S1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[t]+W[t])>>>0,S0=rotr(a,2)^rotr(a,13)^rotr(a,22),mj=(a&b)^(a&c)^(b&c),t2=(S0+mj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0}
  H=[H[0]+a,H[1]+b,H[2]+c,H[3]+d,H[4]+e,H[5]+f,H[6]+g,H[7]+h].map(x=>x>>>0)}
 return H.map(x=>x.toString(16).padStart(8,'0')).join('')}
const normName=s=>String(s||'').normalize('NFC').replace(/\s+/g,'').toLowerCase();
const emailOf=(nm,g,p4)=>'s-'+sha256hex([normName(nm),g,p4].join('|')).slice(0,20)+DOMAIN;
const sidOf=email=>email.slice(2,22);
const digits=s=>String(s||'').replace(/\D/g,'').slice(0,11);
const okPhone=s=>/^01[0-9]{8,9}$/.test(s);
const fmtPhone=s=>{s=digits(s);if(s.length>=11)return s.replace(/^(\d{3})(\d{4})(\d{4}).*/,'$1-$2-$3');if(s.length===10)return s.replace(/^(\d{3})(\d{3})(\d{4})$/,'$1-$2-$3');if(s.length>7)return s.replace(/^(\d{3})(\d{4})(\d+)$/,'$1-$2-$3');if(s.length>3)return s.replace(/^(\d{3})(\d+)$/,'$1-$2');return s};

/* ── 서버 연결(실제 Firebase) — 시험할 때는 window.__YK_MOCK 이 대신한다 ── */
function realBackend(){
 if(typeof firebase==='undefined'||!firebase.auth||!firebase.firestore)return null;
 const cfg={apiKey:"AIzaSyDW-PpOIQWylbZMAi2HW0KuwuZMnVDsPn4",authDomain:"y-life-e191d.firebaseapp.com",projectId:"y-life-e191d",storageBucket:"y-life-e191d.firebasestorage.app",messagingSenderId:"1097449792266",appId:"1:1097449792266:web:a46db364bc44624f2cd0f3"};
 if(!firebase.apps.length)firebase.initializeApp(cfg);
 const auth=firebase.auth(),db=firebase.firestore(),TS=()=>firebase.firestore.FieldValue.serverTimestamp();
 return{
  onAuth:cb=>{auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{}).then(()=>auth.onAuthStateChanged(u=>cb(u?{uid:u.uid,email:u.email||'',anon:u.isAnonymous}:null)))},
  signIn:(e,p)=>auth.signInWithEmailAndPassword(e,p),
  signUp:(e,p)=>auth.createUserWithEmailAndPassword(e,p),
  signOut:()=>auth.signOut(),
 cur:()=>{const u=auth.currentUser;return u&&!u.isAnonymous&&!/@student\.yeon\.local$/.test(u.email||'')?u:null},
 teacherSignIn:()=>auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()),
 isTeacher:()=>db.collection('student_profiles').limit(1).get().then(()=>true,()=>false),   // 서버 규칙 isYeonTeacher() 명단만 목록을 읽을 수 있다
  getProfile:uid=>db.collection('student_profiles').doc(uid).get().then(d=>d.exists?d.data():null),
  setProfile:(uid,o)=>db.collection('student_profiles').doc(uid).set(Object.assign({},o,{createdAt:TS(),lastSeen:TS()})),
  touch:uid=>db.collection('student_profiles').doc(uid).update({lastSeen:TS()}),
  setPhone:(uid,ph)=>db.collection('student_profiles').doc(uid).update({phone:ph,lastSeen:TS()}),
  addResult:o=>db.collection('student_results').add(Object.assign({},o,{at:TS()})),
  getMarks:(uid,pid)=>db.collection('student_marks').doc(uid+'__'+pid).get().then(d=>d.exists?(d.data().known||null):null),
  setMarks:(uid,pid,title,known)=>db.collection('student_marks').doc(uid+'__'+pid).set({uid:uid,pid:pid,title:title,known:known,at:TS()})
 }}
const B=window.__YK_MOCK||realBackend();

/* ── 상태 ── */
const YK={user:null,prof:null,ready:false};
window.YK=YK;
YK.enabled=()=>!!(B&&YK.user&&YK.prof);
YK.name=()=>YK.prof?YK.prof.name:'';
const wait=(p,ms)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('시간초과')),ms))]);

/* ── 화면 : 처음 한 번만 뜨는 입장 창 ── */
const ov=document.createElement('div');ov.id='ykGate';document.body.appendChild(ov);
function showSplash(){ov.style.display='flex';ov.innerHTML='<div class="ykBox"><p class="ykHello">불러오는 중…</p></div>'}
function hideGate(){ov.style.display='none';ov.innerHTML=''}
/* ── 선생님 입장 : 구글 로그인 → 서버 선생님 명단(isYeonTeacher)이면 입장창 없이 자료를 연다 · 학생 기록은 만들지 않는다 ── */
async function enterTeacher(click){
 try{
  if(!B.cur()){if(!click)return 'no';await B.teacherSignIn()}
  if(!(await wait(B.isTeacher(),8000))){try{await B.signOut()}catch(e){}if(click)nextMsg='선생님으로 등록된 계정이 아니에요. 학생은 위 칸에 이름·학년·전화번호를 적어 주세요.';return click?nextMsg:'no'}
  YK.teacher=true;LS.set('yk_teacher',1);hideGate();drawWho();YK.ready=true;document.dispatchEvent(new CustomEvent('yk-teacher'));return true
 }catch(e){const c=(e&&e.code)||'';
  if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')return '';
  if(c==='auth/popup-blocked')return '팝업이 막혀 있어요. 주소창 오른쪽에서 팝업을 허용해 주세요.';
  if(c==='auth/unauthorized-domain')return '이 주소는 구글 로그인이 허용되어 있지 않아요.';
  return click?'선생님 확인에 실패했어요. 잠시 뒤 다시 눌러 주세요.':'no'}}
let nextMsg='';
function showForm(msg){msg=msg||nextMsg;nextMsg='';
 const last=LS.get('yk_last',null);let needPw=false,cfm=false;
 ov.style.display='flex';
 ov.innerHTML=`<div class="ykBox"><h2>${esc(P.title)}</h2><p class="ykHello">처음 한 번만 적으면 돼요. 이 기기에서는 다음부터 묻지 않습니다.</p>
 <label class="f">이름</label><input id="ykName" type="text" autocomplete="off" value="${esc(last?last.name:'')}" placeholder="예: 홍길동">
 <label class="f">학년</label><select id="ykGrade"><option value="">학년을 골라 주세요</option>${GRADES.map(g=>`<option ${last&&last.grade===g?'selected':''}>${g}</option>`).join('')}</select>
 <label class="f">전화번호</label><input id="ykPh" type="tel" inputmode="numeric" maxlength="13" autocomplete="tel" placeholder="예: 010-1234-5678">
 <p class="ykNote">📱 선생님이 이 번호로 <b>카카오톡·문자 안내</b>를 드려요. 번호가 틀리면 연락이 닿지 않으니 <b>정확하게</b> 적어 주세요. 나중에 «내 정보»에서 고칠 수 있어요.</p>
 <div id="ykCfm" class="ykCfm" style="display:none"><span>이 번호가 맞나요?</span><b id="ykCfmNo"></b><small>맞으면 아래 «맞아요, 들어갈게요»를 눌러 주세요. 다르면 위 칸을 고쳐 주세요.</small></div>
 <div id="ykOldBox" style="display:none"><label class="f">예전에 정한 비밀번호 <small>(처음 들어올 때 직접 정했다면 그 비밀번호)</small></label><input id="ykPw" type="password" autocomplete="current-password" placeholder="비밀번호"></div>
 <p class="ykErr" id="ykErr">${msg?esc(msg):''}</p>
 <div class="qctl"><button class="btn" id="ykGo" type="button">들어가기</button></div>
 <div style="text-align:center;margin-top:16px"><button id="ykTeacher" type="button" style="width:auto;margin:0;padding:8px 16px;font-size:14px;font-weight:700;background:#fff;color:#2d5a68;border:1px solid #cfc9bb">👩‍🏫 선생님 입장</button></div></div>`;
 const err=t=>{$('#ykErr').textContent=t};
 const go=async()=>{
  const nm=normName($('#ykName').value),g=$('#ykGrade').value,ph=digits($('#ykPh').value),p4=ph.slice(-4);
  if(nm.length<1)return err('이름을 적어 주세요');if(!g)return err('학년을 골라 주세요');
  if(!okPhone(ph))return err('전화번호를 010으로 시작하는 숫자 10~11자리로 적어 주세요');
  if(!cfm){cfm=true;$('#ykCfmNo').textContent=fmtPhone(ph);$('#ykCfm').style.display='';$('#ykGo').textContent='맞아요, 들어갈게요';err('');return}
  const old=needPw?$('#ykPw').value:'';if(needPw&&old.length<6)return err('예전에 정한 비밀번호를 적어 주세요(6자 이상)');
  const email=emailOf($('#ykName').value,g,p4);const btn=$('#ykGo');btn.disabled=true;btn.textContent='확인하는 중…';err('');
  const prof={name:$('#ykName').value.trim(),grade:g,phone4:p4,phone:ph,sid:sidOf(email)};LS.set('yk_pending_phone',ph);
  const cantSign=c=>c==='auth/invalid-credential'||c==='auth/wrong-password'||c==='auth/user-not-found'||c==='auth/invalid-login-credentials';
  try{
   try{await B.signIn(email,old||DEF_PW)}
   catch(e){
    const c=(e&&e.code)||'';if(!cantSign(c))throw e;
    if(needPw)throw e;                                       // 예전 비밀번호까지 틀림
    // 처음 보는 학생 → 새로 만든다(가입이 끝나는 순간 onAuth 가 먼저 올 수 있어 프로필을 미리 적어 둔다)
    LS.set('yk_pending_profile',prof);
    try{await B.signUp(email,DEF_PW)}catch(e2){LS.del('yk_pending_profile');throw e2}}
   LS.set('yk_last',{name:prof.name,grade:g});
   // 이어서 onAuth 가 들어오면 profile 을 읽어 마무리한다
  }catch(e){
   const c=(e&&e.code)||'';btn.disabled=false;btn.textContent='들어가기';
   if(c==='auth/email-already-in-use'){needPw=true;$('#ykOldBox').style.display='';$('#ykPw').focus();err('이미 만들어진 학생이에요. 예전에 정한 비밀번호를 적어 주세요.')}
   else if(cantSign(c)&&needPw)err('비밀번호가 맞지 않아요. 예전에 정한 비밀번호를 다시 적어 주세요.');
   else if(c==='auth/network-request-failed')err('인터넷 연결을 확인해 주세요');
   else if(c==='auth/too-many-requests')err('잠시 뒤에 다시 해 주세요');
   else if(c==='auth/unauthorized-domain')err('이 주소에서는 로그인을 쓸 수 없어요. 선생님께 알려 주세요.');
   else err('들어가지 못했어요. 잠시 뒤 다시 해 주세요.')
  }};
 $('#ykTeacher').onclick=async()=>{const b=$('#ykTeacher');b.disabled=true;b.textContent='확인하는 중…';err('');const r=await enterTeacher(true);b.disabled=false;b.textContent='👩‍🏫 선생님 입장';if(r!==true)err(r||'')};
 $('#ykGo').onclick=go;ov.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')go()}));
 $('#ykPh').addEventListener('input',e=>{const v=fmtPhone(e.target.value);if(e.target.value!==v)e.target.value=v;if(cfm){cfm=false;$('#ykCfm').style.display='none';$('#ykGo').textContent='들어가기'}});
 setTimeout(()=>{const n=$('#ykName');if(n&&!n.value)n.focus();else{const p=$('#ykPh');if(p)p.focus()}},60);
}

/* ── 학생 이름표(위쪽 작은 글씨) · 다른 학생으로 로그인 ── */
function drawWho(){
 const nm=YK.prof?`${YK.prof.name} · ${YK.prof.grade}`:(YK.teacher?'선생님':'');
 let chip=$('#ykChip');
 if(!chip){const c=$('#cnt');if(c){c.insertAdjacentHTML('beforebegin','<span class="chip ykChip" id="ykChip"></span>');chip=$('#ykChip')}}
 if(chip){chip.textContent=nm;chip.style.display=nm?'':'none';if(!chip.dataset.me){chip.dataset.me='1';chip.style.cursor='pointer';chip.title='내 정보 · 전화번호 확인·수정';chip.onclick=()=>openMe(false)}}
 const po=$('#pOpt');if(po&&!$('#ykWho')){po.insertAdjacentHTML('afterbegin','<h3>학생</h3><div id="ykWho" class="hint" style="margin:0 0 8px"></div><button class="btn alt" id="ykMe" type="button" style="width:100%;margin-bottom:8px">내 정보 · 전화번호 확인·수정</button><button class="btn alt" id="ykOut" type="button" style="width:100%;margin-bottom:8px">다른 학생으로 로그인</button>');
  $('#ykMe').onclick=()=>{closeAll();openMe(false)};
  $('#ykOut').onclick=async()=>{if(!confirm('이 기기에서 로그아웃하고 다른 학생으로 들어갈까요?'))return;try{await B.signOut()}catch(e){}LS.del('yk_profile');location.reload()}}
 const w=$('#ykWho');if(w)w.textContent=nm?nm+' 학생으로 들어와 있어요':'로그인 없이 보는 중이에요'}

/* ── 내 정보 : 전화번호 확인·수정 (선생님이 연락드릴 번호 · 처음 입장 때 이미 확인했으므로 제출할 때마다 다시 묻지 않는다) ── */
function openMe(first){
 if(!YK.prof||!YK.user||$('#ykMeBox'))return;
 const o=document.createElement('div');o.id='ykMeBox';o.style.cssText='position:fixed;inset:0;z-index:900;display:flex;align-items:center;justify-content:center;background:rgba(42,46,44,.55);padding:16px;overflow:auto';
 o.innerHTML=`<div class="ykBox"><h2>내 정보</h2>
 <p class="ykHello">${first?'선생님이 연락드릴 전화번호를 아직 못 받았어요. 한 번만 적어 주세요.':'선생님이 이 번호로 카카오톡·문자 안내를 드려요. 번호가 달라졌다면 고쳐 주세요.'}</p>
 <label class="f">이름 · 학년</label><div class="hint" style="margin:0 0 8px">${esc(YK.prof.name)} · ${esc(YK.prof.grade)}</div>
 <label class="f">전화번호</label><input id="ykMePh" type="tel" inputmode="numeric" maxlength="13" autocomplete="tel" placeholder="예: 010-1234-5678" value="${esc(fmtPhone(YK.prof.phone||''))}">
 <p class="ykNote">다른 기기에서 다시 들어올 때는 <b>처음 적었던 번호의 끝 4자리(${esc(YK.prof.phone4)})</b>로 들어와요. 번호를 고쳐도 이 4자리는 그대로예요.</p>
 <p class="ykErr" id="ykMeErr"></p>
 <div class="qctl"><button class="btn alt" id="ykMeX" type="button">${first?'나중에 할게요':'닫기'}</button><button class="btn" id="ykMeSave" type="button">저장</button></div></div>`;
 document.body.appendChild(o);
 const ph=$('#ykMePh'),er=t=>{$('#ykMeErr').textContent=t};
 ph.addEventListener('input',e=>{const v=fmtPhone(e.target.value);if(e.target.value!==v)e.target.value=v});
 $('#ykMeX').onclick=()=>o.remove();
 $('#ykMeSave').onclick=async()=>{const d=digits(ph.value);if(!okPhone(d))return er('전화번호를 010으로 시작하는 숫자 10~11자리로 적어 주세요');
  const b=$('#ykMeSave');b.disabled=true;b.textContent='저장하는 중…';er('');
  try{await wait(B.setPhone(YK.user.uid,d),6000);YK.prof.phone=d;LS.set('yk_profile',YK.prof);b.textContent='저장됨 ✓';setTimeout(()=>o.remove(),900)}
  catch(e){b.disabled=false;b.textContent='저장';er('저장하지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.')}};
 setTimeout(()=>ph.focus(),60)}
YK.openMe=()=>openMe(false);

/* ── 기록 올리기 : 실패하면 기기에 쌓아 뒀다가 다음에 올린다 ── */
function queue(){return LS.get('yk_queue',[])}
function flush(){
 if(!B||!YK.user||!YK.prof)return;const q=queue();if(!q.length)return;LS.set('yk_queue',[]);
 q.forEach(o=>{if(o.uid!==YK.user.uid)return;B.addResult(o).catch(()=>{const n=queue();n.push(o);LS.set('yk_queue',n.slice(-20))})})}
YK.saveResult=function(R){
 // R = {title,pid,sc,mx,sec,items:[{i,k,r,a,q}]} — 로그인한 학생일 때만 서버에 담는다
 if(!B||!YK.user||!YK.prof)return Promise.reject(new Error('로그인 안 됨'));
 const doc={uid:YK.user.uid,name:YK.prof.name,grade:YK.prof.grade,phone4:YK.prof.phone4,title:String(R.title||'').slice(0,120),pid:String(R.pid||'').slice(0,40),kind:'exam',
  sc:R.sc|0,mx:R.mx|0,sec:R.sec|0,items:(R.items||[]).slice(0,SRV_MAX_Q).map(x=>({i:String(x.i),k:x.k|0,r:x.r|0,a:String(x.a||'').slice(0,Math.min(R.aMax|0||240,1000)),q:String(x.q||'').slice(0,Math.min(R.aMax?200:80,200))}))};
 return B.addResult(doc).catch(e=>{const n=queue();n.push(doc);LS.set('yk_queue',n.slice(-20));throw e})};
let marksT=0;
YK.marksChanged=function(known){
 if(!B||!YK.user||!YK.prof)return;clearTimeout(marksT);
 marksT=setTimeout(()=>{B.setMarks(YK.user.uid,P.id,String(P.title||'').slice(0,120),known).catch(()=>{})},2500)};
(function(){const _s=store.set;store.set=function(k,v){_s.call(store,k,v);if(k==='known')YK.marksChanged(v)}})();

/* ── 들어온 뒤 마무리 : 프로필 읽기 · 표시 맞추기 · 쌓인 기록 올리기 ── */
async function finish(u){
 YK.user=u;let prof=null;
 try{prof=await wait(B.getProfile(u.uid),4000)}catch(e){}
 const cache=LS.get('yk_profile',null),pend=LS.get('yk_pending_profile',null);
 if(!prof&&pend){prof=pend;try{await B.setProfile(u.uid,pend)}catch(e){}}
 if(!prof&&cache&&cache.uid===u.uid)prof=cache;
 if(!prof){showForm('학생 정보를 읽지 못했어요. 한 번만 더 적어 주세요.');return}
 LS.del('yk_pending_profile');
 let phone=prof.phone||'';const pp=LS.get('yk_pending_phone',null);LS.del('yk_pending_phone');
 if(!phone&&pp&&okPhone(pp)&&String(pp).slice(-4)===prof.phone4){try{await wait(B.setPhone(u.uid,pp),4000);phone=pp}catch(e){}}
 YK.prof={uid:u.uid,name:prof.name,grade:prof.grade,phone4:prof.phone4,phone:phone};LS.set('yk_profile',YK.prof);
 LS.set('yk_last',{name:prof.name,grade:prof.grade});
 hideGate();drawWho();YK.ready=true;
 if(!YK.prof.phone)setTimeout(()=>openMe(true),600);
 try{B.touch(u.uid).catch(()=>{})}catch(e){}
 try{const m=await wait(B.getMarks(u.uid,P.id),4000);if(m){let ch=false;Object.keys(m).forEach(k=>{if(!known[k]){known[k]=m[k];ch=true}});if(ch){store.set('known',known);render()}}}catch(e){}
 flush();
 document.dispatchEvent(new CustomEvent('yk-ready'))}

/* ── 시작 ── */
if(!B){
 if(NEED){const t=document.createElement('div');t.className='hint';t.style.cssText='padding:8px 16px;text-align:center';t.textContent='연결이 잘 안 돼서 기록이 저장되지 않을 수 있어요. 자료는 그대로 볼 수 있습니다.';document.body.insertBefore(t,document.body.firstChild)}
 drawWho();return}
let gotAuth=false;
if(NEED){
 const cache=LS.get('yk_profile',null);
 if(cache){YK.prof=cache;drawWho()}                 // 이전에 들어온 기기 — 이름표를 먼저 보여 준다(묻지 않는다)
 else if(!LS.get('yk_teacher',0))showSplash();      // 선생님 기기는 구글 로그인이 확인될 때까지 조용히 둔다(입장창을 먼저 띄우지 않는다)
}
B.onAuth(u=>{
 gotAuth=true;
 const ok=u&&!u.anon&&/^s-[0-9a-f]{20}@student\.yeon\.local$/.test(u.email||'');
 if(ok){finish(u);return}
 if(u&&!u.anon){enterTeacher(false).then(r=>{if(r!==true){YK.user=null;YK.prof=null;LS.del('yk_teacher');if(NEED)showForm('')}});return}   // 구글 로그인 기기 — 선생님 명단이면 바로 입장
 YK.user=null;if(!NEED){drawWho();return}
 YK.prof=null;LS.del('yk_profile');showForm('')});          // 로그인이 풀린 기기(저장 데이터가 지워진 경우) — 이름·학년은 미리 채워 두고 비번만 받는다
if(NEED){setTimeout(()=>{
 if(gotAuth)return;
 // 서버가 4초 안에 답이 없음 — 이전에 들어온 기기면 그대로 자료를 열어 두고(묻지 않음), 처음 기기면 입장 창을 띄운다
 const cache=LS.get('yk_profile',null);
 if(cache){hideGate();drawWho()}else showForm('')},4000)}
window.addEventListener('online',flush);
})();

})();
