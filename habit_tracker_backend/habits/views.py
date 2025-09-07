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
    try:
        from django.utils import timezone
        
        today = timezone.now().date()
        
        # Get all habits (you might want to filter by user later)
        habits = Habit.objects.all()
        
        # Fix: Use 'completion_date' instead of 'completed_date'
        completed_today_count = HabitCompletion.objects.filter(
            completion_date=today  # Changed from completed_date
        ).count()
        
        # Get habits with their progress data
        habits_data = []
        for habit in habits:
            habit_serializer = HabitSerializer(habit)
            habit_data = habit_serializer.data
            
            # Add progress data (using the corrected methods)
            habit_data['progress'] = habit.get_current_progress()
            habit_data['completed_today'] = habit.is_completed_today()
            
            habits_data.append(habit_data)
        
        # Dashboard summary data
        dashboard_data = {
            'total_habits': habits.count(),
            'completed_today': completed_today_count,
            'active_habits': habits.filter(is_active=True).count(),
            'habits': habits_data
        }
        
        return Response(dashboard_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Dashboard error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Failed to load dashboard: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def create_habit(request):
    try:
        data = request.data
        
        # Handle empty string for preferred_time
        preferred_time = data.get('preferred_time')
        if preferred_time == '' or preferred_time is None:
            preferred_time = None
        
        habit = Habit.objects.create(
            name=data.get('name'),
            category=data.get('category'),
            goal_description=data.get('goal_description', ''),
            periodicity=data.get('periodicity'),
            frequency=int(data.get('frequency', 1)),
            specific_days=data.get('specific_days', []),
            preferred_time=preferred_time,  # Use the cleaned value
            icon=data.get('icon'),
            is_active=True
        )
        
        # Serialize the created habit with additional dashboard data
        serializer = HabitSerializer(habit)
        habit_data = serializer.data
        
        habit_data['progress'] = {'completed': 0, 'total': habit.frequency}
        habit_data['completed_today'] = False
        
        return Response(habit_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Exception type: {type(e).__name__}")
        print(f"Exception message: {str(e)}")
        import traceback
        traceback.print_exc()
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