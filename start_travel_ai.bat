@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ================================================
echo   AI 旅遊行程整理器 - 本機版
echo ====================================
echo.

set "PYTHON="
if exist "%LocalAppData%\Programs\Python\Python312\python.exe" set "PYTHON=%LocalAppData%\Programs\Python\Python312\python.exe"
if not defined PYTHON if exist "%ProgramFiles%\Python312\python.exe" set "PYTHON=%ProgramFiles%\Python312\python.exe"
if not defined PYTHON set "PYTHON=python"

%PYTHON% --version >nul 2>&1
if errorlevel 1 (
  echo 找不到 Python 3.11 或 3.12。
  echo 請先安裝：https://www.python.org/downloads/
  pause
  exit /b 1
)

echo 使用 Python：
%PYTHON% --version
%PYTHON% -m pip install -r requirements.txt
if errorlevel 1 (
  echo 套件安裝失敗，請確認網路連線或以系統管理員執行。
  pause
  exit /b 1
)

echo.
echo 正在啟動本機服務： http://127.0.0.1:8765/
echo 關閉此視窗即可停止服務。
echo.
start "AI 旅遊行程整理器" http://127.0.0.1:8765/
%PYTHON% server.py
pause
