from django.urls import path
from .views import preloaded_habits

urlpatterns = [
    path('preloaded/', preloaded_habits, name='preloaded-habits'),
]
