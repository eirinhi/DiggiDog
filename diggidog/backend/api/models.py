from django.db import models
from django.contrib.auth.models import AbstractBaseUser
import django.utils.timezone


# Create your models here.

class User(AbstractBaseUser): 
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')
    username = models.CharField(max_length=20, unique=True, verbose_name='username')
    password = models.CharField(max_length=128, verbose_name='password') 
    is_admin = models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='admin status')
    date_joined = models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')
    bio = models.TextField(blank=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = [
        'password'
    ]

    def __str__(self):
        return self.username
