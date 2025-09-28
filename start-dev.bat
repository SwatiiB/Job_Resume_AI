@echo off
echo.
echo ================================
echo  Resume Refresh Platform Setup
echo ================================
echo.

echo Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js is installed
node --version

REM Check if MongoDB is running
echo.
echo Checking MongoDB connection...
mongosh --eval "db.adminCommand('ismaster')" --quiet >nul 2>&1
if errorlevel 1 (
    echo WARNING: MongoDB is not running or not accessible
    echo Please start MongoDB service:
    echo   - Windows: net start MongoDB
    echo   - Or install MongoDB from https://www.mongodb.com/
    echo.
    echo Continuing anyway... you can start MongoDB later
) else (
    echo ✓ MongoDB is running
)

echo.
echo Installing dependencies...
echo.

REM Install root dependencies
echo Installing root dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

REM Install frontend dependencies
echo Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo ================================
echo  Setup Complete!
echo ================================
echo.
echo The Resume Refresh Platform is ready to run.
echo.
echo To start the development servers:
echo   npm run dev
echo.
echo This will start:
echo   - Backend API server on http://localhost:5000
echo   - Frontend React app on http://localhost:3000
echo.
echo Make sure to:
echo   1. Configure backend/.env with your API keys
echo   2. Start MongoDB if not already running
echo   3. Check SETUP.md for detailed configuration
echo.
pause
