from django.urls import path
from . import views

urlpatterns = [
    path('preloaded/', views.preloaded_habits, name='preloaded_habits'),
    path('dashboard/', views.dashboard_data, name='dashboard_data'),
    path('create/', views.create_habit, name='create_habit'),
]
