from django.db import models
from django.utils import timezone
from datetime import timedelta, date
from collections import defaultdict
import json

class HabitTemplate(models.Model):
    """Preloaded habit templates - separate from user habits"""
    name = models.CharField(max_length=100, unique=True)
    goal_description = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=50, choices=[
        ('Health', 'Health'),
        ('Work', 'Work'),
        ('Personal', 'Personal'),
        ('Other', 'Other'),
    ], default='Health')
    periodicity = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ], default='daily')
    frequency = models.IntegerField(default=1)
    specific_days = models.JSONField(default=list)
    preferred_time = models.TimeField(null=True, blank=True)
    icon = models.CharField(max_length=50, default='🌟')
    week_starts_on = models.IntegerField(default=1)
    duration_weeks = models.IntegerField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Habit Templates"

    def __str__(self):
        return f"{self.name} (Template)"

class Habit(models.Model):
    """
    Represents a single habit being tracked by a user.
    Contains all core logic for calculating progress, streaks, and statistics.
    """
    name = models.CharField(max_length=100, unique=True)
    goal_description = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=50, choices=[
        ('Health', 'Health'),
        ('Work', 'Work'),
        ('Personal', 'Personal'),
        ('Other', 'Other'),
    ], default='Health')
    periodicity = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ], default='daily')
    frequency = models.IntegerField(default=1)  # Number of completions per period
    specific_days = models.JSONField(default=list)  # JSON for days (e.g., ["Mon", "Wed"])
    preferred_time = models.TimeField(null=True, blank=True)  # Optional time
    icon = models.CharField(max_length=10, default='🌟')  # UI icon
    creation_date = models.DateTimeField(auto_now_add=True)  # Set on creation
    duration_weeks = models.IntegerField(
        blank=True,
        null=True,
        help_text='Optional duration in weeks'
    )
    # TRACKING STATUS
    is_active = models.BooleanField(default=False, help_text="Is this habit currently being tracked?")

    # Track when habit was started/stopped
    started_date = models.DateTimeField(null=True, blank=True, help_text="When user started actively tracking")
    end_date = models.DateField(
        blank=True,
        null=True,
        help_text='Optional end date for habit tracking'
    )
    week_starts_on = models.IntegerField(
        default=1,
        choices=[
            (0, 'Sunday'),
            (1, 'Monday'),
            (2, 'Tuesday'),
            (3, 'Wednesday'),
            (4, 'Thursday'),
            (5, 'Friday'),
            (6, 'Saturday'),
        ],
        help_text='Day of week for weekly period calculation'
    )
    template = models.ForeignKey(
        HabitTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='habits_created',
        help_text='The template this habit was created from'
    )

    def __str__(self):
        return f"{self.name} ({self.category})"

    @property
    def is_currently_tracked(self):
        """Returns True if habit is actively being tracked"""
        return self.is_active and self.started_date is not None

    def get_period_boundaries(self, target_date=None):
        """
        Calculate start and end dates for the period (day, week, or month)
        containing the target_date.
        
        Args:
            target_date (date, optional): The date to find the period for. 
                                          Defaults to timezone.now().date().

        Returns:
            tuple(date, date): A tuple containing the period_start and period_end.
        """
        if target_date is None:
            target_date = timezone.now().date()

        if self.periodicity == 'daily':
            return target_date, target_date

        elif self.periodicity == 'weekly':
            # Calculate week start based on week_starts_on
            days_since_week_start = (target_date.weekday() - self.week_starts_on) % 7
            period_start = target_date - timedelta(days=days_since_week_start)
            period_end = period_start + timedelta(days=6)
            return period_start, period_end

        else:  # monthly
            period_start = target_date.replace(day=1)
            # Get last day of month
            if target_date.month == 12:
                period_end = target_date.replace(day=31)
            else:
                next_month = target_date.replace(month=target_date.month + 1, day=1)
                period_end = next_month - timedelta(days=1)
            return period_start, period_end

    def get_current_progress(self):
        """
        Calculate progress for the current period (today's day, week, or month).

        Returns:
            dict: A dictionary with progress details.
        """
        today = timezone.now().date()
        period_start, period_end = self.get_period_boundaries(today)

        # Count completions in current period
        completions_in_period = self.completions.filter(
            completion_date__gte=period_start,
            completion_date__lte=period_end
        )
        completed_count = completions_in_period.count()

        # Check if period is marked as complete
        period_completion = self.period_completions.filter(
            period_start=period_start,
            period_end=period_end
        ).first()

        is_complete = completed_count >= self.frequency
        period_marked_complete = period_completion is not None

        return {
            'completed': completed_count,
            'total': self.frequency,
            'is_complete': is_complete,
            'period_marked_complete': period_marked_complete,
            'completed_at': period_completion.completed_at.isoformat() if period_completion else None,
            'period_start': period_start.isoformat(),
            'period_end': period_end.isoformat(),
        }

    def can_complete_today(self):
        """
        Check if the habit can be completed again today based on its frequency.
        """
        today = timezone.now().date()

        if self.periodicity == 'daily':
            # For daily habits, check if not already completed today
            return not self.completions.filter(completion_date=today).exists()

        else:
            # For weekly/monthly, check if haven't reached frequency limit
            period_start, period_end = self.get_period_boundaries(today)
            period_completions = self.completions.filter(
                completion_date__gte=period_start,
                completion_date__lte=period_end
            ).count()

            return period_completions < self.frequency

    def is_completed_today(self):
        """Check if habit was completed today"""
        today = timezone.now().date()
        return self.completions.filter(completion_date=today).exists()

    def get_statistics(self, date_range_days=None):
        """
        Get comprehensive statistics for this habit.
        
        Args:
            date_range_days (int, optional): Number of days to look back for stats.
                                             If None, stats are for all time.

        Returns:
            dict: A dictionary of statistics.
        """
        today = timezone.now().date()
        
        if not self.started_date:
            return {
                'total_completions': 0, 'completion_rate': 0, 'current_streak': 0,
                'longest_streak': 0, 'average_per_week': 0, 'expected_completions': 0,
            }

        # Determine date range
        start_date = self.started_date.date()
        if date_range_days:
            # Ensure the date range doesn't go back further than the habit's start date
            range_start_date = today - timedelta(days=date_range_days - 1)
            start_date = max(start_date, range_start_date)

        # Get completions in range
        completions = self.completions.filter(
            completion_date__gte=start_date,
            completion_date__lte=today
        )
        total_completions = completions.count()
        
        # Accurate calculation for expected completions
        expected_completions = 0
        days_in_range = (today - start_date).days + 1
        
        if self.periodicity == 'daily':
            expected_completions = days_in_range * self.frequency
        else:
            # For weekly/monthly, iterate through periods to get an accurate count
            seen_periods = set()
            current_iter_date = start_date
            while current_iter_date <= today:
                period_start, _ = self.get_period_boundaries(current_iter_date)
                
                if period_start not in seen_periods:
                    expected_completions += self.frequency
                    seen_periods.add(period_start)
                
                # Jump to the day after the current period to avoid recounting
                current_iter_date = self.get_period_boundaries(current_iter_date)[1] + timedelta(days=1)
        
        # Calculate completion rate (cap at 100%)
        completion_rate = min(
            (total_completions / expected_completions * 100) if expected_completions > 0 else 0,
            100
        )
        
        # Calculate streaks
        current_streak, longest_streak = self._calculate_streaks()
        
        # Calculate average per week
        weeks_in_range = max(days_in_range / 7, 1)
        average_per_week = total_completions / weeks_in_range
        
        return {
            'total_completions': total_completions,
            'completion_rate': round(completion_rate, 1),
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'average_per_week': round(average_per_week, 1),
            'expected_completions': expected_completions,
        }

    def _calculate_streaks(self):
        """Calculate current and longest streaks based on periodicity"""
        if self.periodicity == 'daily':
            return self._calculate_daily_streaks()
        elif self.periodicity == 'weekly':
            return self._calculate_weekly_streaks()
        else:  # monthly
            return self._calculate_monthly_streaks()

    def _calculate_daily_streaks(self):
        """Calculate current and longest streaks for daily habits"""
        # Get all completion dates, sorted most recent first
        completions = sorted(list(
            self.completions.values_list('completion_date', flat=True)
        ), reverse=True)

        if not completions:
            return 0, 0

        today = timezone.now().date()
        
       # --- Calculate Current Streak ---
        current_streak = 0
        # Check if the most recent completion was today or yesterday
        if (today - completions[0]).days <= 1:
            # Streak is still alive, calculate it
            expected_date = completions[0]  # Start from most recent
            for comp_date in completions:
                if comp_date == expected_date:
                    current_streak += 1
                    expected_date -= timedelta(days=1)
                else:
                    # Gap found, streak ends
                    break
        
        # Calculate longest streak
        longest_streak = 0
        if completions:
            temp_streak = 1
            longest_streak = 1
            # Iterate ascending to find longest chain
            asc_completions = completions[::-1]
            for i in range(len(asc_completions) - 1):
                if (asc_completions[i+1] - asc_completions[i]).days == 1:
                    temp_streak += 1
                else:
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 1
            longest_streak = max(longest_streak, temp_streak)

        return current_streak, longest_streak

    def _calculate_weekly_streaks(self):
        """Calculate streaks for weekly habits - count consecutive weeks meeting frequency goal"""
        if not self.completions.exists():
            return 0, 0
        
        # Group completions by week and count them
        completions_per_week = defaultdict(int)
        for completion in self.completions.all():
            period_start, _ = self.get_period_boundaries(completion.completion_date)
            completions_per_week[period_start] += 1
            
        # Filter for weeks that met the frequency goal
        successful_weeks = {
            week for week, count in completions_per_week.items() 
            if count >= self.frequency
        }
        
        if not successful_weeks:
            return 0, 0
            
        sorted_weeks = sorted(list(successful_weeks), reverse=True)
        today = timezone.now().date()
        
        # Check if current streak is active
        current_streak = 0
        current_period_start, _ = self.get_period_boundaries(today)
        prev_period_start, _ = self.get_period_boundaries(today - timedelta(weeks=1))

        if sorted_weeks[0] == current_period_start or sorted_weeks[0] == prev_period_start:
            expected_week = sorted_weeks[0]
            for week_start in sorted_weeks:
                if week_start == expected_week:
                    current_streak += 1
                    expected_week -= timedelta(weeks=1)
                else:
                    break
        
        # Calculate longest streak
        longest_streak = 0
        if successful_weeks:
            temp_streak = 1
            longest_streak = 1
            sorted_weeks_asc = sorted(list(successful_weeks))
            for i in range(len(sorted_weeks_asc) - 1):
                if (sorted_weeks_asc[i+1] - sorted_weeks_asc[i]).days == 7:
                    temp_streak += 1
                else:
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 1
            longest_streak = max(longest_streak, temp_streak)
            
        return current_streak, longest_streak

    def _calculate_monthly_streaks(self):
        """Calculate streaks for monthly habits - count consecutive months meeting frequency goal"""
        if not self.completions.exists():
            return 0, 0

        # Group completions by month and count them
        completions_per_month = defaultdict(int)
        for completion in self.completions.all():
            period_start, _ = self.get_period_boundaries(completion.completion_date)
            completions_per_month[period_start] += 1
            
        # Filter for months that met the frequency goal
        successful_months = {
            month for month, count in completions_per_month.items()
            if count >= self.frequency
        }
        
        if not successful_months:
            return 0, 0

        sorted_months = sorted(list(successful_months), reverse=True)
        today = timezone.now().date()
        
        # Check if current streak is active
        current_streak = 0
        current_period_start, _ = self.get_period_boundaries(today)
        prev_period_start, _ = self.get_period_boundaries(today.replace(day=1) - timedelta(days=1))

        if sorted_months[0] == current_period_start or sorted_months[0] == prev_period_start:
            expected_month = sorted_months[0]
            for month_start in sorted_months:
                if month_start == expected_month:
                    current_streak += 1
                    # Get previous month's start
                    prev_month_last_day = expected_month - timedelta(days=1)
                    expected_month = prev_month_last_day.replace(day=1)
                else:
                    break

        # Calculate longest streak
        longest_streak = 0
        if successful_months:
            temp_streak = 1
            longest_streak = 1
            sorted_months_asc = sorted(list(successful_months))
            for i in range(len(sorted_months_asc) - 1):
                curr_month = sorted_months_asc[i]
                next_month_in_list = sorted_months_asc[i+1]
                
                # Determine the actual next month
                if curr_month.month == 12:
                    expected_next_month = curr_month.replace(year=curr_month.year + 1, month=1)
                else:
                    expected_next_month = curr_month.replace(month=curr_month.month + 1)
                
                if next_month_in_list == expected_next_month:
                    temp_streak += 1
                else:
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 1
            longest_streak = max(longest_streak, temp_streak)
            
        return current_streak, longest_streak

    def get_completion_rate_by_period(self, num_periods=12):
        """Get completion rate data grouped by periods"""
        today = timezone.now().date()
        periods = []

        for i in range(num_periods):
            if self.periodicity == 'weekly':
                period_date = today - timedelta(weeks=i)
            elif self.periodicity == 'monthly':
                # Approximate monthly calculation
                period_date = today - timedelta(days=30 * i)
            else:  # daily
                period_date = today - timedelta(days=i)

            period_start, period_end = self.get_period_boundaries(period_date)

            completions_count = self.completions.filter(
                completion_date__gte=period_start,
                completion_date__lte=period_end
            ).count()

            completion_rate = (completions_count / self.frequency * 100) if self.frequency > 0 else 0

            periods.append({
                'period_start': period_start.isoformat(),
                'period_end': period_end.isoformat(),
                'completions': completions_count,
                'target': self.frequency,
                'completion_rate': round(completion_rate, 1)
            })

        return periods

class Meta:
    verbose_name_plural = "Habits"


class HabitCompletion(models.Model):
    """Track individual completions of habits"""
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='completions')
    completion_date = models.DateField(default=timezone.now)  # Date the habit was completed
    completed_at = models.DateTimeField(default=timezone.now)  # Exact time of completion
    notes = models.TextField(blank=True, null=True)  # Optional notes
    created_at = models.DateTimeField(auto_now_add=True)  # When the record was created
    was_on_target_day = models.BooleanField(
        default=True,
        help_text='Was this completion on a target day for weekly habits'
    )

    class Meta:
        # Prevent duplicate completions on same day for the same habit
        # This unique_together constraint might be too restrictive if a habit can be completed multiple times a day
        # For now, we assume one completion per day per habit is the rule.
        # unique_together = ['habit', 'completion_date']
        ordering = ['-completion_date', '-completed_at']

    def __str__(self):
        return f"{self.habit.name} - {self.completion_date.strftime('%Y-%m-%d')}"

class PeriodCompletion(models.Model):
    habit = models.ForeignKey(
        'Habit',
        related_name='period_completions',
        on_delete=models.CASCADE
    )
    period_start = models.DateField()
    period_end = models.DateField()
    completed_at = models.DateTimeField(default=timezone.now)
    completion_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('habit', 'period_start', 'period_end')
        ordering = ['-period_start']

    def __str__(self):
        return f"{self.habit.name} | {self.period_start} - {self.period_end}"

