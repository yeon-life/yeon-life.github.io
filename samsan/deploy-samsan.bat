@echo off
echo ==========================================
echo   Samsan - Cloudflare Pages Deploy
echo ==========================================
echo.
echo [1/2] Checking directory...
set "samsanDir=%~dp0"
echo Path: %samsanDir%
echo.
echo [2/2] Running Cloudflare Pages deployment...
echo * A browser window will open for a 1-time login if you are not authenticated.
echo.
call npx wrangler pages deploy "%samsanDir%" --project-name yeon-samsan
echo.
echo Deploy finished! Please check your Cloudflare dashboard.
echo.
pause
