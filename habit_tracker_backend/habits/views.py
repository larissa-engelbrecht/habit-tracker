from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from habits.models import Habit
from habits.serializers import HabitSerializer

@api_view(['GET'])
def preloaded_habits(request):
    habits = Habit.objects.all()
    serializer = HabitSerializer(habits, many=True)
    return Response(serializer.data)

