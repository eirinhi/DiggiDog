from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
import django.utils.timezone


# Create your models here.
class UserManager(BaseUserManager):
    def create_user(self, username, password=None):
        if not username:
            raise ValueError("Username is required")

        user = self.model(username=username)
        user.set_password(password)
        user.save(using=self._db)
        return user

class User(AbstractBaseUser): 
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')
    username = models.CharField(max_length=20, unique=True, verbose_name='username')
    name = models.CharField(max_length=50, blank=True, verbose_name='name')
    bio = models.TextField(blank=True)
    is_admin = models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='admin status')
    date_joined = models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username

class Competition(models.Model):
    id = models.BigAutoField(auto_created=True, primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    max_participants = models.PositiveIntegerField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name



