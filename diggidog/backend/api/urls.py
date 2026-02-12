from django.urls import path
from .views import hello_world, register, login, create_competition, get_competitions

urlpatterns = [
    path('hello/', hello_world),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('create_comp/', create_competition),
    path('get_comps/', get_competitions, name='get_comps')

]
