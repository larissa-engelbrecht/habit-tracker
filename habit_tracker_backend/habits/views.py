from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from habits.models import Habit, HabitCompletion, PeriodCompletion, HabitTemplate
from habits.serializers import (
    HabitSerializer, 
    HabitWithProgressSerializer,
    HabitDashboardSerializer,
    HabitTemplateSerializer
)
from django.utils import timezone
from datetime import timedelta, date
from django.db.models import Count, Q, Avg
from collections import defaultdict
import json

@api_view(['GET'])
def preloaded_habits(request):
    """Get all habit templates, excluding those already started by user"""
    # Get all active habit template IDs
    started_template_ids = Habit.objects.filter(
        is_active=True, 
        template__isnull=False
    ).values_list('template_id', flat=True)
    
    # Get templates not yet started
    templates = HabitTemplate.objects.exclude(id__in=started_template_ids)
    
    serializer = HabitTemplateSerializer(templates, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def active_habits(request):
    has_active = Habit.objects.filter(is_active=True).exists()
    return Response({'has_active_habits': has_active})

@api_view(['GET'])
def dashboard_data(request):
    """Get dashboard data with proper period tracking"""
    try:
        today = timezone.now().date()
        habits = Habit.objects.filter(is_active=True)
        
        # Use the dashboard serializer - it handles all the computed fields!
        habits_data = HabitDashboardSerializer(habits, many=True).data
        
        # Calculate summary stats
        completed_today = sum(1 for h in habits_data if h['completed_today'])
        periods_completed = sum(1 for h in habits_data if h['period_marked_complete'])
        
        dashboard_data = {
            'total_habits': habits.count(),
            'completed_today': completed_today,
            'periods_completed': periods_completed,
            'active_habits': habits.count(),
            'habits': habits_data,
            'current_date': today.isoformat()
        }
        
        return Response(dashboard_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Failed to load dashboard: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def create_habit(request):
    """Create a new habit"""
    try:
        serializer = HabitSerializer(data=request.data)
        
        if serializer.is_valid():
            habit = serializer.save(is_active=True, started_date=timezone.now())
            
            # Return with progress data
            response_serializer = HabitWithProgressSerializer(habit)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        print(f"Create habit error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Failed to create habit: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
@api_view(['POST'])
def start_habit_from_template(request, template_id):
    """Create a habit from a template"""
    try:
        template = get_object_or_404(HabitTemplate, id=template_id)
        
        # Create new habit from template
        new_habit = Habit.objects.create(
            name=template.name,
            category=template.category,
            goal_description=template.goal_description,
            periodicity=template.periodicity,
            frequency=template.frequency,
            specific_days=template.specific_days,
            preferred_time=template.preferred_time,
            icon=template.icon,
            week_starts_on=template.week_starts_on,
            duration_weeks=template.duration_weeks,
            is_active=True,
            started_date=timezone.now(),
            template=template
        )
        
        response_serializer = HabitWithProgressSerializer(new_habit)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
    except HabitTemplate.DoesNotExist:
        return Response(
            {'error': 'Template not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['PUT', 'PATCH'])
def update_habit(request, habit_id):
    """Update an existing habit"""
    try:
        habit = get_object_or_404(Habit, id=habit_id)
        
        # CHANGED: Use serializer for validation and update (partial=True allows PATCH)
        serializer = HabitSerializer(habit, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            # Return with progress data
            response_serializer = HabitWithProgressSerializer(habit)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        print(f"Update habit error: {str(e)}")
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
        print(f"Delete habit error: {str(e)}")
        return Response(
            {'error': f'Failed to delete habit: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
def complete_habit(request, habit_id):
    """Mark a habit as completed"""
    try:
        habit = get_object_or_404(Habit, id=habit_id)
        
        # Get completion date from request or use today
        completion_date_str = request.data.get('completion_date')
        if completion_date_str:
            completion_date = date.fromisoformat(completion_date_str)
        else:
            completion_date = timezone.now().date()
        
        notes = request.data.get('notes', '')
        
        # Check if habit can be completed
        if habit.periodicity == 'daily':
            # For daily habits, one completion per day
            completion, created = HabitCompletion.objects.get_or_create(
                habit=habit,
                completion_date=completion_date,
                defaults={'notes': notes}
            )
            
            if not created:
                return Response(
                    {'error': 'Habit already completed for this day'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # For weekly/monthly habits, check period limit
            period_start, period_end = habit.get_period_boundaries(completion_date)
            period_completions = HabitCompletion.objects.filter(
                habit=habit,
                completion_date__gte=period_start,
                completion_date__lte=period_end
            ).count()
            
            if period_completions >= habit.frequency:
                return Response(
                    {'error': f'Habit frequency limit ({habit.frequency}) reached for this period'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create completion
            completion = HabitCompletion.objects.create(
                habit=habit,
                completion_date=completion_date,
                notes=notes
            )
        
        # CHANGED: Use serializer
        response_serializer = HabitWithProgressSerializer(habit)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Complete habit error: {str(e)}")
        return Response(
            {'error': f'Failed to complete habit: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['DELETE'])
def uncomplete_habit(request, habit_id):
    """Remove completion for a specific date"""
    try:
        habit = get_object_or_404(Habit, id=habit_id)
        
        # Get date from request or use today
        completion_date_str = request.data.get('completion_date')
        if completion_date_str:
            completion_date = date.fromisoformat(completion_date_str)
        else:
            completion_date = timezone.now().date()
        
        # Delete the most recent completion for this date
        deleted_count = HabitCompletion.objects.filter(
            habit=habit,
            completion_date=completion_date
        ).delete()[0]
        
        if deleted_count == 0:
            return Response(
                {'error': 'No completion found for this date'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Also delete any PeriodCompletion if it exists
        period_start, period_end = habit.get_period_boundaries(completion_date)
        PeriodCompletion.objects.filter(
            habit=habit,
            period_start=period_start,
            period_end=period_end
        ).delete()
        
        # CHANGED: Use serializer
        response_serializer = HabitWithProgressSerializer(habit)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Uncomplete habit error: {str(e)}")
        return Response(
            {'error': f'Failed to uncomplete habit: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
def period_completion_history(request, habit_id):
    """Get period completion history for a habit"""
    try:
        habit = get_object_or_404(Habit, id=habit_id)
        
        # Get number of periods to show (default 12)
        num_periods = int(request.GET.get('periods', 12))
        
        # Get completion rate data
        completion_data = habit.get_completion_rate_by_period(num_periods)
        
        # Get actual period completion records
        period_completions = habit.period_completions.all()[:num_periods]
        
        completion_records = []
        for pc in period_completions:
            completion_records.append({
                'period_start': pc.period_start.isoformat(),
                'period_end': pc.period_end.isoformat(),
                'completed_at': pc.completed_at.isoformat(),
                'completion_count': pc.completion_count,
                'exceeded_target': pc.completion_count > habit.frequency
            })
        
        response_data = {
            'habit': {
                'id': habit.id,
                'name': habit.name,
                'icon': habit.icon,
                'periodicity': habit.periodicity,
                'frequency': habit.frequency
            },
            'completion_rate_data': completion_data,
            'completion_records': completion_records,
            'current_period': habit.get_current_progress()  # CHANGED: Fixed method name
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Period history error: {str(e)}")
        return Response(
            {'error': f'Failed to load period history: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def habit_tracking_board(request, habit_id):
    """Get tracking board data for a specific habit"""
    try:
        habit = get_object_or_404(Habit, id=habit_id)
        
        # Get weeks parameter (default 12 weeks)
        weeks = int(request.GET.get('weeks', 12))
        
        board_data = habit.get_tracking_board_data(weeks_back=weeks)
        
        # Add habit info
        response_data = {
            'habit': {
                'id': habit.id,
                'name': habit.name,
                'icon': habit.icon,
                'category': habit.category,
                'periodicity': habit.periodicity,
                'frequency': habit.frequency,
                'specific_days': habit.specific_days
            },
            'board': board_data,
            'statistics': habit.get_statistics()
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Tracking board error: {str(e)}")
        return Response(
            {'error': f'Failed to load tracking board: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def all_habits_tracking_board(request):
    """Get combined tracking board for all habits"""
    try:
        weeks = int(request.GET.get('weeks', 12))
        habits = Habit.objects.filter(is_active=True)
        
        if not habits.exists():
            return Response({
                'habits': [],
                'combined_board': {
                    'grid': [],
                    'start_date': None,
                    'end_date': None
                }
            })
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(weeks=weeks)
        
        # Collect all habits data
        habits_boards = []
        combined_grid = {}
        
        for habit in habits:
            board_data = habit.get_tracking_board_data(weeks_back=weeks)
            habits_boards.append({
                'habit_id': habit.id,
                'habit_name': habit.name,
                'habit_icon': habit.icon,
                'board': board_data
            })
            
            # Combine into overall grid
            for day_data in board_data['grid']:
                date_key = day_data['date']
                if date_key not in combined_grid:
                    combined_grid[date_key] = {
                        'date': date_key,
                        'total_completions': 0,
                        'total_expected': 0,
                        'habits_completed': []
                    }
                
                if day_data['completed']:
                    combined_grid[date_key]['total_completions'] += 1
                    combined_grid[date_key]['habits_completed'].append({
                        'id': habit.id,
                        'name': habit.name,
                        'icon': habit.icon
                    })
        
        # Convert combined grid to sorted list
        grid_list = sorted(combined_grid.values(), key=lambda x: x['date'])
        
        # Calculate intensity levels for combined board
        for day in grid_list:
            total_habits = habits.count()
            completion_rate = day['total_completions'] / total_habits if total_habits > 0 else 0
            
            if completion_rate == 0:
                day['intensity'] = 0
            elif completion_rate < 0.25:
                day['intensity'] = 1
            elif completion_rate < 0.5:
                day['intensity'] = 2
            elif completion_rate < 0.75:
                day['intensity'] = 3
            else:
                day['intensity'] = 4
        
        response_data = {
            'habits': habits_boards,
            'combined_board': {
                'grid': grid_list,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'total_habits': habits.count()
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Combined tracking board error: {str(e)}")
        return Response(
            {'error': f'Failed to load tracking board: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def stats_data(request):
    """Get comprehensive statistics with proper period tracking"""
    try:
        date_range = request.GET.get('dateRange', 'all')
        habits = Habit.objects.filter(is_active=True)
        
        if not habits.exists():
            return Response({
                'overallStats': {
                    'totalHabits': 0,
                    'totalCompletions': 0,
                    'averageCompletionRate': 0,
                    'bestStreak': None,
                    'bestPerformer': None,
                    'worstPerformer': None,
                    'daysActive': 0
                },
                'habitStats': [],
                'streakData': []
            })
        
        # Calculate date range
        today = timezone.now().date()
        date_range_days = None
        
        if date_range == 'week':
            date_range_days = 7
        elif date_range == 'month':
            date_range_days = 30
        elif date_range == 'quarter':
            date_range_days = 90
        elif date_range == 'year':
            date_range_days = 365

        # Calculate days active (from earliest habit creation to today)
        earliest_habit = habits.order_by('started_date').first()
        days_active = 0
        if earliest_habit and earliest_habit.started_date:
            days_active = (today - earliest_habit.started_date.date()).days
        
        # Collect stats for each habit
        habit_stats_list = []
        all_completion_rates = []
        streak_data_list = []
        
        for habit in habits:
            stats = habit.get_statistics(date_range_days)
            progress = habit.get_current_progress() 

             # Calculate days since habit creation
            created_days = 0
            if habit.started_date:
                created_days = (today - habit.started_date.date()).days
            
            habit_stat = {
                'habitId': habit.id,
                'habitName': habit.name,
                'habitIcon': habit.icon,
                'category': habit.category,
                'periodicity': habit.periodicity,
                'frequency': habit.frequency,
                'totalCompletions': stats['total_completions'],
                'completionRate': stats['completion_rate'],
                'currentStreak': stats['current_streak'],
                'longestStreak': stats['longest_streak'],
                'averagePerWeek': stats['average_per_week'],
                'createdDays': created_days
            }
            
            habit_stats_list.append(habit_stat)
            all_completion_rates.append(stats['completion_rate'])

             # Build streak data
            # Get last completion date for this habit
            last_completion = habit.completions.order_by('-completion_date').first()
            last_completed_date = last_completion.completion_date.isoformat() if last_completion else None
            
            streak_data_list.append({
                'habitId': habit.id,
                'habitName': habit.name,
                'habitIcon': habit.icon,
                'currentStreak': stats['current_streak'],
                'longestStreak': stats['longest_streak'],
                'lastCompletedDate': last_completed_date
            })
        
        # Sort streaks by current streak length
        streak_data_list.sort(key=lambda x: x['currentStreak'], reverse=True)

        # Find best streak (highest current streak)
        best_streak = None
        if streak_data_list and streak_data_list[0]['currentStreak'] > 0:
            best_streak = streak_data_list[0]
        
        # Calculate overall stats
        total_completions = sum(h['totalCompletions'] for h in habit_stats_list)
        avg_completion_rate = sum(all_completion_rates) / len(all_completion_rates) if all_completion_rates else 0
        
        # Find best and worst performers
        best_performer = None
        worst_performer = None
        
        if habit_stats_list:
            if len(habit_stats_list) == 1:
                # Only one habit - it's the best, no worst
                best_performer = habit_stats_list[0]
            else:
                best_performer = max(habit_stats_list, key=lambda x: x['completionRate'])
                potential_worst = min(habit_stats_list, key=lambda x: x['completionRate'])
                
                # Only show worst if completion rate is below 80%
                if potential_worst['completionRate'] < 80:
                    worst_performer = potential_worst
        
        response_data = {
            'overallStats': {
                'totalHabits': habits.count(),
                'totalCompletions': total_completions,
                'averageCompletionRate': round(avg_completion_rate, 1),
                'bestStreak': best_streak,
                'bestPerformer': best_performer,
                'worstPerformer': worst_performer,
                'daysActive': days_active
            },
            'habitStats': habit_stats_list,
            'streakData': streak_data_list
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Stats error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Failed to load statistics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def calculate_period_statistics(habits, date_range_days):
    """Calculate statistics grouped by period"""
    if date_range_days:
        start_date = timezone.now().date() - timedelta(days=date_range_days)
    else:
        # Get the earliest habit creation date
        earliest_habit = habits.order_by('creation_date').first()
        start_date = earliest_habit.creation_date.date() if earliest_habit else timezone.now().date()
    
    end_date = timezone.now().date()
    
    # Group completions by period
    period_data = defaultdict(lambda: {
        'total_completions': 0,
        'total_expected': 0,
        'habits_completed': set()
    })
    
    for habit in habits:
        completions = habit.completions.filter(
            completion_date__gte=start_date,
            completion_date__lte=end_date
        )
        
        for completion in completions:
            period_start, period_end = habit.get_period_boundaries(completion.completion_date)
            
            # Use week number for weekly, month for monthly
            if habit.periodicity == 'daily':
                period_key = completion.completion_date.isoformat()
            elif habit.periodicity == 'weekly':
                period_key = f"Week {completion.completion_date.isocalendar()[1]}, {completion.completion_date.year}"
            else:  # monthly
                period_key = f"{completion.completion_date.strftime('%B %Y')}"
            
            period_data[period_key]['total_completions'] += 1
            period_data[period_key]['habits_completed'].add(habit.name)
    
    # Convert to list and sort
    period_list = []
    for period_key, data in period_data.items():
        period_list.append({
            'period': period_key,
            'total_completions': data['total_completions'],
            'unique_habits': len(data['habits_completed'])
        })
    
    period_list.sort(key=lambda x: x['period'])
    
    return period_list[-10:]  # Return last 10 periods