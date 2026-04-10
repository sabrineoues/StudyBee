from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("studysessions", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="studysession",
            name="pinned",
            field=models.BooleanField(default=False),
        ),
    ]
