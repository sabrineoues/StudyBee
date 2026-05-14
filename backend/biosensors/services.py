"""
Arduino Serial Reader Service
Reads BPM and SpO2 data from MAX30102 sensor connected via Arduino on COM4.
"""
import re
import threading
import time
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Global state
_serial_connection = None
_last_reading: Optional[Tuple[Optional[int], Optional[float]]] = (None, None)
_lock = threading.Lock()


def connect_arduino(port: str = 'COM4', baudrate: int = 115200) -> bool:
    """
    Establish connection to Arduino serial port.
    Returns True if successful, False otherwise.
    """
    global _serial_connection
    
    try:
        import serial
    except ImportError:
        logger.error("pyserial not installed. Install it: pip install pyserial")
        return False
    
    try:
        _serial_connection = serial.Serial(port, baudrate, timeout=2)
        logger.info(f"Connected to Arduino on {port} at {baudrate} baud")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to Arduino: {e}")
        _serial_connection = None
        return False


def disconnect_arduino():
    """Close serial connection."""
    global _serial_connection
    if _serial_connection and _serial_connection.is_open:
        _serial_connection.close()
        logger.info("Disconnected from Arduino")
    _serial_connection = None


def parse_sensor_output(line: str) -> Tuple[Optional[int], Optional[float]]:
    """
    Parse BPM and SpO2 from Arduino serial output.
    Expects formats:
    - "Frequence cardiaque : X bpm"
    - "SpO2 : Y %"
    
    Returns tuple (bpm, spo2) with None for missing values.
    """
    bpm = None
    spo2 = None
    
    # Parse BPM
    bpm_match = re.search(r'Frequence cardiaque\s*:\s*(\d+)\s*bpm', line, re.IGNORECASE)
    if bpm_match:
        bpm = int(bpm_match.group(1))
    
    # Parse SpO2
    spo2_match = re.search(r'SpO2\s*:\s*([\d.]+)\s*%', line, re.IGNORECASE)
    if spo2_match:
        spo2 = float(spo2_match.group(1))
    
    return bpm, spo2


def read_sensor_data():
    """
    Continuously read from Arduino serial port and update global state.
    Call this in a background thread.
    """
    global _serial_connection, _last_reading
    
    if not _serial_connection or not _serial_connection.is_open:
        logger.warning("Serial connection not established")
        return
    
    buffer = ""
    
    while _serial_connection and _serial_connection.is_open:
        try:
            if _serial_connection.in_waiting > 0:
                byte_read = _serial_connection.read()
                char = byte_read.decode('utf-8', errors='ignore')
                buffer += char
                
                # Process complete lines
                if char == '\n':
                    line = buffer.strip()
                    buffer = ""
                    
                    if line:
                        bpm, spo2 = parse_sensor_output(line)
                        
                        # Update global state if we got valid data
                        if bpm is not None or spo2 is not None:
                            with _lock:
                                _last_reading = (bpm, spo2)
                            logger.debug(f"Updated reading: BPM={bpm}, SpO2={spo2}%")
            
            time.sleep(0.01)  # Small sleep to prevent CPU spinning
            
        except Exception as e:
            logger.error(f"Error reading from serial: {e}")
            disconnect_arduino()
            break


def get_latest_reading() -> Tuple[Optional[int], Optional[float]]:
    """
    Get the latest BPM and SpO2 reading from the buffer.
    Returns tuple (bpm, spo2).
    """
    global _last_reading
    with _lock:
        return _last_reading


def start_background_reader():
    """
    Start a background thread that continuously reads from Arduino.
    Safe to call multiple times. Reuses existing connection if available.
    """
    global _serial_connection
    
    # Check if connection already exists and is open
    if _serial_connection and _serial_connection.is_open:
        logger.info("Reusing existing Arduino connection")
        thread = threading.Thread(target=read_sensor_data, daemon=True)
        thread.start()
        logger.info("Background Arduino reader started")
        return True
    
    # No connection exists, try to create one
    if connect_arduino():
        thread = threading.Thread(target=read_sensor_data, daemon=True)
        thread.start()
        logger.info("Background Arduino reader started")
        return True
    
    return False
