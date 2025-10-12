import os
import sys
import django

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set the settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'habit_tracker_backend.settings')

try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    sys.exit(1)

from habits.models import Habit, HabitCompletion, PeriodCompletion

def clear_database():
    """Clear all habit-related data from the database"""
    print("Clearing database...")
    
    # Count before deleting
    completions_count = HabitCompletion.objects.count()
    periods_count = PeriodCompletion.objects.count()
    habits_count = Habit.objects.count()
    
    # Delete all data
    HabitCompletion.objects.all().delete()
    PeriodCompletion.objects.all().delete()
    Habit.objects.all().delete()
    
    print(f"Deleted {completions_count} habit completions")
    print(f"Deleted {periods_count} period completions")
    print(f"Deleted {habits_count} habits")
    print("\nDatabase cleared successfully!")
    
    # Verify
    print(f"\nVerification:")
    print(f"Habits remaining: {Habit.objects.count()}")
    print(f"Completions remaining: {HabitCompletion.objects.count()}")
    print(f"Period completions remaining: {PeriodCompletion.objects.count()}")

if __name__ == '__main__':
    clear_database()