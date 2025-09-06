from django.core.management.base import BaseCommand
from habits.models import Habit


class Command(BaseCommand):
    help = 'Preloads recommended template habits into the database'

    def handle(self, *args, **kwargs):
        predefined_habits = [
            {
                "name": "Exercise",
                "icon": "FitnessCenter",
                "goal_description": "Exercise for 30 minutes",
                "category": "Health",
                "periodicity": "weekly",
                "frequency": 4,
                "specific_days": ["Thu", "Fri", "Sat", "Sun"],
            },
            {
                "name": "Reading",
                "icon": "MenuBook",
                "goal_description": "Read 10 pages",
                "category": "Personal",
                "periodicity": "daily",
                "frequency": 1,
                "specific_days": []
            },
            {
                "name": "Hydration",
                "icon": "LocalDrink",
                "goal_description": "Drink 2 liters of water",
                "category": "Health",
                "periodicity": "daily",
                "frequency": 1,
                "specific_days": []
            },
            {
                "name": "Morning Routine",
                "icon": "WbSunny",
                "goal_description": "Follow a consistent morning routine",
                "category": "Personal",
                "periodicity": "daily",
                "frequency": 1,
                "specific_days": []
            }
        ]

        for habit in predefined_habits:
            obj, created = Habit.objects.get_or_create(
                name=habit["name"],
                defaults={
                    "icon": habit["icon"],
                    "goal_description": habit.get("goal_description", ""),
                    "category": habit.get("category", "Other"),
                    "periodicity": habit.get("periodicity", "daily"),
                    "frequency": habit.get("frequency", 1),
                    "specific_days": habit.get("specific_days", []),
                    "preferred_time": None,
                    "duration_weeks": 4,
                    "is_active": False,   # Templates are not active by default
                    "started_date": None,  # Templates haven't been started
                    "paused_date": None,   # Templates haven't been paused
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created template habit: {obj.name}"))
            else:
                self.stdout.write(f"Template habit already exists: {obj.name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully processed {len(predefined_habits)} template habits"
            )
        )