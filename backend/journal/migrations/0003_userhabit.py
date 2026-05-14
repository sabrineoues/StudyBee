from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('journal', '0002_journalentry_user'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='UserHabit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('hydration', models.IntegerField(default=3)),
                ('walk', models.BooleanField(default=False)),
                ('sleep_early', models.BooleanField(default=False)),
                ('sleep_quality', models.IntegerField(default=6)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='user_habit', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]