from django.db import models
from django.utils import timezone
from datetime import timedelta, date
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
    icon = models.CharField(max_length=10, default='🌟')  # UI icon (emoji or code)
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
        """Calculate start and end dates for the period containing target_date"""
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
        """Calculate progress for current period with comprehensive data"""
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
        """Check if habit can be completed today"""
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
        """Get statistics for this habit"""
        today = timezone.now().date()
        
        # Determine date range
        if date_range_days:
            start_date = today - timedelta(days=date_range_days)
        else:
            start_date = self.started_date.date() if self.started_date else today
        
        # Get completions in range
        completions = self.completions.filter(
            completion_date__gte=start_date,
            completion_date__lte=today
        )
        total_completions = completions.count()
        
        # Calculate expected completions based on periodicity
        days_in_range = (today - start_date).days + 1
        
        if self.periodicity == 'daily':
            # For daily: expected = days * frequency
            expected_completions = days_in_range * self.frequency
        elif self.periodicity == 'weekly':
            # For weekly: expected = (complete weeks + partial week) * frequency
            complete_weeks = days_in_range // 7
            remaining_days = days_in_range % 7
            
            # Add one more expected if we're past the first day of a partial week
            expected_completions = complete_weeks * self.frequency
            if remaining_days > 0:
                expected_completions += self.frequency
        else:  # monthly
            # For monthly: expected = (complete months + partial month) * frequency
            months_difference = (today.year - start_date.year) * 12 + (today.month - start_date.month)
            
            # If we're past the start day of the month, count the current month
            if today.day >= start_date.day:
                expected_completions = (months_difference + 1) * self.frequency
            else:
                expected_completions = months_difference * self.frequency
        
        # Calculate completion rate (cap at 100%)
        completion_rate = min(
            (total_completions / expected_completions * 100) if expected_completions > 0 else 0,
            100
        )
        
        # Calculate streaks
        current_streak, longest_streak = self._calculate_streaks()
        
        # Calculate average per week
        weeks = max(days_in_range / 7, 1)
        average_per_week = total_completions / weeks
        
        return {
            'total_completions': total_completions,
            'completion_rate': round(completion_rate, 1),
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'average_per_week': round(average_per_week, 1),
            'expected_completions': expected_completions,  # Add for debugging
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
        """Calculate streaks for daily habits"""
        completions = list(
            self.completions.order_by('-completion_date')
            .values_list('completion_date', flat=True)
        )
    
        if not completions:
            return 0, 0
    
        today = timezone.now().date()
        current_streak = 0
        longest_streak = 0
        temp_streak = 0
        
        # Check if completed today or yesterday (streak is still alive)
        most_recent = completions[0]
        days_since_last = (today - most_recent).days
        
        if days_since_last > 1:
            # Streak is broken
            current_streak = 0
        else:
            # Calculate current streak
            expected_date = today if days_since_last == 0 else today - timedelta(days=1)
            
            for completion_date in completions:
                if completion_date == expected_date:
                    temp_streak += 1
                    expected_date -= timedelta(days=1)
                else:
                    break
            
            current_streak = temp_streak
        
        # Calculate longest streak
        temp_streak = 1
        longest_streak = 1
        
        for i in range(len(completions) - 1):
            days_diff = (completions[i] - completions[i + 1]).days
            
            if days_diff == 1:
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 1
        
        return current_streak, longest_streak

    def _calculate_weekly_streaks(self):
        """Calculate streaks for weekly habits - count consecutive weeks with completion"""
        if not self.completions.exists():
            return 0, 0
        
        today = timezone.now().date()
        current_period_start, current_period_end = self.get_period_boundaries(today)
        
        # Get all weeks with completions
        weeks_with_completions = set()
        for completion in self.completions.all():
            period_start, _ = self.get_period_boundaries(completion.completion_date)
            weeks_with_completions.add(period_start)
        
        if not weeks_with_completions:
            return 0, 0
        
        sorted_weeks = sorted(weeks_with_completions, reverse=True)
        
        # Calculate current streak
        current_streak = 0
        expected_week = current_period_start
        
        for week_start in sorted_weeks:
            if week_start == expected_week:
                current_streak += 1
                expected_week -= timedelta(weeks=1)
            else:
                break
        
        # If current week doesn't have completion, streak is 0
        if current_period_start not in weeks_with_completions:
            current_streak = 0
        
        # Calculate longest streak
        longest_streak = 1
        temp_streak = 1
        
        sorted_weeks_asc = sorted(weeks_with_completions)
        for i in range(len(sorted_weeks_asc) - 1):
            weeks_diff = (sorted_weeks_asc[i + 1] - sorted_weeks_asc[i]).days
            
            if weeks_diff == 7:  # Consecutive weeks
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 1
        
        return current_streak, longest_streak

    def _calculate_monthly_streaks(self):
        """Calculate streaks for monthly habits - count consecutive months with completion"""
        if not self.completions.exists():
            return 0, 0
        
        today = timezone.now().date()
        current_period_start, _ = self.get_period_boundaries(today)
        
        # Get all months with completions
        months_with_completions = set()
        for completion in self.completions.all():
            period_start, _ = self.get_period_boundaries(completion.completion_date)
            months_with_completions.add(period_start)
        
        if not months_with_completions:
            return 0, 0
        
        sorted_months = sorted(months_with_completions, reverse=True)
        
        # Calculate current streak
        current_streak = 0
        expected_month = current_period_start
        
        for month_start in sorted_months:
            if month_start == expected_month:
                current_streak += 1
                # Move to previous month
                if expected_month.month == 1:
                    expected_month = expected_month.replace(year=expected_month.year - 1, month=12)
                else:
                    expected_month = expected_month.replace(month=expected_month.month - 1)
            else:
                break
        
        # If current month doesn't have completion, streak is 0
        if current_period_start not in months_with_completions:
            current_streak = 0
        
        # Calculate longest streak (similar logic)
        longest_streak = 1
        # ... implement similar to weekly
        
        return current_streak, longest_streak

    def get_tracking_board_data(self, weeks_back=12):
        """Get data for visual tracking board"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(weeks=weeks_back)
        
        completions = self.completions.filter(
            completion_date__gte=start_date,
            completion_date__lte=end_date
        )
        
        completion_dates = set(completions.values_list('completion_date', flat=True))
        
        grid = []
        current_date = start_date
        
        while current_date <= end_date:
            is_completed = current_date in completion_dates
            
            grid.append({
                'date': current_date.isoformat(),
                'completed': is_completed,
                'day_of_week': current_date.strftime('%a'),
                'intensity': 4 if is_completed else 0
            })
            
            current_date += timedelta(days=1)
        
        return {
            'grid': grid,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }

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
        unique_together = ['habit', 'completion_date']
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
        