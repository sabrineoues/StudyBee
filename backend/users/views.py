import logging

from django.conf import settings
from django.core.exceptions import FieldDoesNotExist
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum

from .serializers import (
    AdminUserCreateSerializer,
    AdminUserSerializer,
    AdminUserUpdateSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    StudentSignUpSerializer,
    StudentProfileMeSerializer,
)

from .models import StudentProfile


logger = logging.getLogger(__name__)


def _build_password_reset_url(*, uidb64: str, token: str) -> str:
    base = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
    if not base:
        return ""
    return f"{base}/reset-password?uid={uidb64}&token={token}"


def _compose_password_reset_email(*, reset_url: str, language: str | None = None) -> tuple[str, str]:
    lang = (language or "en").lower()
    if lang == "fr":
        subject = "Réinitialisation de votre mot de passe StudyBee"
        message = (
            "Bonjour,\n\n"
            "Vous avez demandé la réinitialisation de votre mot de passe StudyBee.\n"
            f"Pour choisir un nouveau mot de passe, cliquez sur ce lien :\n{reset_url}\n\n"
            "Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet email.\n"
        )
        return subject, message

    subject = "Reset your StudyBee password"
    message = (
        "Hi,\n\n"
        "We received a request to reset your StudyBee password.\n"
        f"Use this link to choose a new password:\n{reset_url}\n\n"
        "If you did not request this, you can ignore this email.\n"
    )
    return subject, message


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


class HomeStatsAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        from studysessions.models import StudySession

        students_supported = StudentProfile.objects.count()
        total_minutes = (
            StudySession.objects.filter(status="completed")
            .aggregate(total=Sum("study_duration"))
            .get("total")
            or 0
        )
        total_minutes = int(total_minutes)
        total_hours = float(total_minutes) / 60.0

        return Response(
            {
                "students_supported": students_supported,
                "study_minutes_guided": total_minutes,
                "study_hours_guided": round(total_hours, 1),
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
        if "camera_access_enabled" in data:
            profile.camera_access_enabled = data["camera_access_enabled"]
        if "microphone_access_enabled" in data:
            profile.microphone_access_enabled = data["microphone_access_enabled"]
        profile.save()

        out = StudentProfileMeSerializer(
            {"user": user, "profile": profile},
            context={"user": user, "request": request},
        )
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

        out = StudentProfileMeSerializer(
            {"user": user, "profile": profile},
            context={"user": user, "request": request},
        )
        return Response(out.data, status=status.HTTP_200_OK)

class PasswordResetRequestAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = (serializer.validated_data.get("email") or "").strip()

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        reset_url = None

        debug_email_error: str | None = None

        if user:
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = _build_password_reset_url(uidb64=uidb64, token=token)

            profile_lang = None
            if reset_url:
                try:
                    StudentProfile._meta.get_field("language")
                except FieldDoesNotExist:
                    profile_lang = None
                else:
                    profile_lang = (
                        StudentProfile.objects.filter(user=user).values_list("language", flat=True).first()
                    )
            subject, message = _compose_password_reset_email(reset_url=reset_url or "", language=profile_lang)

            try:
                send_mail(
                    subject,
                    message,
                    getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    [user.email],
                    fail_silently=False,
                )
            except Exception as exc:
                # Do not leak whether the account exists.
                logger.exception("Password reset email send failed")
                if getattr(settings, "DEBUG", False):
                    debug_email_error = str(exc)

        payload = {
            "detail": "If an account exists for this email, a reset link has been sent.",
        }
        if getattr(settings, "DEBUG", False):
            if reset_url:
                payload["debug_reset_url"] = reset_url
            if debug_email_error:
                payload["debug_email_error"] = debug_email_error
            payload["debug_email_backend"] = getattr(settings, "EMAIL_BACKEND", "")
            payload["debug_email_host"] = getattr(settings, "EMAIL_HOST", "")
            payload["debug_email_port"] = getattr(settings, "EMAIL_PORT", None)
            payload["debug_default_from_email"] = getattr(settings, "DEFAULT_FROM_EMAIL", "")

        return Response(payload, status=status.HTTP_200_OK)


class PasswordResetConfirmAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password has been reset."}, status=status.HTTP_200_OK)
