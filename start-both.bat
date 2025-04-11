@echo off
echo Starting the Passport Processing System...
echo.

echo Starting Dummy Server...
start cmd /k "cd FrontDesk && run-server.bat"

echo Waiting for Server to initialize (5 seconds)...
timeout /t 5 /nobreak > nul

echo Starting FrontDesk Application...
start cmd /k "cd FrontDesk && npm start"

echo.
echo Both services are now starting...
echo.
echo Server: http://localhost:3001
echo FrontDesk: Desktop App
echo.
echo Press any key to exit this launcher...
pause > nul 