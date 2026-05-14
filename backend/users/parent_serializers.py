import re

from django.contrib.auth.models import User
from rest_framework import serializers


class ParentSignUpSerializer(serializers.ModelSerializer):
    NAME_REGEX = re.compile(r"^[A-Za-zÀ-ÿ\s'-]+$")

    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
        ]

    def validate(self, data):
        if data.get("password") != data.get("password_confirm"):
            raise serializers.ValidationError({"password": "Passwords do not match"})

        first_name = (data.get("first_name") or "").strip()
        last_name = (data.get("last_name") or "").strip()

        if not first_name or not self.NAME_REGEX.match(first_name):
            raise serializers.ValidationError({"first_name": "First name must contain only letters"})
        if not last_name or not self.NAME_REGEX.match(last_name):
            raise serializers.ValidationError({"last_name": "Last name must contain only letters"})

        password = data.get("password") or ""
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters"})

        if User.objects.filter(email__iexact=data.get("email")).exists():
            raise serializers.ValidationError({"email": "This email is already registered"})

        return data

    def create(self, validated_data):
        email = validated_data.get("email")
        first_name = validated_data.get("first_name")
        last_name = validated_data.get("last_name")
        password = validated_data.get("password")

        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
        )

        return user


class ParentSignInSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ParentProfileSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField(allow_blank=True)
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        if hasattr(obj, "avatar") and obj.avatar:
            return obj.avatar.url
        return None


class ParentTokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    parent = ParentProfileSerializer()
    success = serializers.BooleanField()