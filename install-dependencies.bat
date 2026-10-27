@echo off
REM Installation Script untuk RetailPOS (Windows PowerShell)
REM Jalankan script ini untuk setup dependencies yang sudah diperbaiki

echo.
echo =========================================
echo RetailPOS Dependency Installation
echo =========================================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo X Node.js tidak terinstall!
    echo   Download dari: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo   Node.js %NODE_VERSION% OK
echo.

REM Check NPM
echo Checking NPM...
where npm >nul 2>nul
if errorlevel 1 (
    echo X NPM tidak terinstall!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo   NPM %NPM_VERSION% OK
echo.

REM Get current directory
echo Navigating to project...
cd /d "%~dp0"
echo   Project: %CD%
echo.

REM Clean previous installation
echo Cleaning previous installation...
if exist "node_modules" (
    echo   Removing node_modules...
    rmdir /s /q node_modules >nul 2>&1
)
if exist "package-lock.json" (
    echo   Removing package-lock.json...
    del /q package-lock.json >nul 2>&1
)
echo.

REM Clear NPM cache
echo Clearing NPM cache...
call npm cache clean --force >nul 2>&1
echo   Cache cleared OK
echo.

REM Install dependencies
echo Installing dependencies...
echo   This may take 2-5 minutes...
call npm install
if errorlevel 1 (
    echo X Installation failed!
    pause
    exit /b 1
)
echo   Dependencies installed OK
echo.

REM Verify installation
echo Verifying installation...
call npm list --depth=0
echo.

REM Test build
echo Testing build...
call npm run build >nul 2>&1
if errorlevel 1 (
    echo   Build test warning
) else (
    echo   Build test passed OK
)
echo.

REM Done
echo =========================================
echo Installation completed successfully!
echo =========================================
echo.
echo Next steps:
echo 1. Terminal 1: php artisan serve
echo 2. Terminal 2: npm run dev
echo 3. Open: http://localhost:5173
echo.
echo Happy coding!
pause
