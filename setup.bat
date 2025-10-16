@echo off
echo ========================================
echo   SabPaisa UI Setup Script
echo ========================================
echo.

echo Checking Node.js version...
node --version
echo.

echo Checking npm version...
npm --version
echo.

echo ========================================
echo Installing dependencies...
echo This may take a few minutes...
echo ========================================
npm install

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   ERROR: Failed to install dependencies
    echo ========================================
    echo Please try:
    echo 1. Delete node_modules folder and package-lock.json
    echo 2. Run: npm cache clean --force
    echo 3. Run this script again
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo To start the application, run:
echo   npm start
echo.
echo Or press F5 in VS Code and select "npm start"
echo.
pause