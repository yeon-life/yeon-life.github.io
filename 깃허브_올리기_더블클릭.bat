@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo    y-life Site Builder - GitHub Auto Sync
echo ==========================================
echo.

echo [1/5] Syncing data folder...
xcopy /E /Y /I "c:\Claude\연라이프\data" "C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\data" > nul

cd /d "C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"

echo [2/5] Running Quality Gate (verify_deployment.py)...
python verify_deployment.py
if errorlevel 1 (
    echo.
    echo ❌ [FAIL] Quality Gate failed! Build aborted.
    echo.
    pause
    exit /b 1
)

echo [3/5] Checking git status...
git status

echo.
echo [4/5] Adding and committing...
git add .
git commit -m "chore: auto-sync data and deploy latest updates"

echo.
echo [5/5] Pushing to GitHub...
git push

echo.
echo [OK] Successfully updated y-life.github.io!
echo.
pause
