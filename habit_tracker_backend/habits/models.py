from django.db import models
import json

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
    duration_weeks = models.IntegerField(default=4)  # Length of habit in weeks
    # TRACKING STATUS
    is_template = models.BooleanField(default=False, help_text="Is this a suggested/template habit?")
    is_active = models.BooleanField(default=True, help_text="Is this habit currently being tracked?")
    
    # Track when habit was started/stopped
    started_date = models.DateTimeField(null=True, blank=True, help_text="When user started actively tracking")
    paused_date = models.DateTimeField(null=True, blank=True, help_text="When habit was paused/stopped")

    def __str__(self):
        return f"{self.name} ({self.category})"
    
    @property
    def is_user_habit(self):
        """Returns True if this is a user's active habit (not a template)"""
        return not self.is_template and self.is_active

    @property
    def is_currently_tracked(self):
        """Returns True if habit is actively being tracked"""
        return not self.is_template and self.is_active and self.started_date is not None

    class Meta:
        verbose_name_plural = "Habits"


class HabitCompletion(models.Model):
    """Track individual completions of habits"""
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='completions')
    completed_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)  # Optional notes
    
    class Meta:
        # Prevent duplicate completions on same day for daily habits
        unique_together = ['habit', 'completed_date__date']
        ordering = ['-completed_date']

    def __str__(self):
        return f"{self.habit.name} - {self.completed_date.strftime('%Y-%m-%d')}"
        