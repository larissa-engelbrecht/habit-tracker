# 🎯 Habit Tracker Application

A comprehensive full-stack habit tracking application built with **Django REST Framework** backend and **React + TypeScript** frontend. Track your daily, weekly, and monthly habits with detailed statistics, streaks, and beautiful visualizations.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Installation](#-quick-installation)
- [Manual Installation](#-manual-installation)
- [Running the Application](#-running-the-application)
- [Database Management](#-database-management)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## ✨ Features

- **Flexible Habit Creation**: Create custom habits or choose from pre-loaded templates
- **Multiple Periodicities**: Track daily, weekly (with specific days), or monthly habits
- **Smart Period Tracking**: Automatic period completion detection and progress tracking
- **Comprehensive Statistics**: View completion rates, streaks, and performance metrics
- **Visual Dashboard**: Beautiful Material-UI interface with real-time progress updates
- **Habit Management**: Full CRUD operations for habits and completions
- **Database Tools**: Easy database reset and management utilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Backend

- **Django 5.2.4** - Python web framework
- **Django REST Framework 3.16.0** - RESTful API toolkit
- **SQLite** - Default database (easily swappable)
- **Django CORS Headers** - Cross-origin resource sharing

### Frontend

- **React 19.1.0** - UI library
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Vite 7.0.4** - Fast build tool and dev server
- **Material-UI 7.2.0** - Component library
- **Axios 1.11.0** - HTTP client
- **React Router 7.7.0** - Client-side routing
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **date-fns** - Date utility library

## 📦 Prerequisites

Before installing, ensure you have the following installed on your system:

- **Python 3.8 or higher** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18.0 or higher** - [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (optional, for cloning the repository)

### Verify Installation

Open your terminal/command prompt and run:

```bash
python --version
node --version
npm --version
```

## 🚀 Quick Installation

### Option 1: Automated Installation (Windows)

1. **Download** the `install.bat` file
2. **Double-click** `install.bat` or run it from command prompt:
   ```cmd
   install.bat
   ```
3. The script will:
   - Check for Python and Node.js
   - Create a virtual environment
   - Install all backend dependencies
   - Install all frontend dependencies
   - Run database migrations
   - Create sample habit templates

### Option 2: Automated Installation (Mac/Linux)

1. **Download** the `install.sh` file
2. Make it executable:
   ```bash
   chmod +x install.sh
   ```
3. Run the script:
   ```bash
   ./install.sh
   ```

## 🔧 Manual Installation

### Step 1: Clone or Download the Project

```bash
git clone <repository-url>
cd habit-tracker
```

Or download and extract the ZIP file.

### Step 2: Backend Setup

1. **Navigate to the backend directory:**

   ```bash
   cd habit_tracker_backend
   ```

2. **Create a virtual environment:**

   **Windows:**

   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```

   **Mac/Linux:**

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations:**

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create sample habit templates (optional):**

   ```bash
   python manage.py shell < create_templates.py
   ```

   _Note: If you have a `create_templates.py` or similar seed script_

### Step 3: Frontend Setup

1. **Open a new terminal and navigate to the frontend directory:**

   ```bash
   cd habit_tracker_frontend
   ```

2. **Install Node.js dependencies:**

   ```bash
   npm install
   ```

   Or if you prefer yarn:

   ```bash
   yarn install
   ```

3. **API Configuration (Optional):**

   The frontend is configured to connect to `http://localhost:8000` by default.

   If your Django backend runs on a different port, update the configuration in:

   `habit_tracker_frontend/src/config/api.ts`

   ````typescript
      export const API_CONFIG = {
        BASE_URL: 'http://localhost:8000',  // Change this if needed
        ENDPOINTS: {
          // ... endpoints are already configured
        }
      };

## 🎮 Running the Application

You need to run both the backend and frontend servers simultaneously.

### Start the Backend Server

1. **Navigate to the backend directory:**

   ```bash
   cd habit_tracker_backend
   ````

2. **Activate the virtual environment** (if not already activated):

   **Windows:**

   ```cmd
   venv\Scripts\activate
   ```

   **Mac/Linux:**

   ```bash
   source venv/bin/activate
   ```

3. **Start the Django development server:**

   ```bash
   python manage.py runserver
   ```

   The backend will be available at: `http://localhost:8000`

### Start the Frontend Server

1. **Open a new terminal and navigate to the frontend directory:**

   ```bash
   cd habit_tracker_frontend
   ```

2. **Start the Vite development server:**

   ```bash
   npm run dev
   ```

   Or with yarn:

   ```bash
   yarn dev
   ```

   The frontend will be available at: `http://localhost:5173`

### Access the Application

Open your browser and navigate to: **http://localhost:5173**

## 🗄️ Database Management

### Clear the Database

To reset all habit data and start fresh:

#### Method 1: Using the Python Script

1. **Navigate to the backend directory:**

   ```bash
   cd habit_tracker_backend
   ```

2. **Activate virtual environment:**

   **Windows:**

   ```cmd
   venv\Scripts\activate
   ```

   **Mac/Linux:**

   ```bash
   source venv/bin/activate
   ```

3. **Run the clear database script:**
   ```bash
   python clear_db.py
   ```

This will delete all:

- Habit records
- Habit completions
- Period completions

#### Method 2: Using Django Commands

1. **Delete the database file:**

   ```bash
   cd habit_tracker_backend
   rm db.sqlite3  # Mac/Linux
   del db.sqlite3  # Windows
   ```

2. **Run migrations again:**
   ```bash
   python manage.py migrate
   ```

### Backup the Database

To backup your database:

```bash
cd habit_tracker_backend
cp db.sqlite3 db.sqlite3.backup
```

### View Database Contents

You can use the Django admin interface:

1. **Create a superuser:**

   ```bash
   python manage.py createsuperuser
   ```

2. **Start the server and navigate to:**
   ```
   http://localhost:8000/admin
   ```

## 📁 Project Structure

```
habit-tracker/
├── habit_tracker_backend/          # Django backend
│   ├── habit_tracker_backend/      # Project settings
│   │   ├── settings.py             # Django configuration
│   │   ├── urls.py                 # Main URL routing
│   │   ├── wsgi.py                 # WSGI config
│   │   └── asgi.py                 # ASGI config
│   ├── habits/                     # Habits app
│   │   ├── models.py               # Database models
│   │   ├── serializers.py          # DRF serializers
│   │   ├── views.py                # API views
│   │   ├── urls.py                 # App URL routing
│   │   └── admin.py                # Admin configuration
│   ├── manage.py                   # Django management script
│   ├── clear_db.py                 # Database cleanup utility
│   ├── requirements.txt            # Python dependencies
│   └── db.sqlite3                  # SQLite database
│
├── habit_tracker_frontend/         # React frontend
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── Types.ts            # TypeScript type definitions
│   │   │   ├── HabitForm.tsx       # Habit creation form
│   │   │   ├── MaterialIcon.tsx    # Icon component
│   │   │   └── UniversalModal.tsx  # Modal component
│   │   ├── pages/                  # Page components
│   │   │   ├── Welcome.tsx         # Welcome/onboarding page
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   └── Stats.tsx           # Statistics page
│   │   ├── services/               # API services
│   │   │   └── habitService.ts     # Habit API client
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── App.tsx                 # Root component
│   │   └── main.tsx                # Application entry point
│   ├── public/                     # Static assets
│   ├── package.json                # Node dependencies
│   ├── vite.config.ts              # Vite configuration
│   ├── tsconfig.json               # TypeScript config
│   └── tailwind.config.js          # Tailwind CSS config
│
├── install.bat                     # Windows installation script
├── install.sh                      # Mac/Linux installation script
└── README.md                       # This file
```

## 🔌 API Endpoints

### Habits

| Method | Endpoint                            | Description                        |
| ------ | ----------------------------------- | ---------------------------------- |
| GET    | `/api/habits/preloaded/`            | Get available habit templates      |
| GET    | `/api/habits/active/`               | Check if user has active habits    |
| GET    | `/api/habits/dashboard/`            | Get dashboard data with all habits |
| GET    | `/api/habits/stats/`                | Get comprehensive statistics       |
| POST   | `/api/habits/create/`               | Create a new custom habit          |
| POST   | `/api/habits/templates/<id>/start/` | Start a habit from template        |
| PUT    | `/api/habits/<id>/update/`          | Update an existing habit           |
| DELETE | `/api/habits/<id>/delete/`          | Delete a habit                     |
| POST   | `/api/habits/<id>/complete/`        | Mark habit as completed            |
| POST   | `/api/habits/<id>/uncomplete/`      | Unmark habit completion            |

### Request/Response Examples

#### Create Habit

```json
POST /api/habits/create/
{
  "name": "Morning Exercise",
  "category": "Health & Fitness",
  "goal_description": "Exercise for 30 minutes",
  "periodicity": "daily",
  "frequency": 1,
  "icon": "fitness_center",
  "duration_weeks": 12
}
```

#### Complete Habit

```json
POST /api/habits/<id>/complete/
{
  "completion_date": "2025-10-09"
}
```

## 🔐 Environment Variables

### Backend (.env in habit_tracker_backend/)

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (.env in habit_tracker_frontend/)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_PRELOADED_HABITS_URL=/api/habits/preloaded/
VITE_API_CREATE_HABIT_URL=/api/habits/create/
VITE_API_DASHBOARD_URL=/api/habits/dashboard/
VITE_API_STATS_URL=/api/habits/stats/
VITE_API_ACTIVE_HABITS_URL=/api/habits/active/
```

## 🐛 Troubleshooting

### Backend Issues

**Problem: "Module not found" error**

```bash
# Solution: Ensure virtual environment is activated and dependencies installed
cd habit_tracker_backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

**Problem: "Port 8000 is already in use"**

```bash
# Solution: Run on a different port
python manage.py runserver 8001
# Update frontend .env with new port
```

**Problem: Database errors**

```bash
# Solution: Reset migrations
python manage.py migrate --run-syncdb
```

### Frontend Issues

**Problem: "Cannot find module" error**

```bash
# Solution: Delete node_modules and reinstall
rm -rf node_modules package-lock.json  # Mac/Linux
rmdir /s node_modules & del package-lock.json  # Windows
npm install
```

**Problem: CORS errors**

```bash
# Solution: Verify CORS settings in Django settings.py
# Ensure CORS_ALLOW_ALL_ORIGINS = True for development
```

**Problem: "Port 5173 is already in use"**

```bash
# Solution: Kill the process or use a different port
npm run dev -- --port 3000
```

### Common Issues

**Problem: Backend and frontend can't communicate**

- Verify both servers are running
- Check that backend is on port 8000 and frontend on 5173
- Verify `.env` file has correct API URLs
- Check browser console for CORS errors

**Problem: Virtual environment not activating**

```bash
# Windows: You may need to allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Material-UI for the component library
- Django and Django REST Framework for the robust backend
- React and Vite for the fast frontend experience
- All contributors and users of this application

## 📞 Support

For issues, questions, or suggestions:

- Open an issue on GitHub

---

# NOTE: This is a development/university project.

# In production, SECRET_KEY should be stored in environment variables.

**Happy Habit Tracking! 🎯**
