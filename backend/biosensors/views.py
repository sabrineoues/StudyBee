from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import BioSensorReading
from .serializers import BioSensorReadingSerializer
from .services import get_latest_reading


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_reading(request):
    """
    Get the latest BPM and SpO2 reading from the Arduino sensor.
    Returns the most recent database reading + live buffer reading.
    """
    try:
        # Get latest reading from background reader buffer
        bpm, spo2 = get_latest_reading()
        
        # Try to get most recent DB reading
        latest_db_reading = BioSensorReading.objects.first()

        if (bpm is None or spo2 is None) and latest_db_reading:
            if bpm is None:
                bpm = latest_db_reading.bpm
            if spo2 is None:
                spo2 = latest_db_reading.spo2
        
        response_data = {
            "bpm": bpm,
            "spo2": spo2,
            "is_valid": bpm is not None and spo2 is not None,
            "timestamp": None
        }
        
        if latest_db_reading:
            response_data["timestamp"] = latest_db_reading.timestamp
            response_data["is_valid"] = latest_db_reading.is_valid if bpm is None or spo2 is None else response_data["is_valid"]
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {"error": f"Failed to retrieve sensor data: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reading_history(request):
    """
    Get recent BPM and SpO2 readings history (last 100 readings).
    """
    try:
        readings = BioSensorReading.objects.all()[:100]
        serializer = BioSensorReadingSerializer(readings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {"error": f"Failed to retrieve history: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_current_reading(request):
    """
    Manually save the current buffer reading to the database.
    Called by frontend when user creates a study session.
    """
    try:
        bpm, spo2 = get_latest_reading()
        
        reading = BioSensorReading.objects.create(
            bpm=bpm,
            spo2=spo2,
            is_valid=bpm is not None and spo2 is not None
        )
        
        serializer = BioSensorReadingSerializer(reading)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {"error": f"Failed to save reading: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
