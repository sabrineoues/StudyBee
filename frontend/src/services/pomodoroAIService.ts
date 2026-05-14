import axios from "axios";

export type PomodoroAIRequest = {
	sleep_quality: number;
	stress_level: number;
	mood_score: number;
	hour_of_day: number;
	is_weekend: boolean;
};

export type PomodoroAIResponse = {
	prediction: string;
	recommended_minutes: number;
};

const POMODORO_AI_URL = "http://localhost:8010";

export async function predictPomodoroFocus(
	payload: PomodoroAIRequest,
): Promise<PomodoroAIResponse> {
	const response = await axios.post(`${POMODORO_AI_URL}/predict-focus`, payload);
	return response.data as PomodoroAIResponse;
}