import re
from datetime import date
from secrets import token_hex

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.utils.text import slugify
from rest_framework import serializers

from .models import StudentProfile


class StudentSignUpSerializer(serializers.ModelSerializer):
    NAME_REGEX = re.compile(r"^[A-Za-zÀ-ÿ\s'-]+$")
    PHONE_REGEX = re.compile(r"^\+216\d{8}$")

    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    # Make username optional and disable the automatic UniqueValidator.
    # We will auto-generate / auto-uniquify it in create().
    username = serializers.CharField(write_only=True, required=False, allow_blank=True, validators=[])

    email = serializers.EmailField()

    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    date_of_birth = serializers.DateField(write_only=True)
    study_level = serializers.CharField(write_only=True, required=False, allow_blank=True)
    class_level = serializers.CharField(write_only=True)
    speciality = serializers.CharField(write_only=True)
    parent_email = serializers.EmailField(write_only=True)
    parent_phone = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "date_of_birth",
            "study_level",
            "class_level",
            "speciality",
            "parent_email",
            "parent_phone",
        ]
        extra_kwargs = {
            "username": {"validators": []},
        }

    def validate(self, data):
        if data.get("password") != data.get("password_confirm"):
            raise serializers.ValidationError("Passwords do not match")

        first_name = (data.get("first_name") or "").strip()
        last_name = (data.get("last_name") or "").strip()
        if not first_name or not self.NAME_REGEX.match(first_name):
            raise serializers.ValidationError({"first_name": "First name must contain only letters"})
        if not last_name or not self.NAME_REGEX.match(last_name):
            raise serializers.ValidationError({"last_name": "Last name must contain only letters"})

        phone = (data.get("parent_phone") or "").strip()
        if not self.PHONE_REGEX.match(phone):
            raise serializers.ValidationError({"parent_phone": "Phone must match +216XXXXXXXX"})

        dob = data.get("date_of_birth")
        if not isinstance(dob, date):
            raise serializers.ValidationError({"date_of_birth": "Invalid date"})

        levels_secondary_legacy = {"Baccalaureate", "1ere annee", "2eme annee", "3eme annee", "4eme annee"}
        levels_secondary = {"1st year", "2nd year", "3rd year", "4th year"}
        levels_university = {
            "1st year university",
            "2nd year university",
            "3rd year university",
            "4th year university",
            "5th year university",
            "1st master",
            "2nd master",
        }

        study_level = (data.get("study_level") or "").strip().lower() or None
        if study_level is not None and study_level not in {"secondary", "university"}:
            raise serializers.ValidationError({"study_level": "Study level must be secondary or university"})

        if study_level == "secondary":
            allowed_levels = levels_secondary | levels_secondary_legacy
        elif study_level == "university":
            allowed_levels = levels_university
        else:
            allowed_levels = levels_secondary | levels_secondary_legacy | levels_university

        class_level = data.get("class_level")
        if class_level not in allowed_levels:
            raise serializers.ValidationError({"class_level": "Invalid class level"})

        if User.objects.filter(email=data.get("email")).exists():
            raise serializers.ValidationError({"email": "This email is already used"})

        if StudentProfile.objects.filter(email=data.get("email")).exists():
            raise serializers.ValidationError({"email": "This email is already used"})

        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.pop("password_confirm")
        validated_data.pop("study_level", None)

        profile_first_name = validated_data.pop("first_name")
        profile_last_name = validated_data.pop("last_name")
        profile_date_of_birth = validated_data.pop("date_of_birth")
        profile_class_level = validated_data.pop("class_level")
        profile_speciality = validated_data.pop("speciality")
        profile_parent_email = validated_data.pop("parent_email")
        profile_parent_phone = validated_data.pop("parent_phone")

        requested_username = (validated_data.get("username") or "").strip()
        base_username = slugify(requested_username) if requested_username else ""
        if not base_username:
            base_username = slugify(f"{profile_first_name} {profile_last_name}") or "user"

        # Django's default User.username max_length is 150
        base_username = base_username[:140]

        candidate = base_username
        for _ in range(30):
            if not User.objects.filter(username=candidate).exists():
                break
            candidate = f"{base_username}-{token_hex(2)}"

        validated_data["username"] = candidate

        user = User(**validated_data)
        user.first_name = profile_first_name
        user.last_name = profile_last_name
        user.set_password(password)
        user.save()

        StudentProfile.objects.create(
            user=user,
            first_name=profile_first_name,
            last_name=profile_last_name,
            email=user.email,
            date_of_birth=profile_date_of_birth,
            class_level=profile_class_level,
            speciality=profile_speciality,
            parent_email=profile_parent_email,
            parent_phone=profile_parent_phone,
        )

        return user


class AdminUserSerializer(serializers.ModelSerializer):
    date_of_birth = serializers.SerializerMethodField()
    class_level = serializers.SerializerMethodField()
    speciality = serializers.SerializerMethodField()
    parent_email = serializers.SerializerMethodField()
    parent_phone = serializers.SerializerMethodField()

    def _get_profile(self, obj: User):
        try:
            return obj.studentprofile
        except StudentProfile.DoesNotExist:
            return None

    def get_date_of_birth(self, obj: User):
        profile = self._get_profile(obj)
        return profile.date_of_birth if profile else None

    def get_class_level(self, obj: User):
        profile = self._get_profile(obj)
        return profile.class_level if profile else None

    def get_speciality(self, obj: User):
        profile = self._get_profile(obj)
        return profile.speciality if profile else None

    def get_parent_email(self, obj: User):
        profile = self._get_profile(obj)
        return profile.parent_email if profile else None

    def get_parent_phone(self, obj: User):
        profile = self._get_profile(obj)
        return profile.parent_phone if profile else None

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_of_birth",
            "class_level",
            "speciality",
            "parent_email",
            "parent_phone",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]


class AdminUserCreateSerializer(serializers.ModelSerializer):
    PHONE_REGEX = re.compile(r"^\+216\d{8}$")

    password = serializers.CharField(write_only=True, required=True, min_length=6)
    date_of_birth = serializers.DateField(write_only=True)
    class_level = serializers.CharField(write_only=True)
    speciality = serializers.CharField(write_only=True, required=False, allow_blank=True)
    parent_email = serializers.EmailField(write_only=True)
    parent_phone = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "date_of_birth",
            "class_level",
            "speciality",
            "parent_email",
            "parent_phone",
            "is_active",
            "is_staff",
            "is_superuser",
        ]

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        if value and StudentProfile.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_parent_phone(self, value):
        phone = (value or "").strip()
        if not self.PHONE_REGEX.match(phone):
            raise serializers.ValidationError("Phone must match +216XXXXXXXX")
        return phone

    def create(self, validated_data):
        password = validated_data.pop("password")
        profile_date_of_birth = validated_data.pop("date_of_birth")
        profile_class_level = validated_data.pop("class_level")
        profile_speciality = validated_data.pop("speciality", "")
        profile_parent_email = validated_data.pop("parent_email")
        profile_parent_phone = validated_data.pop("parent_phone")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        StudentProfile.objects.create(
            user=user,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            date_of_birth=profile_date_of_birth,
            class_level=profile_class_level,
            speciality=profile_speciality,
            parent_email=profile_parent_email,
            parent_phone=profile_parent_phone,
        )
        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    PHONE_REGEX = re.compile(r"^\+216\d{8}$")

    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)
    date_of_birth = serializers.DateField(write_only=True, required=False)
    class_level = serializers.CharField(write_only=True, required=False)
    speciality = serializers.CharField(write_only=True, required=False, allow_blank=True)
    parent_email = serializers.EmailField(write_only=True, required=False)
    parent_phone = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "date_of_birth",
            "class_level",
            "speciality",
            "parent_email",
            "parent_phone",
            "is_active",
            "is_staff",
            "is_superuser",
        ]

    def validate_email(self, value):
        if not value:
            return value
        qs = User.objects.filter(email__iexact=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")

        qs_profile = StudentProfile.objects.filter(email__iexact=value)
        if self.instance is not None:
            qs_profile = qs_profile.exclude(user_id=self.instance.pk)
        if qs_profile.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_parent_phone(self, value):
        if value is None:
            return value
        phone = (value or "").strip()
        if not self.PHONE_REGEX.match(phone):
            raise serializers.ValidationError("Phone must match +216XXXXXXXX")
        return phone

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        profile_date_of_birth = validated_data.pop("date_of_birth", None)
        profile_class_level = validated_data.pop("class_level", None)
        profile_speciality = validated_data.pop("speciality", None)
        profile_parent_email = validated_data.pop("parent_email", None)
        profile_parent_phone = validated_data.pop("parent_phone", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.set_password(password)

        instance.save()

        profile_updates = {
            "date_of_birth": profile_date_of_birth,
            "class_level": profile_class_level,
            "speciality": profile_speciality,
            "parent_email": profile_parent_email,
            "parent_phone": profile_parent_phone,
        }
        if any(v is not None for v in profile_updates.values()):
            profile, created = StudentProfile.objects.get_or_create(
                user=instance,
                defaults={
                    "first_name": instance.first_name or "Prénom",
                    "last_name": instance.last_name or "Nom",
                    "email": instance.email or "email@example.com",
                },
            )

            if "email" in validated_data:
                profile.email = instance.email
            if "first_name" in validated_data:
                profile.first_name = instance.first_name
            if "last_name" in validated_data:
                profile.last_name = instance.last_name

            if profile_date_of_birth is not None:
                profile.date_of_birth = profile_date_of_birth
            if profile_class_level is not None:
                profile.class_level = profile_class_level
            if profile_speciality is not None:
                profile.speciality = profile_speciality
            if profile_parent_email is not None:
                profile.parent_email = profile_parent_email
            if profile_parent_phone is not None:
                profile.parent_phone = profile_parent_phone

            profile.save()

        return instance


class StudentProfileMeSerializer(serializers.Serializer):
    PHONE_REGEX = re.compile(r"^\+216\d{8}$")

    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    date_of_birth = serializers.DateField(required=False)
    class_level = serializers.CharField(required=False, allow_blank=True)
    speciality = serializers.CharField(required=False, allow_blank=True)
    parent_email = serializers.EmailField(required=False, allow_blank=True)
    parent_phone = serializers.CharField(required=False, allow_blank=True)

    def to_representation(self, instance):
        user: User = instance["user"]
        profile: StudentProfile | None = instance.get("profile")
        return {
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "date_of_birth": profile.date_of_birth if profile else None,
            "class_level": profile.class_level if profile else "",
            "speciality": profile.speciality if profile else "",
            "parent_email": profile.parent_email if profile else "",
            "parent_phone": profile.parent_phone if profile else "",
        }

    def validate_email(self, value):
        user: User = self.context["user"]
        if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This email is already used")
        if StudentProfile.objects.filter(email__iexact=value).exclude(user_id=user.pk).exists():
            raise serializers.ValidationError("This email is already used")
        return value

    def validate_parent_phone(self, value):
        phone = (value or "").strip()
        if phone and not self.PHONE_REGEX.match(phone):
            raise serializers.ValidationError("Phone must match +216XXXXXXXX")
        return phone


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs.get("new_password") != attrs.get("new_password_confirm"):
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match"})

        try:
            uid = force_str(urlsafe_base64_decode(attrs.get("uidb64") or ""))
            user = User.objects.get(pk=uid)
        except Exception:
            raise serializers.ValidationError({"uidb64": "Invalid link"})

        token = attrs.get("token") or ""
        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError({"token": "Invalid or expired token"})

        validate_password(attrs.get("new_password") or "", user=user)

        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user: User = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
