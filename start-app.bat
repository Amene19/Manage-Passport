@echo off
echo ===================================================
echo Passport Processing System Launcher
echo ===================================================
echo.

echo Starting Backend Server...
start cmd /k "cd Backend && npm start"

echo Waiting for backend to initialize...
timeout /t 5

echo Starting Web Interface...
start cmd /k "cd FrontWeb && npm run dev"

echo.
echo Both services have been started.
echo.
echo - Backend API is available at http://localhost:3001/api
echo - Frontend Web interface is available at http://localhost:5173
echo.
echo For login, use the credentials created in your database
echo If you need to create a new admin user, use the signup API
echo.
echo Press any key to close this window. The services will continue running.
pause > nul 