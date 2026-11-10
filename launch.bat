@echo off
title Terra3D - 3D World Explorer
echo Starting Terra3D Server...
start "" /b "C:\Program Files\nodejs\node.exe" "%~dp0server.js"
timeout /t 1 /nobreak >nul
echo Opening Terra3D in browser...
start "" "http://localhost:5500/"
