"""
Django management command to start the Arduino bio-sensor serial reader.
Usage: python manage.py start_bio_sensor_reader
"""
from django.core.management.base import BaseCommand
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Start the background Arduino bio-sensor serial reader"

    def add_arguments(self, parser):
        parser.add_argument(
            '--port',
            type=str,
            default='COM4',
            help='Serial port where Arduino is connected (default: COM4)',
        )
        parser.add_argument(
            '--baudrate',
            type=int,
            default=115200,
            help='Serial baud rate (default: 115200)',
        )

    def handle(self, *args, **options):
        port = options['port']
        baudrate = options['baudrate']

        self.stdout.write(f"Starting Arduino bio-sensor reader on {port} @ {baudrate}...")

        try:
            from biosensors.services import start_background_reader, connect_arduino
            
            # Connect to Arduino
            if not connect_arduino(port, baudrate):
                self.stdout.write(self.style.WARNING(f"⚠ Could not connect to {port}"))
                return
            
            self.stdout.write(self.style.SUCCESS(f"✓ Connected to Arduino on {port}"))
            
            # Start background reader with existing connection
            if start_background_reader():
                self.stdout.write(self.style.SUCCESS("✓ Background serial reader started"))
                self.stdout.write("Listening for BPM and SpO2 data from MAX30102 sensor...")
                self.stdout.write("Press Ctrl+C to stop")
                
                # Keep the command running
                try:
                    import time
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    self.stdout.write(self.style.SUCCESS("\n✓ Shutting down bio-sensor reader"))
            else:
                self.stdout.write(self.style.ERROR("✗ Failed to start background reader"))
                
        except ImportError as e:
            self.stdout.write(self.style.ERROR(f"✗ Import error: {e}"))
            self.stdout.write("Make sure pyserial is installed: pip install pyserial")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Error: {e}"))
            logger.exception("Error starting bio-sensor reader")
