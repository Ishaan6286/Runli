@echo off
echo ========================================
echo Restarting Runli Server
echo ========================================
echo.
echo Killing old server processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm run server*" 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Starting server with nodemon...
cd /d "%~dp0"
start "Runli Server" cmd /k "npm run server"
echo.
echo ========================================
echo Server restart initiated!
echo Check the new terminal window for status
echo ========================================
pause
