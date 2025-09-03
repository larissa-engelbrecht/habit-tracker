from django.urls import path
from .views import preloaded_habits
from .views import dashboard_data

urlpatterns = [
    path('preloaded/', preloaded_habits, name='preloaded-habits'),
    path('dashboard/', dashboard_data, name='dashboard-data'),
]
