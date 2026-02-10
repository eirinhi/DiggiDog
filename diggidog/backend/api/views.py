from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .models import User

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
