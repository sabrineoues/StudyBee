from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='BioSensorReading',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bpm', models.PositiveIntegerField(blank=True, null=True)),
                ('spo2', models.FloatField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now=True)),
                ('is_valid', models.BooleanField(default=False)),
            ],
            options={
                'verbose_name_plural': 'Bio Sensor Readings',
                'ordering': ['-timestamp'],
            },
        ),
    ]
