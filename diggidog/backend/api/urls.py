from django.urls import path
from .views import get_likes, hello_world, like_participant, register, login, create_competition, get_competitions, register_participant, get_participant, unlike_participant, update_participant, update_profile, create_dog, get_dogs, delete_dog, get_ad, upload_ad

urlpatterns = [
    path('hello/', hello_world),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('create_comp/', create_competition, name='create_competition'),
    path('get_comps/', get_competitions, name='get_comps'),
    path('participants/register/', register_participant, name='register_participant'),
    path('competitions/<int:competition_id>/participants/', get_participant, name='get_participants'),
    path('participants/<int:participant_id>/', update_participant, name='participant_detail'),
    path('profile/update/', update_profile, name='update_profile'),
    path('dogs/', get_dogs, name='get_dogs'),
    path('dogs/create/', create_dog, name='create_dog'),
    path('dogs/<int:dog_id>/delete/', delete_dog, name='delete_dog'),
    path('get_ad/', get_ad, name='get_ad'),
    path('upload_ad/', upload_ad, name='upload_ad'),
    path('like_participant/', like_participant, name='like_participant'),
    path('get_likes/', get_likes, name='get_likes'),
    path('unlike_participant/', unlike_participant, name='unlike_participant'),
]
