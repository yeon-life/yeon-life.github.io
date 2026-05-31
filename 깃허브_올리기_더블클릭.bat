@echo off
chcp 65001 > nul
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   y-life 사이트빌더 — GitHub 자동 업로드    ║
echo  ╚══════════════════════════════════════════╝
echo.

echo [1/4] 상위 원본 data 폴더 동기화 확인...
xcopy /E /Y /I "c:\Claude\연라이프\data" "C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\data" > nul

cd /d "C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"

echo [2/4] 변경 파일 및 Untracked 검수...
git status

echo.
echo [3/4] 저장소 일괄 추가 및 커밋 준비...
git add .
git commit -m "chore: auto-sync data and deploy latest updates"

echo.
echo [4/4] GitHub에 올리는 중...
git push

echo.
echo  ✅ 완료! y-life.github.io 에 빈틈없이 반영됐습니다.
echo.
pause
