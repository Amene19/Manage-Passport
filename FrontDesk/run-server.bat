@echo off
cd /d "%~dp0"
echo Starting Passport Processing Dummy Server...
echo.
echo Server will be available at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.
node --inspect dummy-server.js 