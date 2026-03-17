
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .models import User, Competition, Participant, Dog, Ad, Comment, Like
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime
from random import choice
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


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
        return Response({"error": "Invalid credentials"}, status=401)

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

@api_view(['POST'])
def register_participant(request):
    user_id = request.data.get("user_id")
    competition_id = request.data.get("competition_id")
    dog_id = request.data.get("dog_id")

    if not user_id or not competition_id or not dog_id:
        return Response({"error": "user-id, competition-id and dog-id are required"}, status=400)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    try:
        competition = Competition.objects.get(id=competition_id)
    except Competition.DoesNotExist:
        return Response({"error": "Competition not found"}, status=404)
    
    try:
        dog = Dog.objects.get(id=dog_id)
    except Dog.DoesNotExist:
        return Response({"error": "Dog not found"}, status=404)
    
    if dog.owner != user:
        return Response({"error": "Dog does not belong to this user"}, status=400)

    participant = Participant(user=user, competition=competition, dog=dog)
    try:
        participant.full_clean()
        participant.save()
    except ValidationError as e:
        return Response({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=400)
    
    return Response({
        "message": "Participant registered",
        "participant": {
            "id": participant.id,
            "user_id": user.id,
            "competition_id": competition.id,
            "dog_id": participant.dog.id
        }
    }, status=201)

@api_view(['GET'])
def get_participant(request, competition_id):
    try:
        competition = Competition.objects.get(id=competition_id)
    except Competition.DoesNotExist:
        return Response({"error": "Competition not found"}, status=404)
    pts = []
    for p in competition.participants.all():
        pts.append({
            "id": p.id,
            "user_id": p.user.id,
            "dog_id": p.dog.id
        })
    return Response(pts, status=200)

@api_view(['PUT', 'PATCH', 'DELETE'])
def update_participant(request, participant_id):
    try:
        participant = Participant.objects.get(id=participant_id)
    except Participant.DoesNotExist:
        return Response({"error": "Participant not found"}, status=404)
    
    if request.method == 'DELETE':
        participant.delete()
        return Response({"message": "Participant removed"}, status=200)

    dog_id = request.data.get("dog_id")
    if dog_id:
        try:
            dog = Dog.objects.get(id=dog_id)
        except Dog.DoesNotExist:
            return Response({"error": "Dog not found"}, status=404)
        if dog.owner != participant.user:
            return Response({"error": "Dog does not belong to this user"}, status=400)
        participant.dog = dog

    try:
        participant.full_clean()
        participant.save()
    except ValidationError as e:
        return Response({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=400)
    
    return Response({
        "message": "Participant updated",
        "participant": {
            "id": participant.id,
            "user_id": participant.user.id,
            "competition_id": participant.competition.id,
            "dog_id": participant.dog.id,
        }
    }, status=200)


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

@api_view(['GET'])
def get_dog(request, dog_id):
    try:
        dog = Dog.objects.get(id=dog_id)
    except Dog.DoesNotExist:
        return Response({"error": "Dog not found"}, status=404)

    # Get owner name
    owner_name = dog.owner.name if dog.owner else "Unknown"

    return Response({
        "id": dog.id,
        "name": dog.name,
        "age": dog.age,
        "breed": dog.breed,
        "owner": dog.owner.id,
        "owner_name": owner_name,
        "picture": dog.picture,
    }, status=200)


@api_view(['POST'])
def create_comment(request):
    user_id = request.data.get("user_id")
    participant_id = request.data.get("participant_id")
    text = request.data.get("text")

    if not user_id or not participant_id or not text:
        return Response({"error": "user_id, participant_id and text are required"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    try:
        participant = Participant.objects.get(id=participant_id)
    except Participant.DoesNotExist:
        return Response({"error": "Participant not found"}, status=404)

    comment = Comment(user=user, participant=participant, text=text)

    try:
        comment.full_clean()
        comment.save()
    except ValidationError as e:
        return Response({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=400)

    return Response({
        "message": "Comment created",
        "comment": {
            "id": comment.id,
            "user_id": user.id,
            "participant_id": participant.id,
            "text": comment.text,
            "created_at": comment.created_at.isoformat(),
        }
    }, status=201)

@api_view(['GET'])
def get_comments(request, participant_id):
    try:
        participant = Participant.objects.get(id=participant_id)
    except Participant.DoesNotExist:
        return Response({"error": "Participant not found"}, status=404)

    result = []
    for comment in participant.comments.all().order_by('-created_at'):
        result.append({
            "id": comment.id,
            "user_id": comment.user.id,
            "username": comment.user.username,
            "text": comment.text,
            "created_at": comment.created_at.isoformat(),
        })

    return Response(result, status=200)

@api_view(['DELETE'])
def delete_comment(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({"error": "Comment not found"}, status=404)

    comment.delete()
    return Response({"message": "Comment deleted"}, status=200)


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


@api_view(['POST'])
def like_participant(request):
    user_id = request.data.get("user_id")
    participant_id = request.data.get("participant_id")

    if not user_id or not participant_id:
        return Response({"error": "user_id and participant_id required"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    try:
        participant = Participant.objects.get(id=participant_id)
    except Participant.DoesNotExist:
        return Response({"error": "Participant not found"}, status=404)

    like, created = Like.objects.get_or_create(user=user, participant=participant)

    if not created:
        return Response({"message": "Already liked"}, status=200)

    return Response({
        "message": "Participant liked",
        "user_id": like.user.id,
    }, status=201)


@api_view(['GET'])
def get_likes(request):
    participant_id = request.GET.get("participant_id")
    try:
        participant = Participant.objects.get(id=participant_id)
    except Participant.DoesNotExist:
        return Response({"error": "Participant not found"}, status=404)

    likes = Like.objects.filter(participant=participant)
    likes_data = [{"user_id": like.user.id, "username": like.user.username} for like in likes]

    return Response({"likes": likes_data}, status=200)

@api_view(['DELETE'])
def unlike_participant(request):
    user_id = request.data.get("user_id")
    participant_id = request.data.get("participant_id")

    if not user_id or not participant_id:
        return Response({"error": "user_id and participant_id required"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    try:
        participant = Participant.objects.get(id=participant_id)
    except Participant.DoesNotExist:
        return Response({"error": "Participant not found"}, status=404)

    try:
        like = Like.objects.get(user=user, participant=participant)
        like.delete()
        return Response({"message": "Participant unliked"}, status=200)
    except Like.DoesNotExist:
        return Response({"error": "Like not found"}, status=404)

@api_view(['POST'])
def change_password(request):
    user_id = request.data.get("user_id")
    current_password = request.data.get("current_password")
    new_password = request.data.get("new_password")

    if not user_id or not current_password or not new_password:
        return Response({"error": "All fields are required"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if not user.check_password(current_password):
        return Response({"error": "Current password is incorrect"}, status=400)

    user.set_password(new_password)
    user.save()

    return Response({"message": "Password changed successfully"}, status=200)