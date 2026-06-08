# y-life.kr 배포 가이드

## 🚀 빠른 시작 (3단계)

### Step 1: PowerShell 열기
Windows 키 + R → `powershell` 입력 → Enter

### Step 2: 스크립트 실행
```powershell
cd "C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작"
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

또는 더 간단하게:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\deploy.ps1
```

### Step 3: 완료 확인
약 30초 후 https://y-life.kr 에서 업데이트 확인

---

## 📋 준비된 파일들

```
연라이프 홈페이지 제작/
├── index.html ⭐ (배포할 파일 - 새 디자인 적용)
├── deploy.ps1 (PowerShell 배포 스크립트)
├── upload_to_github.py (Python 업로드 스크립트)
├── push_to_github.sh (Bash 푸시 스크립트)
└── DEPLOY_GUIDE.md (이 파일)
```

---

## ✅ 배포 스크립트가 하는 일

1. ✓ OneDrive 폴더에서 index.html 확인
2. ✓ GitHub 저장소 자동 찾기 (세 가지 가능한 위치 확인)
3. ✓ 파일을 GitHub 저장소로 복사
4. ✓ Git add, commit, push 자동 실행
5. ✓ GitHub Pages 자동 배포

---

## 🔄 다른 방법들

### Python을 사용하는 경우:
```bash
python upload_to_github.py
```
(GitHub 토큰 필요: `GITHUB_TOKEN` 환경변수 설정)

### Git Bash를 사용하는 경우:
```bash
bash push_to_github.sh
```

---

## 📊 배포 정보

- **저장소**: yeon-life/yeon-life.github.io
- **브랜치**: main
- **커밋 메시지**: "y-life.kr 완전 리뉴얼: 순수 플랫폼 포지셔닝, yeon-design 규칙 적용"
- **반영 시간**: 약 30초 (GitHub Pages)
- **배포 URL**: https://y-life.kr

---

## 🆘 트러블슈팅

### "저장소를 찾을 수 없습니다" 에러
→ GitHub Desktop에서 yeon-life.github.io 저장소를 clone 한 위치 확인
→ 스크립트의 경로가 다르면 `$repoPath` 변수 수정

### "커밋 또는 푸시 실패" 에러
→ GitHub Desktop을 열어서 인증 확인
→ 터미널에서 `git config --global user.name` 및 `git config --global user.email` 설정 확인

### PowerShell 실행 정책 에러
→ 위의 명령어에서 `-ExecutionPolicy Bypass` 옵션 사용

---

## 💡 팁

- 스크립트는 Windows PowerShell 또는 PowerShell Core에서 실행 가능
- GitHub Desktop이 설치되어 있어야 git 명령어 사용 가능
- 스크립트 실행 후 GitHub Desktop에서도 변경사항이 보임
