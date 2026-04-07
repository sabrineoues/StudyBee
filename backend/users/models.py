# backend/students/models.py
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

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
