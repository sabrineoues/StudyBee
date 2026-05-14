from rest_framework import serializers
from .models import BioSensorReading


class BioSensorReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = BioSensorReading
        fields = ['bpm', 'spo2', 'timestamp', 'is_valid']
