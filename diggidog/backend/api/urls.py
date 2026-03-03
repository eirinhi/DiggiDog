from django.urls import path
from .views import hello_world, register, login, create_competition, get_competitions, create_dog, get_dogs, delete_dog, update_profile, get_ad, upload_ad


urlpatterns = [
    path('hello/', hello_world),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('create_comp/', create_competition, name='create_competition'),
    path('get_comps/', get_competitions, name='get_comps'),
    path('profile/update/', update_profile, name='update_profile'),
    path('dogs/', get_dogs, name='get_dogs'),
    path('dogs/create/', create_dog, name='create_dog'),
    path('dogs/<int:dog_id>/delete/', delete_dog, name='delete_dog'),
    path('get_ad/', get_ad, name='get_ad'),
    path('upload_ad/', upload_ad, name='upload_ad')
]
