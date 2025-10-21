@echo off
REM ============================================
REM Habit Tracker - Automated Installation Script
REM For Windows Systems
REM ============================================

echo.
echo ========================================
echo   HABIT TRACKER - INSTALLATION SCRIPT
echo ========================================
echo.
echo This script will install and set up the Habit Tracker application.
echo Please ensure you have Python 3.8+ and Node.js 18+ installed.
echo.
pause

REM Check if Python is installed
echo.
echo [1/8] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)
echo [OK] Python is installed
python --version

REM Check if Node.js is installed
echo.
echo [2/8] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18 or higher from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed
node --version
npm --version

REM Navigate to backend directory
echo.
echo [3/8] Setting up backend...
cd habit_tracker_backend
if errorlevel 1 (
    echo [ERROR] Could not find habit_tracker_backend directory!
    echo Please ensure you're running this script from the project root directory.
    pause
    exit /b 1
)

REM Create virtual environment
echo.
echo [4/8] Creating Python virtual environment...
if exist venv (
    echo Virtual environment already exists. Skipping creation.
) else (
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment!
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
)

REM Activate virtual environment and install dependencies
echo.
echo [5/8] Installing backend dependencies...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment!
    pause
    exit /b 1
)

pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies!
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed

REM Run database migrations
echo.
echo [6/8] Running database migrations...
python manage.py makemigrations
python manage.py migrate
if errorlevel 1 (
    echo [ERROR] Database migration failed!
    pause
    exit /b 1
)
echo [OK] Database migrations completed

REM Deactivate virtual environment
call venv\Scripts\deactivate.bat

REM Navigate to frontend directory
echo.
echo [7/8] Setting up frontend...
cd ..\habit_tracker_frontend
if errorlevel 1 (
    echo [ERROR] Could not find habit_tracker_frontend directory!
    pause
    exit /b 1
)

REM Install frontend dependencies
echo.
echo [8/8] Installing frontend dependencies...
echo This may take a few minutes...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies!
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed

REM Create .env file if it doesn't exist
if not exist .env (
    echo.
    echo Creating frontend .env file...
    (
        echo VITE_API_BASE_URL=http://localhost:8000
        echo VITE_API_PRELOADED_HABITS_URL=/api/habits/preloaded/
        echo VITE_API_CREATE_HABIT_URL=/api/habits/create/
        echo VITE_API_DASHBOARD_URL=/api/habits/dashboard/
        echo VITE_API_STATS_URL=/api/habits/stats/
        echo VITE_API_ACTIVE_HABITS_URL=/api/habits/active/
    ) > .env
    echo [OK] Environment file created
)

REM Installation complete
cd ..
echo.
echo ========================================
echo   INSTALLATION COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo To run the application:
echo.
echo 1. Start the Backend Server:
echo    cd habit_tracker_backend
echo    venv\Scripts\activate
echo    python manage.py runserver
echo.
echo 2. In a NEW terminal, start the Frontend Server:
echo    cd habit_tracker_frontend
echo    npm run dev
echo.
echo 3. Open your browser to: http://localhost:5173
echo.
echo Additional Commands:
echo.
echo - Clear Database:
echo   cd habit_tracker_backend
echo   venv\Scripts\activate
echo   python clear_db.py
echo.
echo ========================================
echo.
pause