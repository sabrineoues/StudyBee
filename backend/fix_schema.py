import os
import django
import sys
from django.db import connection

# Add current directory to path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
try:
    django.setup()
except Exception as e:
    print(f"Django setup failed: {e}")
    sys.exit(1)

def run_fix():
    with connection.cursor() as cursor:
        print("Creating bio_sensors_biosensorreading table if it doesn't exist...")
        # PostgreSQL syntax
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bio_sensors_biosensorreading (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                bpm DOUBLE PRECISION NOT NULL,
                spo2 DOUBLE PRECISION NOT NULL,
                session_id INTEGER NOT NULL REFERENCES studysessions_studysession (id) ON DELETE CASCADE
            );
        ''')
        
        print("Checking for columns in studysessions_studysession...")
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='studysessions_studysession' AND column_name IN ('baseline_bpm', 'baseline_spo2');
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        if 'baseline_bpm' not in existing_columns:
            print("Adding column baseline_bpm to studysessions_studysession...")
            cursor.execute("ALTER TABLE studysessions_studysession ADD COLUMN baseline_bpm DOUBLE PRECISION;")
        else:
            print("Column baseline_bpm already exists.")
            
        if 'baseline_spo2' not in existing_columns:
            print("Adding column baseline_spo2 to studysessions_studysession...")
            cursor.execute("ALTER TABLE studysessions_studysession ADD COLUMN baseline_spo2 DOUBLE PRECISION;")
        else:
            print("Column baseline_spo2 already exists.")

if __name__ == '__main__':
    try:
        run_fix()
        print("Schema fix applied successfully.")
    except Exception as e:
        print(f"Error applying schema fix: {e}")
