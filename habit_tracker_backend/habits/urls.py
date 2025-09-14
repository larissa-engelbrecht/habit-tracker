from django.urls import path
from . import views

urlpatterns = [
    path('preloaded/', views.preloaded_habits, name='preloaded_habits'),
    path('dashboard/', views.dashboard_data, name='dashboard_data'),
    path('create/', views.create_habit, name='create_habit'),

      # New URLs for CRUD operations
    path('<int:habit_id>/update/', views.update_habit, name='update_habit'),
    path('<int:habit_id>/delete/', views.delete_habit, name='delete_habit'),
    
    # Completion URLs
    path('<int:habit_id>/complete/', views.complete_habit, name='complete_habit'),
    path('<int:habit_id>/uncomplete/', views.uncomplete_habit, name='uncomplete_habit'),
    
    # Stats URL
    path('stats/', views.stats_data, name='stats_data'),
]
