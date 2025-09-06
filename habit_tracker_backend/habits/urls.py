from django.urls import path
from . import views

urlpatterns = [
    path('preloaded/', views.preloaded_habits, name='preloaded-habits'),
    path('dashboard/', views.dashboard_data, name='dashboard-data'),
    path('api/habits/create/', views.create_habit, name='create_habit'),
]
