from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .models import User
from .models import Competition

@api_view(['GET'])
def hello_world(request):
    return Response({"message": "Hello from Django"})


@api_view(['POST'])
def register(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "Username and password required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(username=username, password=password)

    return Response({
        "message": "User created", 
        "user": {
            "id": user.id,
            "username": user.username,
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
            "bio": user.bio,
            "is_admin": user.is_admin,
            "data_joined": user.date_joined.timestamp()
        }
    }, status=200)


@api_view(['POST'])
def create_competition(request):
    name = request.data.get("name")
    description = request.data.get("description", "")
    start_date = request.data.get("start_date")
    end_date = request.data.get("end_date")
    max_participants = request.data.get("max_participants")
    user_id = request.data.get("user_id")

    if not name or not user_id or not start_date or not end_date or not max_participants:
        return Response(
            {"error": "Missing required fields"},
            status = 400
        )
    
    try:
        user = User.objects.get(id = user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status = 404)
    
    competition = Competition.objects.create(
        name = name, 
        description = description,
        start_date = start_date,
        end_date = end_date,
        max_participants = max_participants,
        created_by = user
    )

    return Response({
        "message": "Competition created",
        "competition": {
            "id": competition.id,
            "name": competition.name,
            "description": competition.description,
            "start_date": competition.start_date,
            "end_date": competition.end_date,
            "max_participants": competition.max_participants,
        }
    }, status = 201)