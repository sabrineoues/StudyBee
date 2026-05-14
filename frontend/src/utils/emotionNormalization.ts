export type EmotionNormalizationResult = {
	detectedEmotion: string;
	canonicalEmotion: string;
	moodScore: number;
	stressLevel: number;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const EMOTION_SCORE_MAP: Record<string, { moodScore: number; stressLevel: number }> = {
	joy: { moodScore: 0.95, stressLevel: 0.05 },
	happy: { moodScore: 0.9, stressLevel: 0.1 },
	focused: { moodScore: 0.85, stressLevel: 0.2 },
	calm: { moodScore: 0.8, stressLevel: 0.2 },
	neutral: { moodScore: 0.6, stressLevel: 0.5 },
	surprised: { moodScore: 0.65, stressLevel: 0.45 },
	sad: { moodScore: 0.3, stressLevel: 0.8 },
	angry: { moodScore: 0.2, stressLevel: 0.9 },
	fear: { moodScore: 0.15, stressLevel: 0.95 },
	stressed: { moodScore: 0.1, stressLevel: 0.95 },
	disgust: { moodScore: 0.1, stressLevel: 0.9 },
	anxious: { moodScore: 0.1, stressLevel: 0.95 },
};

const EMOTION_ALIASES: Record<string, string> = {
	joyful: "joy",
	content: "happy",
	relaxed: "calm",
	peaceful: "calm",
	focus: "focused",
	focusing: "focused",
	worried: "anxious",
	anxiety: "anxious",
	fearful: "fear",
	mad: "angry",
	sadness: "sad",
};

export function clampEmotionScore(value: number): number {
	return clamp01(Number.isFinite(value) ? value : 0);
}

export function normalizeEmotionLabel(label: string | null | undefined): string {
	const cleaned = (label ?? "neutral").trim().toLowerCase();
	if (!cleaned) return "neutral";
	return EMOTION_ALIASES[cleaned] ?? cleaned;
}

export function deriveEmotionNormalization(label: string | null | undefined): EmotionNormalizationResult {
	const detectedEmotion = normalizeEmotionLabel(label);
	const canonicalEmotion = EMOTION_ALIASES[detectedEmotion] ?? detectedEmotion;
	const scores = EMOTION_SCORE_MAP[canonicalEmotion] ?? EMOTION_SCORE_MAP.neutral;

	return {
		detectedEmotion,
		canonicalEmotion,
		moodScore: clampEmotionScore(scores.moodScore),
		stressLevel: clampEmotionScore(scores.stressLevel),
	};
}