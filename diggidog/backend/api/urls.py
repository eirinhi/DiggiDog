from django.urls import path
from .views import hello_world, register, login, create_competition

urlpatterns = [
    path('hello/', hello_world),
    path('register/', register),
    path('login/', login),
    path('create_comp/', create_competition),
]
