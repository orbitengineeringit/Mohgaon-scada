@echo off
REM SCADA Web Application Auto-Start Script
REM Place this in Windows Startup folder: shell:startup

echo Starting SCADA Monitoring System...
echo.

REM Navigate to project directory (update this path)
cd /d "%~dp0.."

REM Start the development server
start "SCADA Server" cmd /c "npm run dev"

REM Wait for server to start
timeout /t 5 /nobreak >nul

REM Open browser to SCADA dashboard
start "" "http://localhost:8080"

echo SCADA System Started Successfully!
echo Press any key to close this window...
pause >nul