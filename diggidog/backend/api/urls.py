from django.urls import path
from .views import hello_world, register, login

urlpatterns = [
    path('hello/', hello_world),
    path('register/', register),
    path('login/', login),
]
