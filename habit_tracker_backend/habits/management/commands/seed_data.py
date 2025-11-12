"""
Clears old data and seeds the database with sample habits and completions.
"""
import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from habits.models import Habit, HabitTemplate, HabitCompletion

class Command(BaseCommand):
    help = 'Seeds the database with 4 weeks of sample habit data.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING(
            'Clearing old Habit and Completion data...'))
        
        # Clear old data to make script re-runnable
        HabitCompletion.objects.all().delete()
        Habit.objects.filter(template__isnull=False).delete()

        self.stdout.write(self.style.SUCCESS(
            'Old data cleared. Seeding new data...'))

        # Get all templates
        templates = HabitTemplate.objects.all()
        if not templates.exists():
            self.stdout.write(self.style.ERROR(
                'No HabitTemplates found! Please run `python manage.py preload_habits` first.'))
            return

        # 1. Create active Habits from Templates
        # Set start date to 28 days ago
        start_date = timezone.now() - timedelta(days=28)
        
        habits_to_track = []
        for template in templates:
            habit = Habit.objects.create(
                name=template.name,
                category=template.category,
                goal_description=template.goal_description,
                periodicity=template.periodicity,
                frequency=template.frequency,
                specific_days=template.specific_days,
                icon=template.icon,
                week_starts_on=template.week_starts_on,
                is_active=True,
                started_date=start_date,
                template=template
            )
            habits_to_track.append(habit)
            self.stdout.write(f'  Created trackable habit: {habit.name}')

        # 2. Generate 4 weeks (28 days) of sample completions
        completions_to_create = []
        TODAY = timezone.now().date()

        # Get habits for easier reference
        hydration = Habit.objects.get(name="Hydration")
        reading = Habit.objects.get(name="Reading")
        morning_routine = Habit.objects.get(name="Morning Routine")
        journal = Habit.objects.get(name="Journal")
        exercise = Habit.objects.get(name="Exercise")

        self.stdout.write(self.style.WARNING(
            '\nGenerating 28 days of completions...'))
        
        for day_ago in range(28):
            # Iterate backwards from 27 down to 0
            current_date = TODAY - timedelta(days=(27 - day_ago))
            day_of_week = current_date.weekday()  # Monday=0, Sunday=6

            # --- Daily Habits ---

            # Hydration: 90% compliance
            if random.random() > 0.10:
                completions_to_create.append(
                    HabitCompletion(habit=hydration, completion_date=current_date)
                )

            # Reading: Perfect 10-day streak, spotty before that
            if day_ago >= 18: # Last 10 days
                completions_to_create.append(
                    HabitCompletion(habit=reading, completion_date=current_date)
                )
            elif random.random() > 0.5: # 50% chance before that
                 completions_to_create.append(
                    HabitCompletion(habit=reading, completion_date=current_date)
                )

            # Morning Routine: 80% compliance on weekdays only
            if day_of_week < 5 and random.random() > 0.20: # Mon-Fri
                completions_to_create.append(
                    HabitCompletion(habit=morning_routine, completion_date=current_date)
                )

            # --- Weekly Habits ---

            # Journal (Weekly, 3x on Mon, Wed, Fri)
            # 90% compliance on target days
            if day_of_week in [0, 2, 4] and random.random() > 0.10:
                completions_to_create.append(
                    HabitCompletion(habit=journal, completion_date=current_date)
                )

            # Exercise (Weekly, 4x on Thu, Fri, Sat, Sun)
            # 90% compliance on target days
            if day_of_week in [3, 4, 5, 6] and random.random() > 0.10:
                completions_to_create.append(
                    HabitCompletion(habit=exercise, completion_date=current_date)
                )

        HabitCompletion.objects.bulk_create(completions_to_create)

        self.stdout.write(self.style.SUCCESS(
            f'\nSuccessfully created {len(completions_to_create)} habit completions.'
        ))
        self.stdout.write(self.style.SUCCESS(
            'Database is seeded. Run the app!'
        ))