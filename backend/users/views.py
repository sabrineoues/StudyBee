from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    AdminUserCreateSerializer,
    AdminUserSerializer,
    AdminUserUpdateSerializer,
    StudentSignUpSerializer,
    StudentProfileMeSerializer,
)

from .models import StudentProfile


class StudentSignUpAPIView(APIView):
    def post(self, request):
        serializer = StudentSignUpSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentSignInAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        identifier = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""

        if not identifier or not password:
            return Response(
                {"detail": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = None
        try:
            user = User.objects.get(email__iexact=identifier)
        except User.DoesNotExist:
            try:
                user = User.objects.get(username=identifier)
            except User.DoesNotExist:
                return Response(
                    {"detail": "Invalid credentials."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        if not user.check_password(password):
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                },
            },
            status=status.HTTP_200_OK,
        )


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            },
            status=status.HTTP_200_OK,
        )


class AdminStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return Response(
            {
                "users_total": User.objects.count(),
                "users_staff": User.objects.filter(is_staff=True).count(),
            },
            status=status.HTTP_200_OK,
        )


class AdminUsersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        users = User.objects.all().order_by("id")
        return Response(AdminUserSerializer(users, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AdminUserSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, user_id: int):
        return User.objects.get(pk=user_id)

    def get(self, request, user_id: int):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = self.get_object(user_id)
        except User.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)

    def patch(self, request, user_id: int):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = self.get_object(user_id)
        except User.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)

    def delete(self, request, user_id: int):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = self.get_object(user_id)
        except User.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = StudentProfile.objects.filter(user=user).first()
        serializer = StudentProfileMeSerializer(
            {"user": user, "profile": profile},
            context={"user": user, "request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        user = request.user
        profile, _created = StudentProfile.objects.get_or_create(
            user=user,
            defaults={
                "first_name": user.first_name or "Prénom",
                "last_name": user.last_name or "Nom",
                "email": user.email or "email@example.com",
            },
        )

        serializer = StudentProfileMeSerializer(
            {"user": user, "profile": profile},
            data=request.data,
            partial=True,
            context={"user": user, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Update User
        if "email" in data:
            user.email = data["email"]
        if "username" in data:
            user.username = data["username"]
        if "first_name" in data:
            user.first_name = data["first_name"]
        if "last_name" in data:
            user.last_name = data["last_name"]
        user.save()

        # Keep profile identity fields in sync
        profile.email = user.email
        profile.first_name = user.first_name or profile.first_name
        profile.last_name = user.last_name or profile.last_name

        # Update StudentProfile
        if "date_of_birth" in data:
            profile.date_of_birth = data["date_of_birth"]
        if "class_level" in data:
            profile.class_level = data["class_level"]
        if "speciality" in data:
            profile.speciality = data["speciality"]
        if "parent_email" in data:
            profile.parent_email = data["parent_email"]
        if "parent_phone" in data:
            profile.parent_phone = data["parent_phone"]
        if "language" in data:
            profile.language = data["language"]
        profile.save()

        out = StudentProfileMeSerializer({"user": user, "profile": profile}, context={"user": user, "request": request})
        return Response(out.data, status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileAvatarAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request):
        user = request.user
        profile, _created = StudentProfile.objects.get_or_create(
            user=user,
            defaults={
                "first_name": user.first_name or "Prénom",
                "last_name": user.last_name or "Nom",
                "email": user.email or "email@example.com",
            },
        )

        avatar = request.FILES.get("avatar")
        if not avatar:
            return Response({"avatar": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)

        profile.avatar = avatar
        profile.save()

        out = StudentProfileMeSerializer({"user": user, "profile": profile}, context={"user": user, "request": request})
        return Response(out.data, status=status.HTTP_200_OK)
