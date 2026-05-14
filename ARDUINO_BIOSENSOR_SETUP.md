# Arduino BioSensor Integration Guide

This guide explains how to set up and use the MAX30102 pulse oximeter sensor with StudyBee for real-time BPM and SpO2 monitoring.

## Hardware Setup

### Components Needed
- **Arduino Board** (tested with Arduino Uno)
- **MAX30102 Pulse Oximeter Module** (with IR and Red LEDs)
- **USB Cable** for Arduino connection
- Breadboard and jumper wires

### Wiring Diagram
```
MAX30102        Arduino
-------         -------
VCC      →      5V
GND      →      GND
SDA      →      A4 (SDA)
SCL      →      A5 (SCL)
IRQ      →      (optional, not used)
```

### Arduino Setup Steps

1. **Install Arduino IDE**
   - Download from: https://www.arduino.cc/en/software
   - Install on your development machine

2. **Install MAX30105 Library**
   - In Arduino IDE: Sketch → Include Library → Manage Libraries
   - Search for "MAX30105" by SparkFun
   - Install version 2.1.8 or later
   - Also install "SparkFun ISL29125 Sensor Library" if prompted

3. **Upload Firmware**
   - Copy the Arduino sketch from `arduino/max30102_firmware.ino`
   - Open in Arduino IDE
   - Select board: Tools → Board → Arduino Uno
   - Select COM port: Tools → Port → COM4 (or your port)
   - Click Upload

4. **Verify Serial Output**
   - Open Arduino IDE Serial Monitor (Tools → Serial Monitor)
   - Set baud rate to 115200
   - You should see output like:
     ```
     Demarrage MAX30102...
     Capteur OK!
     Posez le doigt et restez immobile 20 secondes...
     ================================
       Frequence cardiaque : 75 bpm
       SpO2               : 98.5 %
     ================================
     ```

## Backend Setup (Django)

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
pip install pyserial==3.5
```

### 2. Create Django Migration (if needed)
```bash
python manage.py makemigrations biosensors
python manage.py migrate
```

### 3. Start the Serial Reader
```bash
# Option A: Run as management command
python manage.py start_bio_sensor_reader --port COM4 --baudrate 115200

# Option B: Run with custom port
python manage.py start_bio_sensor_reader --port /dev/ttyUSB0  # Linux/Mac
```

### 4. Verify Connection
- Check that the command shows: `✓ Connected to Arduino on COM4`
- The command should display: `Listening for BPM and SpO2 data from MAX30102 sensor...`
- Readings will be logged whenever the serial reader gets valid data

## Frontend Integration

### 1. Feature Overview
When users open the session creation modal, they will see:
- **Pomodoro AI Preview**: Emotion-based study duration recommendation
- **Arduino Bio Sensors**: Real-time BPM and SpO2 from the MAX30102
- Both readings update every 1 second while the modal is open

### 2. Session Creation Flow
1. User clicks "Create Session"
2. Modal opens and shows:
   - Journal emotion (from latest entry)
   - Pomodoro AI recommendation
   - Live BPM and SpO2 readings from Arduino
3. User is required to see "valid" readings before creating session
4. When session is created, baseline BPM and SpO2 are saved

### 3. API Endpoints
- `GET /api/bio-sensors/current/`: Get latest BPM/SpO2 reading
- `GET /api/bio-sensors/history/`: Get recent readings (last 100)
- `POST /api/bio-sensors/save/`: Save current reading to database

## Running the Full System

### Terminal 1: Arduino Serial Reader
```bash
cd backend
python manage.py start_bio_sensor_reader --port COM4
```

### Terminal 2: Django Backend
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

### Terminal 3: Frontend Development
```bash
cd frontend
npm run dev
```

### Terminal 4 (Optional): Pomodoro AI Service
```bash
cd ai_services/pomodoro_ai
python app.py
```

## Troubleshooting

### "Serial port not found" / "Could not connect to Arduino"
- **Solution**: Check Device Manager (Windows) or `ls /dev/tty*` (Linux)
- Verify COM port matches in the code
- Ensure Arduino board is properly connected
- Try different USB cable or USB port

### "Sensor not detected"
- Check wiring (SDA/SCL connections)
- Verify Arduino library is installed correctly
- Ensure fingerprint is placed firmly on sensor
- Wait 20 seconds as per Arduino output message

### "No valid reading" in frontend
- Place finger on sensor and keep it still
- Wait 3-5 seconds for initial calibration
- Remove and reposition if signal drops

### "pyserial not installed"
```bash
pip install pyserial==3.5
```

### Background reader starts but gets no data
- Verify Arduino is outputting data to serial (use Serial Monitor in IDE)
- Check baud rate matches: 115200
- Ensure Arduino code was uploaded successfully

## Data Persistence

All readings are stored in the `BioSensorReading` model:
- Accessed via Django admin at: `http://localhost:8000/admin/biosensors/biosensorreading/`
- Each study session stores baseline readings in:
  - `baseline_bpm` (beats per minute)
  - `baseline_spo2` (blood oxygen percentage)

## Integration with Pomodoro AI (Optional)

Currently, BPM and SpO2 are:
1. Displayed in the session creation preview
2. Stored with each session as baseline vitals
3. Available via API for future analysis

To use BPM/SpO2 as inputs to the Pomodoro model:
1. Modify `pomodoroAIService.ts` to include bio data in request
2. Update `fusion.py` to use real BPM instead of calculated values
3. Retrain or reconfigure the Pomodoro AI model

## Port Configuration

### Windows
- Typical ports: COM1, COM2, COM3, COM4, COM5, etc.
- Check Device Manager → Ports (COM & LPT)

### Linux
- Typical ports: /dev/ttyUSB0, /dev/ttyUSB1, /dev/ttyACM0

### macOS
- Typical ports: /dev/cu.usbserial-XXXXX, /dev/cu.wchusbserial-XXXXX

## Performance Notes

- Serial reading runs in background thread (non-blocking)
- Updates occur every 10ms internally, exposed via 1-second polling
- Database writes are minimal (only on session creation)
- Maximum 100 readings stored in history

## Support

For issues or questions:
1. Check Arduino Serial Monitor for raw sensor output
2. Verify Django logs for any errors
3. Test bio-sensors API manually: `curl http://localhost:8000/api/bio-sensors/current/`
4. Ensure all dependencies are installed: `pip list | grep -i serial`
