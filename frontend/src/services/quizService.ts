import axios from "axios";

const API_BASE_URL = "/api/quiz";

export interface QuestionOption {
  id: number;
  option_text: string;
  order: number;
}

export interface Question {
  id: number;
  question_type: "mcq" | "true_false" | "short_answer";
  question_text: string;
  explanation: string;
  order: number;
  options: QuestionOption[];
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  question_count?: number;
  created_at: string;
}

export interface QuizDetail extends Quiz {
  questions: Question[];
}

export interface QuizAttempt {
  id: number;
  quiz: number;
  quiz_title: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  total_questions: number;
  correct_answers: number;
}

export interface Answer {
  id: number;
  question: number;
  question_text: string;
  selected_option: number | null;
  option_text: string;
  text_answer: string;
  is_correct: boolean;
}

export interface QuizAttemptDetail extends QuizAttempt {
  answers: Answer[];
}

const quizService = {
  // Get all quizzes
  async getQuizzes(): Promise<Quiz[]> {
    const response = await axios.get(`${API_BASE_URL}/quizzes/`);
    return response.data;
  },

  // Get a specific quiz with all questions
  async getQuiz(quizId: number): Promise<QuizDetail> {
    const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/`);
    return response.data;
  },

  // Start a new quiz attempt
  async startQuizAttempt(quizId: number): Promise<QuizAttemptDetail> {
    const response = await axios.post(`${API_BASE_URL}/quizzes/${quizId}/start_attempt/`);
    return response.data;
  },

  // Submit an answer to a question
  async submitAnswer(
    attemptId: number,
    questionId: number,
    selectedOptionId?: number,
    textAnswer?: string
  ): Promise<{
    id: number;
    is_correct: boolean;
    correct_answers: number;
    total_questions: number;
  }> {
    const response = await axios.post(`${API_BASE_URL}/attempts/submit_answer/`, {
      attempt_id: attemptId,
      question_id: questionId,
      selected_option_id: selectedOptionId,
      text_answer: textAnswer,
    });
    return response.data;
  },

  // Complete a quiz and get final score
  async submitQuiz(attemptId: number): Promise<QuizAttemptDetail> {
    const response = await axios.post(`${API_BASE_URL}/attempts/submit_quiz/`, {
      attempt_id: attemptId,
    });
    return response.data;
  },

  // Get all attempts by current user
  async getMyAttempts(): Promise<QuizAttempt[]> {
    const response = await axios.get(`${API_BASE_URL}/attempts/my_attempts/`);
    return response.data;
  },

  // Get a specific attempt
  async getAttempt(attemptId: number): Promise<QuizAttemptDetail> {
    const response = await axios.get(`${API_BASE_URL}/attempts/${attemptId}/`);
    return response.data;
  },
};

export default quizService;
