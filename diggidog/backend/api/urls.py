from django.urls import path
from .views import (hello_world, register, login, create_competition, get_competitions, register_participant, get_participant, update_participant)

urlpatterns = [
    path('hello/', hello_world),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('create_comp/', create_competition, name='create_competition'),
    path('get_comps/', get_competitions, name='get_comps'),
    path('participants/register/', register_participant, name='register_participant'),
    path('competitions/<int:competition_id>/participants/', get_participant, name='get_participants'),
    path('participants/<int:participant_id>/', update_participant, name='participant_detail'),
]
