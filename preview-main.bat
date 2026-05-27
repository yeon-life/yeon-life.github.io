@echo off
echo ==========================================
echo   y-life Main - Local Preview Server (Port 8080)
echo ==========================================
echo.
echo Starting local HTTP server on port 8080...
echo.
start "" "http://localhost:8080/index.html"
python -m http.server 8080
