# Arduino BioSensor + Pomodoro AI Integration - Quick Start

## Overview
This integration combines three systems:
1. **Arduino MAX30102 Sensor** → Real-time BPM & SpO2 via USB
2. **Django Backend** → REST API to expose sensor data
3. **React Frontend** → Live preview in session creation modal

## Quick Setup (5 minutes)

### 1. Hardware (Arduino)
```bash
# In Arduino IDE:
# 1. Upload the MAX30102 firmware to your Arduino
# 2. Connect via USB (should appear as COM4 on Windows)
# 3. Open Serial Monitor to verify output
```

### 2. Backend (Django)
```bash
cd backend

# Install pyserial
pip install pyserial==3.5

# Start the serial reader in a terminal
python manage.py start_bio_sensor_reader --port COM4

# In another terminal, start Django
python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend (React)
```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

## Testing the Integration

1. **Open StudyBee Frontend**
   - Go to http://localhost:5173
   - Sign in

2. **Create a Study Session**
   - Click "Create Session"
   - Modal should show:
     - Pomodoro AI preview (from journal emotion)
     - Arduino Bio Sensors (live BPM & SpO2)

3. **Place Finger on Sensor**
   - Put your finger on the MAX30102 sensor
   - Wait 3-5 seconds for readings
   - You should see real-time BPM and SpO2 values update every second

4. **Create Session**
   - Values like BPM and SpO2 will be saved as baseline vitals
   - Session includes: emotion data + AI recommendation + baseline bio metrics

## API Endpoints

### Get Current Reading
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/bio-sensors/current/

# Response:
{
  "bpm": 75,
  "spo2": 98.5,
  "is_valid": true,
  "timestamp": "2025-05-12T10:30:45.123Z"
}
```

### Get History
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/bio-sensors/history/
```

### Save Current Reading
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/bio-sensors/save/
```

## Architecture

### Backend Flow
```
Arduino (Serial)
    ↓ (COM4 @ 115200 baud)
Background Serial Reader Thread
    ↓ (parse "Frequence cardiaque: X bpm" / "SpO2: Y%")
Global BPM/SpO2 buffer
    ↓ (every 1 second)
API: /api/bio-sensors/current/
    ↓ (JSON response)
Frontend Poll
```

### Frontend Flow
```
Session Creation Modal Opens
    ↓
1. Load latest journal emotion
    ↓ (derive scores)
2. Call Pomodoro AI service
    ↓ (get recommendation)
3. Start bio-sensor polling
    ↓ (every 1 second via /api/bio-sensors/current/)
Display preview with all data
    ↓
User creates session
    ↓ (includes baseline_bpm, baseline_spo2)
Save to database
```

## Database Schema

### BioSensorReading Table
```sql
CREATE TABLE biosensors_biosensorreading (
  id SERIAL PRIMARY KEY,
  bpm INTEGER,
  spo2 FLOAT,
  timestamp TIMESTAMP DEFAULT NOW(),
  is_valid BOOLEAN DEFAULT FALSE
);
```

### StudySession Extended
```sql
ALTER TABLE studysessions_studysession ADD COLUMN baseline_bpm INTEGER;
ALTER TABLE studysessions_studysession ADD COLUMN baseline_spo2 FLOAT;
```

## Troubleshooting

### "Connection refused" on bio-sensors API
- Ensure background reader is running: `python manage.py start_bio_sensor_reader --port COM4`
- Check that Arduino is connected and showing data in Serial Monitor

### No BPM/SpO2 in modal
- Verify Arduino Serial Monitor shows readings (place finger on sensor)
- Check browser console for errors (F12 → Console)
- Verify JWT token is valid

### Arduino firmware upload fails
- Ensure MAX30105 library is installed in Arduino IDE
- Check board selection: Tools → Board → Arduino Uno
- Check port selection: Tools → Port → COM4
- Try different USB cable or port

### Database errors
- All schema has been pre-created and verified
- Django ORM changes are handled via the app's models.py
- No manual SQL execution needed

## Files Modified/Created

### Backend
- `biosensors/` - New Django app
- `biosensors/services.py` - Serial reader implementation
- `biosensors/views.py` - API endpoints
- `biosensors/models.py` - BioSensorReading model
- `biosensors/management/commands/start_bio_sensor_reader.py` - Management command
- `studysessions/models.py` - Added baseline_bpm, baseline_spo2 fields
- `studysessions/serializers.py` - Updated to include bio fields

### Frontend
- `services/bioSensorsService.ts` - Bio-sensor API client
- `pages/StudyPage.tsx` - Integrated polling and display
- `services/studysessionsService.ts` - Updated types

## Next Steps

### Optional: Use BPM/SpO2 in Pomodoro Model
Currently BPM/SpO2 are displayed and stored. To use them as model inputs:

1. Modify `pomodoroAIService.ts`:
```typescript
export async function predictPomodoroFocus(payload: PomodoroAIRequest & { bpm?: number; spo2?: number }) {
  // Include bpm and spo2 in request
}
```

2. Update `fusion.py` to use real BPM instead of calculated values
3. Retrain Pomodoro model if necessary

### Optional: Export Bio Data
Add endpoint to export session readings for analysis:
```python
# views.py
@api_view(['GET'])
def export_session_vitals(request, session_id):
    """Export BPM/SpO2 history for a session"""
    # Implementation
```

## Performance

- Serial reading: 10ms updates (background thread)
- API polling: 1-second intervals (configurable)
- Database writes: Only on session creation
- Memory usage: ~5MB for background thread + buffer

## Security Notes

- Serial port access requires local system access
- API endpoints are JWT protected
- Bio data is optional and doesn't break existing features
- No external cloud storage of sensitive vitals

## Support

For detailed setup instructions, see: `ARDUINO_BIOSENSOR_SETUP.md`
