"""
Django management command to clear habit data, but only the seed_data not the preloaded habits/habit templates.
"""
from django.core.management.base import BaseCommand
from habits.models import Habit, HabitCompletion, PeriodCompletion

class Command(BaseCommand):
    help = 'Clear all habit-related data from the database'

    def handle(self, *args, **kwargs):
        """Clear all habit-related data from the database"""
        self.stdout.write(self.style.WARNING('Clearing database...'))
        
        # Count before deleting
        completions_count = HabitCompletion.objects.count()
        periods_count = PeriodCompletion.objects.count()
        habits_count = Habit.objects.count()
        
        # Delete all data
        HabitCompletion.objects.all().delete()
        PeriodCompletion.objects.all().delete()
        Habit.objects.all().delete()
        
        self.stdout.write(f"Deleted {completions_count} habit completions")
        self.stdout.write(f"Deleted {periods_count} period completions")
        self.stdout.write(f"Deleted {habits_count} habits")
        self.stdout.write(self.style.SUCCESS('\nDatabase cleared successfully!'))
        
        # Verify
        self.stdout.write(f"\nVerification:")
        self.stdout.write(f"Habits remaining: {Habit.objects.count()}")
        self.stdout.write(f"Completions remaining: {HabitCompletion.objects.count()}")
        self.stdout.write(f"Period completions remaining: {PeriodCompletion.objects.count()}")