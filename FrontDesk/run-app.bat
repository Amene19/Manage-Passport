@echo off
echo Starting Passport Admin Application in Debug Mode...

REM Clean previous build
call node clean.js

REM Rebuild the application
call npm run build

REM Check if build was successful
if not exist "dist\index.html" (
  echo ERROR: index.html not found after build!
  echo Check the webpack config and build process.
  exit /b 1
)

if not exist "dist\main.js" (
  echo ERROR: main.js not found after build!
  echo Check the webpack config and build process.
  exit /b 1
)

if not exist "dist\preload.js" (
  echo ERROR: preload.js not found after build!
  echo Check the webpack config and build process.
  exit /b 1
)

if not exist "dist\renderer.js" (
  echo ERROR: renderer.js not found after build!
  echo Check the webpack config and build process.
  exit /b 1
)

echo Build completed successfully. All required files are present.
echo Starting application...

REM Start the app with debugging environment variable
SET DEBUG=electron:*
call npm start

echo Application closed. 