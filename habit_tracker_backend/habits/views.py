from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from habits.models import Habit
from habits.models import HabitCompletion
from habits.serializers import HabitSerializer
from django.utils import timezone
from datetime import timedelta, date
from django.db.models import Count, Q, Avg
from collections import defaultdict
import json

@api_view(['GET'])
def preloaded_habits(request):
    habits = Habit.objects.filter(is_active=False)
    serializer = HabitSerializer(habits, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def active_habits(request):
    has_active = Habit.objects.filter(is_active=True).exists()
    return Response({'has_active_habits': has_active})

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

@api_view(['PUT', 'PATCH'])
def update_habit(request, habit_id):
    """Update an existing habit"""
    try:
        habit = get_object_or_404(Habit, id=habit_id)
        data = request.data
        
        # Update fields if provided
        if 'name' in data:
            habit.name = data['name']
        if 'category' in data:
            habit.category = data['category']
        if 'goal_description' in data:
            habit.goal_description = data['goal_description']
        if 'periodicity' in data:
            habit.periodicity = data['periodicity']
        if 'frequency' in data:
            habit.frequency = int(data['frequency'])
        if 'specific_days' in data:
            habit.specific_days = data['specific_days']
        if 'preferred_time' in data:
            preferred_time = data['preferred_time']
            habit.preferred_time = None if preferred_time == '' else preferred_time
        if 'icon' in data:
            habit.icon = data['icon']
        if 'duration_weeks' in data:
            habit.duration_weeks = int(data['duration_weeks'])
            
        habit.save()
        
        # Return updated habit with progress data
        serializer = HabitSerializer(habit)
        habit_data = serializer.data
        habit_data['progress'] = habit.get_current_progress()
        habit_data['completed_today'] = habit.is_completed_today()
        
        return Response(habit_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Update habit error: {type(e).__name__}: {str(e)}")
        return Response(
            {'error': f'Failed to update habit: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['DELETE'])
def delete_habit(request, habit_id):
    """Delete a habit and all its completions"""
    try:
        habit = get_object_or_404(Habit, id=habit_id)
        habit_name = habit.name
        
        # Delete the habit (this will also delete related completions due to CASCADE)
        habit.delete()
        
        return Response(
            {'message': f'Habit "{habit_name}" deleted successfully'}, 
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        print(f"Delete habit error: {type(e).__name__}: {str(e)}")
        return Response(
            {'error': f'Failed to delete habit: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
def complete_habit(request, habit_id):
    """Mark a habit as completed for today"""
    try:
        habit = get_object_or_404(Habit, id=habit_id)
        today = timezone.now().date()
        notes = request.data.get('notes', '')
        
        # Create or get completion for today
        completion, created = HabitCompletion.objects.get_or_create(
            habit=habit,
            completion_date=today,
            defaults={'notes': notes}
        )
        
        if not created:
            # Update notes if completion already exists
            completion.notes = notes
            completion.save()
        
        # Return updated habit data
        serializer = HabitSerializer(habit)
        habit_data = serializer.data
        habit_data['progress'] = habit.get_current_progress()
        habit_data['completed_today'] = habit.is_completed_today()
        
        return Response(habit_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Complete habit error: {type(e).__name__}: {str(e)}")
        return Response(
            {'error': f'Failed to complete habit: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['DELETE'])
def uncomplete_habit(request, habit_id):
    """Remove completion for today"""
    try:
        habit = get_object_or_404(Habit, id=habit_id)
        today = timezone.now().date()
        
        # Delete today's completion if it exists
        HabitCompletion.objects.filter(
            habit=habit,
            completion_date=today
        ).delete()
        
        # Return updated habit data
        serializer = HabitSerializer(habit)
        habit_data = serializer.data
        habit_data['progress'] = habit.get_current_progress()
        habit_data['completed_today'] = habit.is_completed_today()
        
        return Response(habit_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Uncomplete habit error: {type(e).__name__}: {str(e)}")
        return Response(
            {'error': f'Failed to uncomplete habit: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
def stats_data(request):
    """Get comprehensive statistics for all habits"""
    try:
        today = timezone.now().date()
        
        # Get date range parameter (default to 'all')
        date_range = request.GET.get('dateRange', 'all')
        
        # Calculate date filters based on range
        if date_range == 'week':
            start_date = today - timedelta(days=7)
        elif date_range == 'month':
            start_date = today - timedelta(days=30)
        elif date_range == 'quarter':
            start_date = today - timedelta(days=90)
        elif date_range == 'year':
            start_date = today - timedelta(days=365)
        else:
            start_date = None
        
        # Get all active habits
        habits = Habit.objects.filter(is_active=True)
        
        if not habits.exists():
            return Response({
                'overallStats': {
                    'totalHabits': 0,
                    'totalCompletions': 0,
                    'averageCompletionRate': 0,
                    'bestStreak': None,
                    'worstPerformer': None,
                    'bestPerformer': None,
                    'daysActive': 0
                },
                'habitStats': [],
                'streakData': []
            })
        
        # Calculate overall stats
        total_habits = habits.count()
        
        # Get completions with date filter if applicable
        completions_query = HabitCompletion.objects.all()
        if start_date:
            completions_query = completions_query.filter(completion_date__gte=start_date)
        
        total_completions = completions_query.count()
        
        # Calculate days active (days since first habit created)
        first_habit_date = habits.order_by('creation_date').first().creation_date.date()
        days_active = (today - first_habit_date).days + 1
        
        # Calculate individual habit stats and streaks
        habit_stats_list = []
        streak_data_list = []
        completion_rates = []
        
        for habit in habits:
            # Get completions for this habit
            habit_completions = HabitCompletion.objects.filter(habit=habit)
            if start_date:
                filtered_completions = habit_completions.filter(completion_date__gte=start_date)
                total_habit_completions = filtered_completions.count()
                days_in_period = (today - max(start_date, habit.creation_date.date())).days + 1
            else:
                total_habit_completions = habit_completions.count()
                days_in_period = (today - habit.creation_date.date()).days + 1
            
            # Calculate expected completions based on periodicity
            if habit.periodicity == 'daily':
                expected_completions = days_in_period * habit.frequency
            elif habit.periodicity == 'weekly':
                expected_completions = (days_in_period // 7) * habit.frequency
            else:  # monthly
                expected_completions = (days_in_period // 30) * habit.frequency
            
            expected_completions = max(1, expected_completions)  # Avoid division by zero
            completion_rate = min(100, (total_habit_completions / expected_completions) * 100)
            completion_rates.append(completion_rate)
            
            # Calculate average per week
            weeks_active = max(1, days_in_period / 7)
            average_per_week = total_habit_completions / weeks_active
            
            # Calculate streaks
            current_streak, longest_streak, last_completed = calculate_streaks(habit)
            
            # Build habit stats
            habit_stat = {
                'habitId': habit.id,
                'habitName': habit.name,
                'habitIcon': habit.icon,
                'category': habit.category,
                'totalCompletions': total_habit_completions,
                'completionRate': round(completion_rate, 1),
                'averagePerWeek': round(average_per_week, 1),
                'createdDays': days_in_period
            }
            habit_stats_list.append(habit_stat)
            
            # Build streak data
            streak_data = {
                'habitId': habit.id,
                'habitName': habit.name,
                'habitIcon': habit.icon,
                'currentStreak': current_streak,
                'longestStreak': longest_streak,
                'lastCompletedDate': last_completed.isoformat() if last_completed else None
            }
            streak_data_list.append(streak_data)
        
        # Calculate overall completion rate
        average_completion_rate = sum(completion_rates) / len(completion_rates) if completion_rates else 0
        
        # Find best and worst performers
        best_performer = max(habit_stats_list, key=lambda x: x['completionRate']) if habit_stats_list else None
        worst_performer = min(habit_stats_list, key=lambda x: x['completionRate']) if habit_stats_list else None
        
        # Find best current streak
        best_streak = max(streak_data_list, key=lambda x: x['currentStreak']) if streak_data_list else None
        if best_streak and best_streak['currentStreak'] == 0:
            best_streak = None
        
        # Build response
        response_data = {
            'overallStats': {
                'totalHabits': total_habits,
                'totalCompletions': total_completions,
                'averageCompletionRate': round(average_completion_rate, 1),
                'bestStreak': best_streak,
                'worstPerformer': worst_performer,
                'bestPerformer': best_performer,
                'daysActive': days_active
            },
            'habitStats': habit_stats_list,
            'streakData': streak_data_list
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Stats error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Failed to load statistics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def calculate_streaks(habit):
    """Calculate current and longest streaks for a habit"""
    completions = HabitCompletion.objects.filter(
        habit=habit
    ).order_by('-completion_date').values_list('completion_date', flat=True)
    
    if not completions:
        return 0, 0, None
    
    completion_dates = list(completions)
    last_completed = completion_dates[0] if completion_dates else None
    
    # Calculate current streak
    current_streak = 0
    today = timezone.now().date()
    
    # Check if completed today or yesterday (depending on habit periodicity)
    check_date = today
    for completion_date in completion_dates:
        if completion_date == check_date:
            current_streak += 1
            check_date = check_date - timedelta(days=1)
        else:
            break
    
    # Calculate longest streak
    longest_streak = 0
    temp_streak = 0
    
    if completion_dates:
        completion_dates.sort()  # Sort in ascending order for streak calculation
        prev_date = None
        
        for completion_date in completion_dates:
            if prev_date is None:
                temp_streak = 1
            elif (completion_date - prev_date).days == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
            prev_date = completion_date
        
        longest_streak = max(longest_streak, temp_streak)
    
    return current_streak, longest_streak, last_completed
