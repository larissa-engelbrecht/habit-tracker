from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from habits.models import Habit
from habits.models import HabitCompletion
from habits.serializers import HabitSerializer
from django.utils import timezone
from datetime import timedelta
import json

@api_view(['GET'])
def preloaded_habits(request):
    habits = Habit.objects.filter(is_active=False)
    serializer = HabitSerializer(habits, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def dashboard_data(request):
    """Get all data needed for dashboard"""
    # Get active habits with progress
    habits = Habit.objects.filter(is_active=True)
    habits_data = []
    
    for habit in habits:
        serializer = HabitSerializer(habit)
        habit_data = serializer.data

        now = timezone.now()
        today = now.date()

        completed_today_count = HabitCompletion.objects.filter(
            habit=habit,
            completed_date__date=today
        ).count()

        habit_data['progress'] = {
            'completed': completed_today_count,
            'total': habit.frequency
        }
        habit_data['completed_today'] = completed_today_count > 0
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

@api_view(['POST'])
def create_habit(request):
    """Create a new custom habit"""
    try:
        data = request.data
        
        # Create the habit
        habit = Habit.objects.create(
            name=data.get('name'),
            category=data.get('category'),
            goal_description=data.get('goal_description', ''),
            periodicity=data.get('periodicity'),
            frequency=data.get('frequency', 1),
            specific_days=data.get('specific_days', []),
            preferred_time=data.get('preferred_time', ''),
            icon=data.get('icon'),
            is_active=True      # New habits start as active
        )
        
        # Serialize the created habit with additional dashboard data
        serializer = HabitSerializer(habit)
        habit_data = serializer.data
        habit_data['progress'] = habit.get_current_progress()
        habit_data['completed_today'] = habit.is_completed_today()
        
        return Response(habit_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to create habit: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
@api_view(['POST'])
def start_habit_from_template(request, habit_id):
    """Start tracking a habit from template"""
    try:
        template_habit = Habit.objects.get(id=habit_id, is_active=False)
        
        # Create a copy and make it active
        new_habit = Habit.objects.create(
            name=template_habit.name,
            category=template_habit.category,
            goal_description=template_habit.goal_description,
            periodicity=template_habit.periodicity,
            frequency=template_habit.frequency,
            specific_days=template_habit.specific_days,
            preferred_time=template_habit.preferred_time,
            icon=template_habit.icon,
            is_active=True  # This makes it an active tracked habit
        )
        
        serializer = HabitSerializer(new_habit)
        habit_data = serializer.data
        habit_data['progress'] = new_habit.get_current_progress()
        habit_data['completed_today'] = new_habit.is_completed_today()
        
        return Response(habit_data, status=status.HTTP_201_CREATED)
        
    except Habit.DoesNotExist:
        return Response({'error': 'Template habit not found'}, status=status.HTTP_404_NOT_FOUND)