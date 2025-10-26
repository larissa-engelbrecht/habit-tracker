#!/bin/bash

# ============================================
# Habit Tracker - Automated Installation Script
# For Mac/Linux Systems
# ============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "  HABIT TRACKER - INSTALLATION SCRIPT"
echo "========================================"
echo ""
echo "This script will install and set up the Habit Tracker application."
echo "Please ensure you have Python 3.8+ and Node.js 18+ installed."
echo ""
read -p "Press Enter to continue..."

# Function to print colored output
print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Check if Python is installed
echo ""
echo "[1/9] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    print_error "Python3 is not installed!"
    echo "Please install Python 3.8 or higher from https://www.python.org/downloads/"
    exit 1
fi
print_status "Python is installed"
python3 --version

# Check if Node.js is installed
echo ""
echo "[2/9] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo "Please install Node.js 18 or higher from https://nodejs.org/"
    exit 1
fi
print_status "Node.js is installed"
node --version
npm --version

# Navigate to backend directory
echo ""
echo "[3/9] Setting up backend..."
if [ ! -d "habit_tracker_backend" ]; then
    print_error "Could not find habit_tracker_backend directory!"
    echo "Please ensure you're running this script from the project root directory."
    exit 1
fi
cd habit_tracker_backend

# Create virtual environment
echo ""
echo "[4/9] Creating Python virtual environment..."
if [ -d "venv" ]; then
    print_info "Virtual environment already exists. Skipping creation."
else
    python3 -m venv venv
    print_status "Virtual environment created"
fi

# Activate virtual environment and install dependencies
echo ""
echo "[5/9] Installing backend dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
print_status "Backend dependencies installed"

# Create backend .env file
echo ""
echo "[6/9] Checking for backend .env file..."
if [ -f ".env" ]; then
    print_status "Backend .env file already exists."
else
    print_info "Creating backend .env file..."
    echo "Generating new Django SECRET_KEY..."
    SECRET_KEY=$(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
    
    cat > .env << EOF
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
SECRET_KEY=$SECRET_KEY
EOF
    print_status "Backend .env file created with a new SECRET_KEY."
fi

# Run database migrations
echo ""
echo "[7/9] Running database migrations..."
python manage.py makemigrations
python manage.py migrate
print_status "Database migrations completed"

# Deactivate virtual environment
deactivate

# Navigate to frontend directory
echo ""
echo "[8/9] Setting up frontend..."
cd ../habit_tracker_frontend
if [ ! -d "../habit_tracker_frontend" ]; then
    print_error "Could not find habit_tracker_frontend directory!"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "[9/9] Installing frontend dependencies..."
echo "This may take a few minutes..."
npm install
print_status "Frontend dependencies installed"

# Create frontend .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    print_info "Creating frontend .env file..."
    cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_API_PRELOADED_HABITS_URL=/api/habits/preloaded/
VITE_API_CREATE_HABIT_URL=/api/habits/create/
VITE_API_DASHBOARD_URL=/api/habits/dashboard/
VITE_API_STATS_URL=/api/habits/stats/
VITE_API_ACTIVE_HABITS_URL=/api/habits/active/
EOF
    print_status "Frontend .env file created"
fi

# Installation complete
cd ..
echo ""
echo "========================================"
echo "  INSTALLATION COMPLETED SUCCESSFULLY!"
echo "========================================"
echo ""
echo "This script has created default .env files in the"
echo "backend and frontend directories for you."
echo ""
echo "To run the application:"
echo ""
echo "1. Start the Backend Server:"
echo "   cd habit_tracker_backend"
echo "   source venv/bin/activate"
echo "   python manage.py runserver"
echo ""
echo "2. In a NEW terminal, start the Frontend Server:"
echo "   cd habit_tracker_frontend"
echo "   npm run dev"
echo ""
echo "3. Open your browser to: http://localhost:5173"
echo ""
echo "Additional Commands:"
echo ""
echo "- Clear Database:"
echo "  cd habit_tracker_backend"
echo "  source venv/bin/activate"
echo "  python manage.py clear_db"
echo ""
echo "- Create Superuser (for Django Admin) - optional:"
echo "  cd habit_tracker_backend"
echo "  source venv/bin/activate"
echo "  python manage.py createsuperuser"
echo ""
echo "========================================"
echo ""