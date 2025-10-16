@echo off
echo Starting React application with increased memory...
echo.

REM Set memory limit
set NODE_OPTIONS=--max-old-space-size=4096

REM Start the application
npm start

pause