@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ================================================
echo   AI Travel Organizer - Local Edition
echo ================================================
echo.

set "PYTHON="
if exist "%LocalAppData%\Programs\Python\Python312\python.exe" set "PYTHON=%LocalAppData%\Programs\Python\Python312\python.exe"
if not defined PYTHON if exist "%ProgramFiles%\Python312\python.exe" set "PYTHON=%ProgramFiles%\Python312\python.exe"
if not defined PYTHON set "PYTHON=python"

%PYTHON% --version >nul 2>&1
if errorlevel 1 (
  echo Python 3.11 or 3.12 was not found.
  echo Install from https://www.python.org/downloads/
  pause
  exit /b 1
)

echo Python:
%PYTHON% --version
%PYTHON% -m pip install -r requirements.txt
if errorlevel 1 (
  echo Dependency installation failed. Check your network connection.
  pause
  exit /b 1
)

echo.
echo Starting local server at http://127.0.0.1:8765/
echo Close this window to stop the server.
echo.
start "AI Travel Organizer" http://127.0.0.1:8765/
%PYTHON% server.py
pause
