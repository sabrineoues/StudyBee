import axios from 'axios';

export interface BioSensorReading {
  bpm: number | null;
  spo2: number | null;
  is_valid: boolean;
  timestamp: string | null;
}

/**
 * Get the latest BPM and SpO2 reading from Arduino sensor.
 * Returns the current buffer reading from the background serial reader.
 */
export async function getCurrentBioReading(): Promise<BioSensorReading> {
  try {
    const response = await axios.get<BioSensorReading>('/api/bio-sensors/current/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch current bio reading:', error);
    return { bpm: null, spo2: null, is_valid: false, timestamp: null };
  }
}

/**
 * Get recent BPM and SpO2 readings history (last 100 readings).
 */
export async function getBioReadingHistory(): Promise<BioSensorReading[]> {
  try {
    const response = await axios.get<BioSensorReading[]>('/api/bio-sensors/history/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch bio reading history:', error);
    return [];
  }
}

/**
 * Save the current buffer reading to the database.
 * Called when user creates a study session to record baseline vitals.
 */
export async function saveCurrentBioReading(): Promise<BioSensorReading | null> {
  try {
    const response = await axios.post<BioSensorReading>('/api/bio-sensors/save/');
    return response.data;
  } catch (error) {
    console.error('Failed to save bio reading:', error);
    return null;
  }
}

export function startBioSensorPolling(
  onUpdate: (reading: BioSensorReading) => void,
  intervalMs: number = 1000
): number {
  const intervalId = setInterval(async () => {
    const reading = await getCurrentBioReading();
    onUpdate(reading);
  }, intervalMs);

  return intervalId;
}
