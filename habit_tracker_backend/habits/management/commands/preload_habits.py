from django.core.management.base import BaseCommand
from habits.models import HabitTemplate


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
                "week_starts_on": 1,  # Monday
            },
            {
                "name": "Reading",
                "icon": "MenuBook",
                "goal_description": "Read 10 pages",
                "category": "Personal",
                "periodicity": "daily",
                "frequency": 1,
                "specific_days": [],
            },
            {
                "name": "Hydration",
                "icon": "LocalDrink",
                "goal_description": "Drink 2 liters of water",
                "category": "Health",
                "periodicity": "daily",
                "frequency": 1,
                "specific_days": [],
            },
            {
                "name": "Morning Routine",
                "icon": "WbSunny",
                "goal_description": "Follow a consistent morning routine",
                "category": "Personal",
                "periodicity": "daily",
                "frequency": 1,
                "specific_days": [],
            },
            {
                "name": "Journal",
                "icon": "Create",
                "goal_description": "Write in journal",
                "category": "Personal",
                "periodicity": "weekly",
                "frequency": 3,
                "specific_days": ["Mon", "Wed", "Fri"],
                "week_starts_on": 1,  # Monday
            },
        ]

        for template_data in predefined_habits:
            obj, created = HabitTemplate.objects.get_or_create(
                name=template_data["name"],
                defaults=template_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✓ Created template: {obj.name}"))
            else:
                self.stdout.write(f"  Template already exists: {obj.name}")