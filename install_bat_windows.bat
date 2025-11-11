@echo off
setlocal enabledelayedexpansion
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

REM ============================================
REM 1. Check if Python is installed
REM ============================================
echo.
echo [1/10] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)
for /f "delims=" %%i in ('python --version') do echo [OK] Python version: %%i

REM ============================================
REM 2. Check if Node.js and npm are installed
REM ============================================
echo.
echo [2/10] Checking Node.js and npm installation...

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18 or higher from https://nodejs.org/
    pause
    exit /b 1
)

for /f "usebackq tokens=* delims=" %%i in (`node --version`) do (
    echo [OK] Node.js version: %%i
)

REM ============================================
REM 3. Backend Setup
REM ============================================
echo.
echo [3/10] Setting up backend...

if not exist "habit_tracker_backend\" (
    echo [ERROR] Could not find habit_tracker_backend directory!
    echo Please ensure you're running this script from the project root directory.
    pause
    exit /b 1
)
cd habit_tracker_backend

REM ============================================
REM 4. Create virtual environment
REM ============================================
echo.
echo [4/10] Creating Python virtual environment...
if exist venv (
    echo Virtual environment already exists. Skipping creation.
) else (
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment!
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created.
)

REM ============================================
REM 5. Activate venv and install backend dependencies
REM ============================================
echo.
echo [5/10] Installing backend dependencies...
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
echo [OK] Backend dependencies installed successfully.

REM ============================================
REM 6. Create backend .env file
REM ============================================
echo.
echo [6/10] Checking for backend .env file...
if exist .env (
    echo [OK] Backend .env file already exists.
) else (
    echo Creating backend .env file...
    echo Generating new Django SECRET_KEY...
    for /f "delims=" %%i in ('python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"') do set "SECRET_KEY=%%i"

    (
        echo DEBUG=True
        echo ALLOWED_HOSTS=localhost,127.0.0.1
        echo SECRET_KEY=!SECRET_KEY!
    ) > .env
    echo [OK] Backend .env file created successfully.
)

REM ============================================
REM 7. Run database migrations
REM ============================================
echo.
echo [7/10] Running database migrations...
python manage.py makemigrations
python manage.py migrate
if errorlevel 1 (
    echo [ERROR] Database migration failed!
    pause
    exit /b 1
)
echo [OK] Database migrations completed successfully.

REM Deactivate virtual environment
call venv\Scripts\deactivate.bat

REM ============================================
REM 8. Frontend Setup
REM ============================================
echo.
echo [8/10] Setting up frontend...
cd ..
if not exist "habit_tracker_frontend\" (
    echo [ERROR] Could not find habit_tracker_frontend directory!
    pause
    exit /b 1
)
cd habit_tracker_frontend

REM ============================================
REM 9. Install frontend dependencies
REM ============================================
echo.
echo [9/10] Installing frontend dependencies...
echo This may take a few minutes...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies!
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed successfully.

REM ============================================
REM 10. Create frontend .env file
REM ============================================
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
    echo [OK] Frontend .env file created successfully.
)

REM ============================================
REM Installation Complete
REM ============================================
REM ============================================
REM Start backend and frontend automatically
REM ============================================
echo.
cd ..
echo Starting backend...
start "" "backend-start.bat"

echo Starting frontend...
start "" "frontend-start.bat"

echo.
echo Opening frontend in your default browser...
start http://localhost:5173

echo.
echo [INFO] Backend running on http://localhost:8000
echo [INFO] Frontend running on http://localhost:5173
echo To edit code, open the project in your preferred IDE (e.g., VSCode).
pause
exit /b 0