from django.db import models


class BioSensorReading(models.Model):
    """
    Stores real-time BPM and SpO2 readings from MAX30102 sensor via Arduino.
    This is a simple cache of the most recent readings.
    """
    bpm = models.PositiveIntegerField(null=True, blank=True)
    spo2 = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now=True)
    is_valid = models.BooleanField(default=False)  # True if sensor detected finger

    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "Bio Sensor Readings"

    def __str__(self):
        return f"BPM: {self.bpm}, SpO2: {self.spo2}% ({self.timestamp})"
