from django.test import TestCase, Client
from django.utils import timezone
from datetime import timedelta
from habits.models import Habit, HabitCompletion, HabitTemplate

class HabitTests(TestCase):
    
    def setUp(self):
        """Set up test data for all test methods."""
        self.client = Client()
        
        # We set a consistent start date 30 days ago
        self.start_date = timezone.now() - timedelta(days=30)
        
        # 1. Test Habit Creation (in setUp)
        self.daily_habit = Habit.objects.create(
            name="Test Daily Habit",
            periodicity='daily',
            frequency=1,
            is_active=True,
            started_date=self.start_date
        )
        
        self.weekly_habit = Habit.objects.create(
            name="Test Weekly Habit",
            periodicity='weekly',
            frequency=3,
            specific_days=["Mon", "Wed", "Fri"],
            is_active=True,
            started_date=self.start_date
        )

    def test_habit_creation_model(self):
        """1. Test Habit Creation: Test that habits were created correctly in setUp."""
        self.assertEqual(self.daily_habit.name, "Test Daily Habit")
        self.assertEqual(self.weekly_habit.periodicity, "weekly")
        self.assertEqual(self.weekly_habit.frequency, 3)
        self.assertEqual(Habit.objects.count(), 2)
        self.assertTrue(self.daily_habit.is_active)

    def test_habit_completion_api(self):
        """2. Test Habit Completion: Test the 'complete' API endpoint."""
        
        # Check that no completions exist initially
        self.assertEqual(HabitCompletion.objects.count(), 0)
        
        # Call the complete habit API endpoint
        url = f'/api/habits/{self.daily_habit.id}/complete/'
        response = self.client.post(url, {}, content_type='application/json')
        
        # Check for a successful response
        self.assertEqual(response.status_code, 200)
        
        # Check that one completion object was created in the database
        self.assertEqual(HabitCompletion.objects.count(), 1)
        self.assertTrue(
            HabitCompletion.objects.filter(
                habit=self.daily_habit,
                completion_date=timezone.now().date()
            ).exists()
        )

    def test_daily_streak_logic_model(self):
        """3. Test Streak Tracking: Test the model's internal streak logic."""
        
        today = timezone.now().date()
        
        # Create completions for yesterday and the day before
        HabitCompletion.objects.create(
            habit=self.daily_habit, completion_date=today - timedelta(days=1))
        HabitCompletion.objects.create(
            habit=self.daily_habit, completion_date=today - timedelta(days=2))
        
        # Call the stats function
        stats = self.daily_habit.get_statistics()
        
        # Current streak should be 0 (since today is not completed)
        self.assertEqual(stats['current_streak'], 0)
        # Longest streak should be 2
        self.assertEqual(stats['longest_streak'], 2)
        
        # Complete the habit for today
        HabitCompletion.objects.create(
            habit=self.daily_habit, completion_date=today)
        
        # Re-check stats
        stats = self.daily_habit.get_statistics()
        
        # Current streak should now be 3
        self.assertEqual(stats['current_streak'], 3)
        self.assertEqual(stats['longest_streak'], 3)

    def test_broken_daily_streak_logic(self):
        """4. Test Streak Tracking: Test that a missed day breaks the streak."""
        
        today = timezone.now().date()
        
        # Create completions for today and 2 days ago (skipping yesterday)
        HabitCompletion.objects.create(
            habit=self.daily_habit, completion_date=today)
        HabitCompletion.objects.create(
            habit=self.daily_habit, completion_date=today - timedelta(days=2))
            
        stats = self.daily_habit.get_statistics()
        
        # Current streak is only 1 (from today)
        self.assertEqual(stats['current_streak'], 1)
        # Longest streak is also 1 (as the 2-day-ago one was isolated)
        self.assertEqual(stats['longest_streak'], 1)

    def test_analytics_functions_api_view(self):
        """5. Test Analytics Functions: Test the main '/stats/' API endpoint."""
        
        # Complete the daily habit once
        HabitCompletion.objects.create(
            habit=self.daily_habit, completion_date=timezone.now().date())
            
        # Call the main stats API endpoint
        url = '/api/habits/stats/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        
        # Check the 'overallStats' section
        self.assertEqual(data['overallStats']['totalHabits'], 2)
        self.assertEqual(data['overallStats']['totalCompletions'], 1)
        
        # Check the 'habitStats' section
        self.assertEqual(len(data['habitStats']), 2)
        
        # Find the stats for daily habit
        daily_stats = next(
            h for h in data['habitStats'] if h['habitId'] == self.daily_habit.id
        )
        
        self.assertEqual(daily_stats['totalCompletions'], 1)
        self.assertEqual(daily_stats['currentStreak'], 1)
        
        # The habit started 30 days ago, so 1 completion / 30 expected
        # Check that the values are equal up to 1 decimal place)
        expected_rate = round(1 / 31 * 100, 1)
        self.assertAlmostEqual(daily_stats['completionRate'], expected_rate, places=1)

    def test_habit_template_creation(self):
        """6. Test Habit Template Creation: Test that HabitTemplates can be created."""

        initial_count = HabitTemplate.objects.count()

        template = HabitTemplate.objects.create(
            name="Test Template",
            category="Health",
            goal_description="A test habit template",
            periodicity='daily',
            frequency=1,
            icon="FitnessCenter"
        )
        
        self.assertEqual(HabitTemplate.objects.count(), initial_count + 1)
        self.assertEqual(template.name, "Test Template")
        self.assertEqual(template.icon, "FitnessCenter")