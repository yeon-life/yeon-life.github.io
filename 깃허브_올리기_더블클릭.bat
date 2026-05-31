@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo    y-life Site Builder - GitHub Auto Sync
echo ==========================================
echo.

echo [1/4] Syncing data folder...
xcopy /E /Y /I "c:\Claude\연라이프\data" "C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\data" > nul

cd /d "C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"

echo [2/4] Checking git status...
git status

echo.
echo [3/4] Adding and committing...
git add .
git commit -m "chore: auto-sync data and deploy latest updates"

echo.
echo [4/4] Pushing to GitHub...
git push

echo.
echo [OK] Successfully updated y-life.github.io!
echo.
pause
