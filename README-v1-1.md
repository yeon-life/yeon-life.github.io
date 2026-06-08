# y-life.kr v1.1 배포 가이드

## 📋 준비된 파일들

```
📁 연라이프 홈페이지 제작/
├── index-v1-1.html ⭐ (배포용 - 이것을 사용!)
├── y-life-v1-1.jsx (React 버전 - 참고용)
└── README-v1-1.md (이 파일)
```

## 🚀 배포 방법 (연라이프 사이트 배포 세션에서)

### **Step 1: 파일 확인**
현재 위치: `C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\`

파일 목록:
- ✅ `index-v1-1.html` ← **이 파일을 배포 리포에 복사**

### **Step 2: 배포 리포에 복사**
```bash
# yeon-life/yeon-life.github.io 리포 위치로 이동
cd yeon-life.github.io/

# OneDrive에서 파일 복사 (또는 수동으로 복사)
cp C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프\ 홈페이지\ 제작\index-v1-1.html ./index.html

# 또는 v1.1 폴더로 관리
mkdir -p v1.1
cp C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프\ 홈페이지\ 제작\index-v1-1.html ./v1.1/index.html
```

### **Step 3: Git 커밋 & 푸시**
```bash
# 상태 확인
git status

# 추가
git add .

# 커밋
git commit -m "v1.1 배포: 플랫폼 정의, 멀티테넌시, 개인화 뉴스 시스템"

# 푸시
git push origin main
```

### **Step 4: 라이브 확인**
- 약 10초 후 https://yeon-life.github.io/ 에서 v1.1 페이지 확인

---

## 📱 v1.1의 특징

✅ **플랫폼 정체성 명확화**
- 오픈 지식 생산 플랫폼
- 사이트 빌더 강조
- 멀티테넌시 비즈니스 모델

✅ **yeon-design 적용**
- Cool Coastline 컬러
- 응답형 레이아웃
- 모바일 우선

✅ **섹션들**
1. 헤더 + 네비게이션
2. 히어로 섹션
3. 핵심 기능 3가지
4. 개인화 뉴스 시스템 데모
5. 테넌트 사례
6. CTA + 푸터

---

## 💾 파일 경로 (이전 세션에서 접근)

```
절대경로: C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\

- 배포 파일: index-v1-1.html
- React 참고: y-life-v1-1.jsx
- 가이드: README-v1-1.md (이 파일)
```

---

## ✅ 체크리스트

연라이프 사이트 배포 세션에서:
- [ ] OneDrive 경로에서 `index-v1-1.html` 파일 위치 확인
- [ ] 배포 리포(yeon-life.github.io)에 복사
- [ ] `git add .` 실행
- [ ] `git commit -m "v1.1 배포..."` 실행
- [ ] `git push origin main` 실행
- [ ] 10초 후 사이트에서 변경사항 확인
