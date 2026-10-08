@echo off
rem Subanimo launcher for Windows. Double-click to start.
rem First time Windows may say "Windows protected your PC": click "More info" -> "Run anyway".
rem Ilk seferde "Windows bilgisayarinizi korudu" cikabilir: "Ek bilgi" -> "Yine de calistir".
title Subanimo
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\launch.ps1"
if errorlevel 1 pause
