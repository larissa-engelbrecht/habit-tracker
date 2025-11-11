@echo off
title Habit Tracker - Backend
color 0A
cd habit_tracker_backend
call venv\Scripts\activate.bat
echo ========================================
echo   HABIT TRACKER BACKEND
echo   Running on http://localhost:8000
echo ========================================
python manage.py runserver
