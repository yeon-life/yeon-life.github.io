@echo off
echo ==========================================
echo   y-life Main Website - Vercel Deploy
echo ==========================================
echo.
echo [1/2] Moving to deploy directory...
cd /d "%~dp0"
echo.
echo [2/2] Running Vercel deployment...
echo * A browser window will open for a 1-time login if you are not authenticated.
echo.
call npx vercel --prod
echo.
echo Deploy finished! Please check your Vercel dashboard.
echo.
pause
