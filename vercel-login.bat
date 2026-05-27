@echo off
echo ==========================================
echo   y-life Vercel - Login / Token Refresh
echo ==========================================
echo.
echo Running vercel login to refresh your invalid token...
echo * A browser window will open. Please log in there.
echo.
call npx vercel login
echo.
echo Login process finished. Please try running deploy-main.bat now.
echo.
pause
