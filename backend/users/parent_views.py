from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ParentProfile, StudentProfile
from .parent_serializers import (
    ParentProfileSerializer,
    ParentSignInSerializer,
    ParentSignUpSerializer,
)


def _parent_data(user: User, parent_profile: ParentProfile) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": parent_profile.phone,
        "avatar": parent_profile.avatar.url if parent_profile.avatar else None,
    }


class ParentSignUpAPIView(APIView):
    """Vue pour l'inscription des parents"""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ParentSignUpSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            parent_profile, _ = ParentProfile.objects.get_or_create(user=user)

            refresh = RefreshToken.for_user(user)

            parent_data = _parent_data(user, parent_profile)

            return Response(
                {
                    "success": True,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "parent": parent_data,
                    "message": "Parent account created successfully",
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "success": False,
                "message": "Validation error",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class ParentSignInAPIView(APIView):
    """Vue pour la connexion des parents"""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ParentSignInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Invalid input",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data.get("email")
        password = serializer.validated_data.get("password")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"success": False, "message": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return Response(
                {"success": False, "message": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        parent_profile, _ = ParentProfile.objects.get_or_create(user=user)

        refresh = RefreshToken.for_user(user)

        parent_data = _parent_data(user, parent_profile)

        return Response(
            {
                "success": True,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "parent": parent_data,
                "message": "Login successful",
            },
            status=status.HTTP_200_OK,
        )


class ParentProfileAPIView(APIView):
    """Vue pour obtenir le profil du parent"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        parent_profile, _ = ParentProfile.objects.get_or_create(user=user)

        children_qs = StudentProfile.objects.filter(Q(parent_email__iexact=user.email) | Q(parents=parent_profile))
        children = []
        request_obj = request
        for child in children_qs.distinct():
            child_avatar = None
            try:
                if getattr(child, "avatar", None):
                    child_avatar = request_obj.build_absolute_uri(child.avatar.url)
            except Exception:
                child_avatar = None

            children.append(
                {
                    "id": child.user.id,
                    "first_name": child.first_name,
                    "last_name": child.last_name,
                    "email": child.email,
                    "class_level": child.class_level,
                    "avatar_url": child_avatar,
                }
            )

        parent_data = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": parent_profile.phone,
            "avatar": parent_profile.avatar.url if parent_profile.avatar else None,
            "children": children,
            "children_ids": [c.user.id for c in children_qs.distinct()],
        }

        return Response(
            {
                "success": True,
                "parent": parent_data,
            },
            status=status.HTTP_200_OK,
        )