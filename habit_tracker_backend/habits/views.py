from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from habits.models import Habit
from habits.models import HabitCompletion
from habits.serializers import HabitSerializer
from django.utils import timezone
from datetime import timedelta

@api_view(['GET'])
def preloaded_habits(request):
    habits = Habit.objects.all()
    serializer = HabitSerializer(habits, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def dashboard_data(request):
    """Get all data needed for dashboard"""
    # Get active habits with progress
    habits = Habit.objects.filter(is_template=False, is_active=True)
    habits_data = []
    
    for habit in habits:
        serializer = HabitSerializer(habit)
        habit_data = serializer.data
        habit_data['progress'] = habit.get_current_progress()
        habit_data['completed_today'] = habit.is_completed_today()
        habits_data.append(habit_data)
    
    # Get recent completions for "Done" section
    recent_completions = HabitCompletion.objects.select_related('habit').filter(
        completed_date__gte=timezone.now() - timedelta(days=7)
    )[:10]
    
    completed_data = []
    for completion in recent_completions:
        completed_data.append({
            'id': completion.id,
            'name': completion.habit.name,
            'category': completion.habit.category,
            'icon': completion.habit.icon,
            'completedDate': completion.completed_date
        })
    
    return Response({
        'habits': habits_data,
        'completedHabits': completed_data
    })