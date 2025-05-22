@echo off
setlocal

echo ==================================================
echo   AdDashboard API & Frontend Baslatma Scripti
echo ==================================================

echo [1/2] API baslatiliyor...
start "AdDashboard API" cmd /k "cd /d %~dp0api && dotnet watch run"

echo (API ayaga kalkarken 5 sn bekleniyor...)
timeout /t 5 /nobreak > nul

echo [2/2] Frontend baslatiliyor
start "AdDashboard Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ==================================================
echo   Servisler baslatildi!
echo   API: http://localhost:5000
echo   Frontend: http://localhost:3000
echo ==================================================
echo.
echo Servisleri durdurmak icin ilgili terminal pencerelerini kapatabilirsiniz.
echo.