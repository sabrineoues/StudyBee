from django.conf import settings
from django.db import models


class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
    )
    first_name = models.CharField(max_length=30, default="Prénom")       # Prénom obligatoire
    last_name = models.CharField(max_length=30, default="Nom")           # Nom obligatoire
    email = models.EmailField(unique=True, default="email@example.com")  # Email obligatoire
    date_of_birth = models.DateField(null=False, default="2000-01-01")  # Date de naissance obligatoire
    class_level = models.CharField(max_length=64, default="1ère année")  # Niveau de classe obligatoire
    speciality = models.CharField(max_length=100, default="")  # Specialty
    parent_email = models.EmailField(default="parent@example.com")       # Email parent obligatoire
    parent_phone = models.CharField(max_length=20, default="00000000")   # Numéro parent obligatoire

    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    language = models.CharField(max_length=2, default="en")

    camera_access_enabled = models.BooleanField(default=False)
    microphone_access_enabled = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class ParentProfile(models.Model):
    """Profil des parents pour le suivi des enfants"""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to="parent_avatars/", null=True, blank=True)
    language = models.CharField(
        max_length=2,
        default="en",
        choices=[("en", "English"), ("fr", "Français")],
    )

    children = models.ManyToManyField(
        "users.StudentProfile",
        related_name="parents",
        blank=True,
    )

    notification_email = models.BooleanField(default=True)
    notification_push = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

    class Meta:
        verbose_name = "Parent Profile"
        verbose_name_plural = "Parent Profiles"
