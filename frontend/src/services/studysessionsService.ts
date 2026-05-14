import axios from "axios";

import API_URL from "./api";

export type StudySessionStatus = "in_progress" | "completed";

export type StudySession = {
	id: number;
	title: string;
	study_duration: number;
	break_duration: number;
	subject: string;
	status: StudySessionStatus;
	pinned: boolean;
	focusScore: number;
	streakscore: number;
	detected_emotion?: string | null;
	normalized_emotion?: number | null;
	stress_level?: number | null;
	ai_recommended_duration?: number | null;
	baseline_bpm?: number | null;
	baseline_spo2?: number | null;
	date: string;
	created_at: string;
	updated_at: string;
};

export type StudySessionCreate = {
	title: string;
	study_duration: number;
	break_duration: number;
	subject: string;
	status: StudySessionStatus;
	pinned?: boolean;
	focusScore: number;
	streakscore: number;
	detected_emotion: string;
	normalized_emotion: number;
	stress_level: number;
	ai_recommended_duration: number;
	baseline_bpm?: number;
	baseline_spo2?: number;
};

export type StudySessionUpdate = Partial<StudySessionCreate>;

export type StudySessionStats = {
	total_sessions: number;
	completed_sessions: number;
	in_progress_sessions: number;
	total_study_minutes: number;
	total_study_hours: number;
};

export type AdminStudySession = StudySession & {
	user_id: number;
	username: string;
};

export type AdminStudySessionUpdate = Partial<
	Pick<
		AdminStudySession,
		"title" | "subject" | "status" | "study_duration" | "break_duration" | "focusScore" | "streakscore" |
		"detected_emotion" | "normalized_emotion" | "stress_level" | "ai_recommended_duration" | "baseline_bpm" | "baseline_spo2"
	>
>;

export type StudySessionTask = {
	id: number;
	session_id: number;
	title: string;
	done: boolean;
	created_at: string;
	updated_at: string;
};

export type StudySessionTaskCreate = {
	title: string;
	done?: boolean;
};

export type StudySessionTaskUpdate = Partial<StudySessionTaskCreate>;

function getBaseUrl() {
	return API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
}

export const studysessionsService = {
	listMine: async (): Promise<StudySession[]> => {
		const response = await axios.get(`${getBaseUrl()}sessions/`);
		return response.data as StudySession[];
	},

	getMyStats: async (): Promise<StudySessionStats> => {
		const response = await axios.get(`${getBaseUrl()}sessions/stats/`);
		return response.data as StudySessionStats;
	},

	listAllAdmin: async (): Promise<AdminStudySession[]> => {
		const response = await axios.get(`${getBaseUrl()}admin/sessions/`);
		return response.data as AdminStudySession[];
	},

	updateAdminSession: async (id: number, data: AdminStudySessionUpdate): Promise<AdminStudySession> => {
		const response = await axios.patch(`${getBaseUrl()}admin/sessions/${id}/`, data);
		return response.data as AdminStudySession;
	},

	deleteAdminSession: async (id: number): Promise<void> => {
		await axios.delete(`${getBaseUrl()}admin/sessions/${id}/`);
	},

	retrieve: async (id: number): Promise<StudySession> => {
		const response = await axios.get(`${getBaseUrl()}sessions/${id}/`);
		return response.data as StudySession;
	},

	create: async (data: StudySessionCreate): Promise<StudySession> => {
		const response = await axios.post(`${getBaseUrl()}sessions/`, data);
		return response.data as StudySession;
	},

	update: async (id: number, data: StudySessionUpdate): Promise<StudySession> => {
		const response = await axios.patch(`${getBaseUrl()}sessions/${id}/`, data);
		return response.data as StudySession;
	},

	delete: async (id: number): Promise<void> => {
		await axios.delete(`${getBaseUrl()}sessions/${id}/`);
	},

	listTasks: async (sessionId: number): Promise<StudySessionTask[]> => {
		const response = await axios.get(`${getBaseUrl()}sessions/${sessionId}/tasks/`);
		return response.data as StudySessionTask[];
	},

	createTask: async (sessionId: number, data: StudySessionTaskCreate): Promise<StudySessionTask> => {
		const response = await axios.post(`${getBaseUrl()}sessions/${sessionId}/tasks/`, data);
		return response.data as StudySessionTask;
	},

	updateTask: async (
		sessionId: number,
		taskId: number,
		data: StudySessionTaskUpdate,
	): Promise<StudySessionTask> => {
		const response = await axios.patch(
			`${getBaseUrl()}sessions/${sessionId}/tasks/${taskId}/`,
			data,
		);
		return response.data as StudySessionTask;
	},

	deleteTask: async (sessionId: number, taskId: number): Promise<void> => {
		await axios.delete(`${getBaseUrl()}sessions/${sessionId}/tasks/${taskId}/`);
	},
};
