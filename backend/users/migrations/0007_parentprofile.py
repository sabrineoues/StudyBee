from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("users", "0006_studentprofile_device_access"),
    ]

    operations = [
        migrations.CreateModel(
            name="ParentProfile",
            fields=[
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        serialize=False,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("phone", models.CharField(blank=True, max_length=20, null=True)),
                (
                    "avatar",
                    models.ImageField(blank=True, null=True, upload_to="parent_avatars/"),
                ),
                (
                    "language",
                    models.CharField(
                        choices=[("en", "English"), ("fr", "Français")],
                        default="en",
                        max_length=2,
                    ),
                ),
                ("notification_email", models.BooleanField(default=True)),
                ("notification_push", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "children",
                    models.ManyToManyField(
                        blank=True,
                        related_name="parents",
                        to="users.studentprofile",
                    ),
                ),
            ],
            options={
                "verbose_name": "Parent Profile",
                "verbose_name_plural": "Parent Profiles",
            },
        ),
    ]