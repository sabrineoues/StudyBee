from django.contrib import admin
from .models import BioSensorReading


@admin.register(BioSensorReading)
class BioSensorReadingAdmin(admin.ModelAdmin):
    list_display = ['bpm', 'spo2', 'is_valid', 'timestamp']
    list_filter = ['is_valid', 'timestamp']
    search_fields = ['bpm', 'spo2']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
