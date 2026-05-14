from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('studysessions', '0003_studysessiontask'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE studysessions_studysession "
                        "ADD COLUMN IF NOT EXISTS ai_recommended_duration integer NULL;"
                    ),
                    reverse_sql=(
                        "ALTER TABLE studysessions_studysession "
                        "DROP COLUMN IF EXISTS ai_recommended_duration;"
                    ),
                ),
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE studysessions_studysession "
                        "ADD COLUMN IF NOT EXISTS detected_emotion varchar(50) NULL;"
                    ),
                    reverse_sql=(
                        "ALTER TABLE studysessions_studysession "
                        "DROP COLUMN IF EXISTS detected_emotion;"
                    ),
                ),
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE studysessions_studysession "
                        "ADD COLUMN IF NOT EXISTS normalized_emotion double precision NULL;"
                    ),
                    reverse_sql=(
                        "ALTER TABLE studysessions_studysession "
                        "DROP COLUMN IF EXISTS normalized_emotion;"
                    ),
                ),
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE studysessions_studysession "
                        "ADD COLUMN IF NOT EXISTS stress_level double precision NULL;"
                    ),
                    reverse_sql=(
                        "ALTER TABLE studysessions_studysession "
                        "DROP COLUMN IF EXISTS stress_level;"
                    ),
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='studysession',
                    name='ai_recommended_duration',
                    field=models.PositiveIntegerField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='studysession',
                    name='detected_emotion',
                    field=models.CharField(blank=True, max_length=50, null=True),
                ),
                migrations.AddField(
                    model_name='studysession',
                    name='normalized_emotion',
                    field=models.FloatField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='studysession',
                    name='stress_level',
                    field=models.FloatField(blank=True, null=True),
                ),
            ],
        ),
    ]