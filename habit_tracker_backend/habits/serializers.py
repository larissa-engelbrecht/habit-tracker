from rest_framework import serializers
from habits.models import Habit, HabitCompletion, HabitTemplate, PeriodCompletion


class HabitTemplateSerializer(serializers.ModelSerializer):
    """Serializer for habit templates"""
    class Meta:
        model = HabitTemplate
        fields = '__all__'

class HabitSerializer(serializers.ModelSerializer):
    """Basic serializer for all habit operations"""
    
    class Meta:
        model = Habit
        fields = '__all__'
        read_only_fields = ['id', 'creation_date']
    
    def validate_frequency(self, value):
        """Ensure frequency is positive"""
        if value < 1:
            raise serializers.ValidationError("Frequency must be at least 1")
        return value
    
    def validate_preferred_time(self, value):
        """Handle empty string for preferred_time"""
        if value == '' or value is None:
            return None
        return value


class HabitWithProgressSerializer(serializers.ModelSerializer):
    """Serializer that includes computed progress fields"""
    progress = serializers.SerializerMethodField()
    can_complete_today = serializers.SerializerMethodField()
    is_completed_today = serializers.SerializerMethodField()
    
    class Meta:
        model = Habit
        fields = '__all__'
    
    def get_progress(self, obj):
        return obj.get_current_progress()
    
    def get_can_complete_today(self, obj):
        return obj.can_complete_today()
    
    def get_is_completed_today(self, obj):
        return obj.is_completed_today()


class HabitDashboardSerializer(serializers.ModelSerializer):
    """Serializer for dashboard view with all computed fields"""
    progress = serializers.SerializerMethodField()
    can_complete_today = serializers.SerializerMethodField()
    completed_today = serializers.SerializerMethodField()
    period_complete = serializers.SerializerMethodField()
    period_marked_complete = serializers.SerializerMethodField()
    period_status = serializers.SerializerMethodField()
    period_completed_at = serializers.SerializerMethodField()
    period_label = serializers.SerializerMethodField()
    
    class Meta:
        model = Habit
        fields = [
            'id', 'name', 'category', 'goal_description', 'periodicity',
            'frequency', 'specific_days', 'preferred_time', 'icon',
            'is_active', 'started_date', 'end_date', 'week_starts_on',
            'duration_weeks', 'creation_date',
            # Computed fields
            'progress', 'can_complete_today', 'completed_today',
            'period_complete', 'period_marked_complete', 'period_status',
            'period_completed_at', 'period_label'
        ]
    
    def get_progress(self, obj):
        return obj.get_current_progress()
    
    def get_can_complete_today(self, obj):
        return obj.can_complete_today()
    
    def get_completed_today(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        
        if obj.periodicity == 'daily':
            return obj.completions.filter(completion_date=today).exists()
        else:
            progress = obj.get_current_progress()
            return obj.is_completed_today()
    
    def get_period_complete(self, obj):
        progress = obj.get_current_progress()
        return progress['is_complete']
    
    def get_period_marked_complete(self, obj):
        progress = obj.get_current_progress()
        return progress['period_marked_complete']
    
    def get_period_status(self, obj):
        progress = obj.get_current_progress()
        if progress['period_marked_complete']:
            return 'completed'
        elif progress['is_complete']:
            return 'goal_met'
        else:
            return 'in_progress'
    
    def get_period_completed_at(self, obj):
        progress = obj.get_current_progress()
        return progress['completed_at']
    
    def get_period_label(self, obj):
        from datetime import date
        progress = obj.get_current_progress()
        
        if obj.periodicity == 'daily':
            return 'Today'
        elif obj.periodicity == 'weekly':
            return f"Week of {progress['period_start']}"
        else:  # monthly
            period_date = date.fromisoformat(progress['period_start'])
            return period_date.strftime('%B %Y')


class HabitCompletionSerializer(serializers.ModelSerializer):
    habit_name = serializers.CharField(source='habit.name', read_only=True)
    habit_icon = serializers.CharField(source='habit.icon', read_only=True)
    
    class Meta:
        model = HabitCompletion
        fields = '__all__'
        read_only_fields = ['id', 'completed_at', 'created_at']


class PeriodCompletionSerializer(serializers.ModelSerializer):
    habit_name = serializers.CharField(source='habit.name', read_only=True)
    
    class Meta:
        model = PeriodCompletion
        fields = '__all__'
        read_only_fields = ['id', 'completed_at']