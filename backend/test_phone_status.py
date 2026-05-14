import os
import django
import sys

# Add project root to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

try:
    from vision.services.phone_detector import get_phone_monitor_status
    status = get_phone_monitor_status()
    print(f"Status: {status}")
except Exception as e:
    print(f"Error: {e}")
