
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .models import User, Competition, Ad, Dog
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime
from random import choice
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


@api_view(['GET'])
def hello_world(request):
    return Response({"message": "Hello from Django"})


@api_view(['POST'])
def register(request):
    username = request.data.get("username")
    password = request.data.get("password")
    name = request.data.get("name")

    if not username or not password:
        return Response({"error": "Username and password required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(username=username, password=password, name=name)
    
    return Response({
        "message": "User created", 
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "bio": user.bio,
            "is_admin": user.is_admin,
            "data_joined": user.date_joined.timestamp()
        }
    }, status=201)



@api_view(['POST'])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "Username and password required"}, status=400)
    
    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"error": "Invalid credentials"}, status= 401)

    return Response({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "bio": user.bio,
            "is_admin": user.is_admin,
            "data_joined": user.date_joined.timestamp()
        }
    }, status=200)


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_competition(request):
    name = request.data.get("name")
    description = request.data.get("description", "")
    start_date_str = request.data.get("start_date")
    end_date_str = request.data.get("end_date")
    max_participants = request.data.get("max_participants")
    user_id = request.data.get("user_id")

    picture = request.FILES.get("picture")  # expects FormData field "picture"

    if not name or not user_id or not start_date_str or not end_date_str or not max_participants:
        return Response({"error": "Missing required fields"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    start_date = datetime.fromisoformat(start_date_str)
    end_date = datetime.fromisoformat(end_date_str)

    if timezone.is_naive(start_date):
        start_date = timezone.make_aware(start_date)
    if timezone.is_naive(end_date):
        end_date = timezone.make_aware(end_date)

    competition = Competition(
        name=name,
        description=description,
        start_date=start_date,
        end_date=end_date,
        max_participants=int(max_participants),
        created_by=user,
        picture=picture, 
    )

    try:
        competition.full_clean()
        competition.save()
    except ValidationError as e:
        return Response({"error": e.message_dict}, status=400)

    return Response(
        {
            "message": "Competition created",
            "competition": {
                "id": competition.id,
                "name": competition.name,
                "description": competition.description,
                "start_date": competition.start_date,
                "end_date": competition.end_date,
                "max_participants": competition.max_participants,
                "picture": competition.picture.url if competition.picture else None,
            },
        },
        status=201,
    )

@api_view(['GET'])
def get_competitions(request):
    competitions = Competition.objects.all()

    comps = []
    for competition in competitions:
        comps.append({
            "id": competition.id,
            "name": competition.name,
            "description": competition.description,
            "start_date": competition.start_date,
            "end_date": competition.end_date,
            "max_participants": competition.max_participants,
            "picture": competition.picture.url if competition.picture else None,
        })

    return Response(comps, status = 200)



@api_view(['PATCH'])
def update_profile(request):
    user_id = request.data.get("user_id")
    if not user_id:
        return Response({"error": "user_id required"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if "name" in request.data:
        user.name = request.data["name"]
    if "bio" in request.data:
        user.bio = request.data["bio"]
    user.save()

    return Response({
        "message": "Profile updated",
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "bio": user.bio,
            "is_admin": user.is_admin,
            "data_joined": user.date_joined.timestamp()
        }
    }, status=200)

@api_view(['POST'])
def create_dog(request):
    name = request.data.get("name")
    age = request.data.get("age")
    breed = request.data.get("breed")
    owner_id = request.data.get("owner")

    if not name or not age or not breed or not owner_id:
        return Response({"error": "Missing required fields"}, status=400)

    try:
        owner = User.objects.get(id=owner_id)
    except User.DoesNotExist:
        return Response({"error": "Owner not found"}, status=404)

    picture = request.data.get("picture", "")

    dog = Dog(
        name=name,
        age=age,
        breed=breed,
        owner=owner,
        picture=picture if picture else None,
    )

    try:
        dog.full_clean()
    except ValidationError as e:
        return Response({"error": e.message_dict}, status=400)

    dog.save()

    return Response({
        "message": "Dog added",
        "dog": {
            "id": dog.id,
            "name": dog.name,
            "age": dog.age,
            "breed": dog.breed,
            "owner": dog.owner.id,
            "picture": dog.picture,
        }
    }, status=201)

@api_view(['DELETE'])
def delete_dog(request, dog_id):
    try:
        dog = Dog.objects.get(id=dog_id)
    except Dog.DoesNotExist:
        return Response({"error": "Dog not found"}, status=404)

    dog.delete()
    return Response({"message": "Dog deleted"}, status=200)

@api_view(['GET'])
def get_dogs(request):
    owner_id = request.query_params.get("owner")

    if owner_id:
        dogs = Dog.objects.filter(owner_id=owner_id)
    else:
        dogs = Dog.objects.all()

    result = []
    for dog in dogs:
        result.append({
            "id": dog.id,
            "name": dog.name,
            "age": dog.age,
            "breed": dog.breed,
            "owner": dog.owner.id,
            "picture": dog.picture,
        })

    return Response(result, status=200)


@api_view(['POST'])
def upload_ad(request):
    file = request.FILES.get("myfile")

    if not file:
        return Response({"error": "No file uploaded"}, status=400)
    
    ad = Ad(file=file)
    ad.save()

    return Response({"message": "Image saved successfully"}, status=200)


@api_view(['GET'])
def get_ad(request):
    ads = Ad.objects.all()

    if not ads.exists():
        return Response({"error": "No ads found"}, status=404)

    ad = choice(ads)

    return Response({
        "id": ad.id,
        "image_url": ad.file.url
    })


