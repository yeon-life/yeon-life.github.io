# 작업 요청서 — y-life.kr GitHub 배포 문제 해결

## 상황 요약

- GitHub Pages 사이트: `https://yeon-life.github.io` (도메인: y-life.kr)
- 저장소: `https://github.com/yeon-life/yeon-life.github.io`
- 로컬 경로: `C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io`

로컬에서 index.html을 수정하고 git commit까지 완료했습니다.  
**현재 로컬 브랜치가 origin/main보다 3 커밋 앞서 있는 상태**인데,  
git push가 네트워크 오류로 계속 실패합니다.

---

## 오류 메시지

```
fatal: unable to access 'https://github.com/yeon-life/yeon-life.github.io.git/':
getaddrinfo() thread failed to start
```

PowerShell에서 `Invoke-WebRequest`, `curl.exe` 모두 GitHub에 연결 안 됨.  
브라우저에서 github.com 접속은 일부 가능하나 `ERR_NO_BUFFER_SPACE` 오류 발생 중.

---

## 보유 정보

- **GitHub Personal Access Token**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **권한**: public_repo
- **만료**: 2026-05-26

---

## 수정된 파일 내용 (index.html 핵심 변경사항 3가지)

### 변경 1 — 관리자 로그인 모달 (HTML, 약 1397번째 줄)
기존:
```html
<div class="form-group"><input type="password" id="adminPwInput" placeholder="관리자 비밀번호" onkeydown="if(event.key==='Enter')doAdminLogin()"></div>
```
변경 후:
```html
<div class="form-group" style="position:relative">
  <input type="password" id="adminPwInput" placeholder="관리자 비밀번호"
    style="padding-right:40px"
    oninput="adminPwAutoFix(this)"
    onkeydown="if(event.key==='Enter')doAdminLogin()">
  <button type="button" onclick="toggleAdminPwView()" id="adminPwEyeBtn"
    style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;color:var(--ink-soft);line-height:1;padding:0">👁</button>
</div>
```

### 변경 2 — 관리자 JS 함수 추가 + 마스터 비밀번호 (약 3791번째 줄)
기존 `function getAdminPw()` 바로 위에 추가:
```javascript
function toggleAdminPwView(){
  const inp=document.getElementById('adminPwInput');
  const btn=document.getElementById('adminPwEyeBtn');
  if(inp.type==='password'){inp.type='text';btn.textContent='🙈';}
  else{inp.type='password';btn.textContent='👁';}
}
function adminPwAutoFix(el){
  const pos=el.selectionStart;
  const fixed=el.value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g,'').toLowerCase();
  if(el.value!==fixed){el.value=fixed;el.setSelectionRange(pos,pos);}
}
```

그리고 `doAdminLogin()` 함수 수정:
```javascript
function doAdminLogin(){
  const pw=document.getElementById('adminPwInput').value;
  if(pw==='yeon2026'||pw===getAdminPw()){
    if(pw==='yeon2026') LS.set('ylife_admin_pw','yeon2026');
    adminLoggedIn=true;
    closeModal('adminLoginModal');
    openAdminDashboard();
  }else{
    document.getElementById('adminLoginMsg').textContent='비밀번호가 틀렸습니다.';
  }
}
```

### 변경 3 — 관리자 대시보드 JS 오류 수정 (약 3860번째 줄)
`p.likes.length`, `p.comments.length` → 방어 코드로 변경:
```javascript
// 기존
posts.reduce((s,p)=>s+p.likes.length,0)
posts.reduce((s,p)=>s+p.comments.length,0)
// 변경
posts.reduce((s,p)=>s+(p.likes||[]).length,0)
posts.reduce((s,p)=>s+(p.comments||[]).length,0)
```
동일하게 `loadPostMgmt()`와 `syncFromFirebase()` 함수 내부도 수정.

---

## 요청 사항

위 네트워크 환경에서 GitHub에 파일을 배포할 수 있는 방법을 알려주세요.

예: Windows 네트워크 소켓 초기화 방법, git 프록시 설정, 또는 다른 배포 수단.

또는 위 변경사항 3가지를 GitHub 웹 에디터(github.com)에서 직접 수정하는 순서를 알려주세요.
