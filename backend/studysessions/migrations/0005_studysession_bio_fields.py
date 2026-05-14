from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('studysessions', '0004_studysession_ai_fields'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE studysessions_studysession "
                        "ADD COLUMN IF NOT EXISTS baseline_bpm integer NULL;"
                    ),
                    reverse_sql=(
                        "ALTER TABLE studysessions_studysession "
                        "DROP COLUMN IF EXISTS baseline_bpm;"
                    ),
                ),
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE studysessions_studysession "
                        "ADD COLUMN IF NOT EXISTS baseline_spo2 double precision NULL;"
                    ),
                    reverse_sql=(
                        "ALTER TABLE studysessions_studysession "
                        "DROP COLUMN IF EXISTS baseline_spo2;"
                    ),
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='studysession',
                    name='baseline_bpm',
                    field=models.PositiveIntegerField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='studysession',
                    name='baseline_spo2',
                    field=models.FloatField(blank=True, null=True),
                ),
            ],
        ),
    ]
