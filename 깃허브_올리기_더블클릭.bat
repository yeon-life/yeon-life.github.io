@echo off
chcp 65001 > nul
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   y-life 사이트빌더 — GitHub 업로드      ║
echo  ╚══════════════════════════════════════════╝
echo.

cd /d "C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"

echo [1/3] 변경 파일 확인 중...
git status

echo.
echo [2/3] 저장 중...
git add builder.html
git commit -m "feat: 빌더 버전 v260502 표시 추가"

echo.
echo [3/3] GitHub에 올리는 중...
git push

echo.
echo  ✅ 완료! y-life.github.io 에 반영됐습니다.
echo.
pause
