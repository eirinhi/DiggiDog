from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
import django.utils.timezone
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta


class UserManager(BaseUserManager):
    def create_user(self, username, name, password=None):
        if not username:
            raise ValueError("Username is required")

        user = self.model(username=username, name=name)
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
    picture = models.ImageField(upload_to="competition_pics/", blank=True, null=True)


    def __str__(self):
        return self.name
    
    def clean(self):
        now = timezone.now()

        if not self.created_by.is_admin:
            raise ValidationError("Only admin users can create competitions.")

        if self.start_date < now:
            raise ValidationError({"start_date": "Start date cannot be in the past."})

        if self.end_date <= self.start_date:
            raise ValidationError({"end_date": "End date cannot be before start date."})
        
        max_duration = timedelta(weeks=2)
        if self.end_date - self.start_date > max_duration:
            raise ValidationError({"start_date": "Competition cannot last more than 2 weeks."})
        
        max_future = now + timedelta(days=61)
        if self.start_date > max_future:
            raise ValidationError({"start_date": "Competition cannot start more than 2 months from now."})
        
        if not (1 <= self.max_participants <= 20):
            raise ValidationError({"max_participants": "Number of participants must be between 1 and 20."})

class Dog(models.Model): 
    id = models.BigAutoField(auto_created= True, primary_key=True)
    name = models.CharField(max_length=100)
    breed = models.CharField(max_length=100)
    age = models.PositiveIntegerField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE)

    picture = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

    def clean(self):
        if not self.name.strip():
            raise ValidationError({"name": "Name cannot be blank."})
        if not self.breed.strip():
            raise ValidationError({"breed": "Breed cannot be blank."})
        if self.age > 30:
            raise ValidationError({"age": "Age cannot exceed 30."})

class Participant(models.Model):
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="participants")
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name="participants")
    dog = models.ForeignKey('Dog', on_delete=models.CASCADE, null=True)

    class Meta:
        unique_together = ("competition", "user", "dog")

    def __str__(self):
        return f"Participant(user={self.user.username}, comp={self.competition.name}, dog={self.dog.name})"

    def clean(self):
        if self.competition and self.competition.max_participants is not None:
            qs = Participant.objects.filter(competition=self.competition)
            if not self.pk:
                current_count = qs.count()
            else:
                current_count = qs.exclude(pk=self.pk).count()
            if current_count >= self.competition.max_participants:
                raise ValidationError("The competition has reached its maximum number of participants.")

        if self.dog and self.user and self.dog.owner != self.user:
            raise ValidationError("The dog does not belong to this user.")

        if self.competition and self.user and self.dog:
            duplicate = Participant.objects.filter(
                competition=self.competition,
                user=self.user,
                dog=self.dog,
            )
            if self.pk:
                duplicate = duplicate.exclude(pk=self.pk)
            if duplicate.exists():
                raise ValidationError("This dog has already been entered.")    

class Ad(models.Model):
    id = models.BigAutoField(auto_created=True, primary_key=True)
    file = models.FileField(upload_to="images/")

