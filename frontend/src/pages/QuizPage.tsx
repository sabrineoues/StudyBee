import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

import { StudyBeeShell } from "../components/StudyBeeShell";
import quizService, {
  type Quiz,
  type QuizDetail,
  type QuizAttemptDetail,
} from "../services/quizService";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
type PageState = "browse" | "take" | "results" | "history";

interface QuizState {
  currentQuestion: number;
  selectedAnswers: Map<number, number | string>;
  isSubmitting: boolean;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────
// QuizPage Component
// ─────────────────────────────────────────────────────────────────
export function QuizPage() {
  const { quizId } = useParams();

  const [pageState, setPageState] = useState<PageState>("browse");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizDetail | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttemptDetail | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    selectedAnswers: new Map(),
    isSubmitting: false,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState<any[]>([]);

  // Load quizzes on mount
  useEffect(() => {
    loadQuizzes();
  }, []);

  // Load specific quiz if quizId in URL
  useEffect(() => {
    if (quizId && !selectedQuiz) {
      loadQuiz(parseInt(quizId));
    }
  }, [quizId]);

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const data = await quizService.getQuizzes();
      setQuizzes(data);
      setPageState("browse");
    } catch (error) {
      console.error("Failed to load quizzes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuiz = async (id: number) => {
    setIsLoading(true);
    try {
      const data = await quizService.getQuiz(id);
      setSelectedQuiz(data);
    } catch (error) {
      console.error("Failed to load quiz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = async (id: number) => {
    setIsLoading(true);
    try {
      const data = await quizService.startQuizAttempt(id);
      setCurrentAttempt(data);
      setQuizState({
        currentQuestion: 0,
        selectedAnswers: new Map(),
        isSubmitting: false,
        error: null,
      });
      setPageState("take");
    } catch (error) {
      console.error("Failed to start quiz:", error);
      setQuizState((prev) => ({
        ...prev,
        error: "Failed to start quiz. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const selectAnswer = (questionId: number, answer: number | string) => {
    setQuizState((prev) => ({
      ...prev,
      selectedAnswers: new Map(prev.selectedAnswers).set(questionId, answer),
    }));
  };

  const submitAnswer = async () => {
    if (!currentAttempt || !selectedQuiz) return;

    const currentQ = selectedQuiz.questions[quizState.currentQuestion];
    const answer = quizState.selectedAnswers.get(currentQ.id);

    if (!answer) {
      setQuizState((prev) => ({
        ...prev,
        error: "Please select an answer before continuing.",
      }));
      return;
    }

    setQuizState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await quizService.submitAnswer(
        currentAttempt.id,
        currentQ.id,
        typeof answer === "number" ? answer : undefined,
        typeof answer === "string" ? answer : undefined
      );

      // Move to next question or finish
      if (quizState.currentQuestion < selectedQuiz.questions.length - 1) {
        setQuizState((prev) => ({
          ...prev,
          currentQuestion: prev.currentQuestion + 1,
          isSubmitting: false,
        }));
      } else {
        // Complete quiz
        completeQuiz();
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setQuizState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: "Failed to submit answer. Please try again.",
      }));
    }
  };

  const completeQuiz = async () => {
    if (!currentAttempt) return;

    setIsLoading(true);
    try {
      const result = await quizService.submitQuiz(currentAttempt.id);
      setCurrentAttempt(result);
      setPageState("results");
    } catch (error) {
      console.error("Failed to complete quiz:", error);
      setQuizState((prev) => ({
        ...prev,
        error: "Failed to complete quiz. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttempts = async () => {
    setIsLoading(true);
    try {
      const data = await quizService.getMyAttempts();
      setAttempts(data);
      setPageState("history");
    } catch (error) {
      console.error("Failed to load attempts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setSelectedQuiz(null);
    setCurrentAttempt(null);
    setQuizState({
      currentQuestion: 0,
      selectedAnswers: new Map(),
      isSubmitting: false,
      error: null,
    });
    setPageState("browse");
  };

  return (
    <StudyBeeShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <AnimatePresence mode="wait">
          {pageState === "browse" && (
            <BrowseQuizzes
              quizzes={quizzes}
              isLoading={isLoading}
              onSelectQuiz={(id) => {
                loadQuiz(id);
                // Delay to let loading happen
                setTimeout(() => {
                  const quiz = quizzes.find((q) => q.id === id);
                  if (quiz) {
                    startQuiz(id);
                  }
                }, 100);
              }}
              onViewHistory={loadAttempts}
            />
          )}

          {pageState === "take" && selectedQuiz && currentAttempt && (
            <TakeQuiz
              quiz={selectedQuiz}
              currentQuestion={quizState.currentQuestion}
              selectedAnswer={quizState.selectedAnswers.get(
                selectedQuiz.questions[quizState.currentQuestion]?.id
              )}
              onSelectAnswer={(answer) =>
                selectAnswer(
                  selectedQuiz.questions[quizState.currentQuestion].id,
                  answer
                )
              }
              onSubmitAnswer={submitAnswer}
              isSubmitting={quizState.isSubmitting}
              error={quizState.error}
              onCancel={resetQuiz}
            />
          )}

          {pageState === "results" && currentAttempt && (
            <QuizResults
              attempt={currentAttempt}
              quiz={selectedQuiz}
              onRetake={() => {
                if (selectedQuiz) {
                  startQuiz(selectedQuiz.id);
                }
              }}
              onBrowse={resetQuiz}
            />
          )}

          {pageState === "history" && (
            <AttemptHistory
              attempts={attempts}
              isLoading={isLoading}
              onViewAttempt={async (id) => {
                try {
                  const attempt = await quizService.getAttempt(id);
                  setCurrentAttempt(attempt);
                  setPageState("results");
                } catch (error) {
                  console.error("Failed to load attempt:", error);
                }
              }}
              onBack={() => setPageState("browse")}
            />
          )}
        </AnimatePresence>
      </div>
    </StudyBeeShell>
  );
}

// ─────────────────────────────────────────────────────────────────
// Browse Quizzes Component
// ─────────────────────────────────────────────────────────────────
interface BrowseQuizzesProps {
  quizzes: Quiz[];
  isLoading: boolean;
  onSelectQuiz: (id: number) => void;
  onViewHistory: () => void;
}

function BrowseQuizzes({
  quizzes,
  isLoading,
  onSelectQuiz,
  onViewHistory,
}: BrowseQuizzesProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800">📚 {t("quiz.title")}</h1>
        <button
          onClick={onViewHistory}
          className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          📊 {t("quiz.myAttempts")}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-slate-600">{t("quiz.noQuizzesAvailable")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz, idx) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onSelectQuiz(quiz.id)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-24 group-hover:from-blue-600 group-hover:to-purple-600 transition-all" />
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {quiz.title}
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  {quiz.description}
                </p>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>
                    {quiz.question_count || 0} {t("quiz.questions")}
                  </span>
                  <span className="text-blue-500 font-semibold">{t("quiz.startQuiz")} →</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Take Quiz Component
// ─────────────────────────────────────────────────────────────────
interface TakeQuizProps {
  quiz: QuizDetail;
  currentQuestion: number;
  selectedAnswer?: number | string;
  onSelectAnswer: (answer: number | string) => void;
  onSubmitAnswer: () => void;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
}

function TakeQuiz({
  quiz,
  currentQuestion,
  selectedAnswer,
  onSelectAnswer,
  onSubmitAnswer,
  isSubmitting,
  error,
  onCancel,
}: TakeQuizProps) {
  const { t } = useTranslation();
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-slate-800">{quiz.title}</h2>
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="bg-blue-500 h-2 rounded-full transition-all"
          />
        </div>
        <p className="text-sm text-slate-600 mt-2">
          {t("quiz.question")} {currentQuestion + 1} {t("quiz.of")} {quiz.questions.length}
        </p>
      </div>

      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-lg shadow-lg p-8 mb-6"
      >
        <h3 className="text-xl font-bold text-slate-800 mb-6">
          {question.question_text}
        </h3>

        {question.question_type === "mcq" ||
        question.question_type === "true_false" ? (
          <div className="space-y-3 mb-6">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => onSelectAnswer(option.id)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === option.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedAnswer === option.id
                        ? "border-blue-500 bg-blue-500"
                        : "border-slate-300"
                    }`}
                  >
                    {selectedAnswer === option.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-slate-700">{option.option_text}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value={(selectedAnswer as string) || ""}
            onChange={(e) => onSelectAnswer(e.target.value)}
            placeholder={t("quiz.enterAnswer")}
            className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 mb-6"
          />
        )}

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      </motion.div>

      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
        >
          {t("quiz.cancel")}
        </button>
        <button
          onClick={onSubmitAnswer}
          disabled={isSubmitting || !selectedAnswer}
          className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300 transition-colors font-semibold"
        >
          {isSubmitting
            ? t("quiz.submitting")
            : currentQuestion === quiz.questions.length - 1
              ? t("quiz.finishQuiz")
              : t("quiz.nextQuestion")}
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Quiz Results Component
// ─────────────────────────────────────────────────────────────────
interface QuizResultsProps {
  attempt: QuizAttemptDetail;
  quiz: QuizDetail | null;
  onRetake: () => void;
  onBrowse: () => void;
}

function QuizResults({
  attempt,
  quiz,
  onRetake,
  onBrowse,
}: QuizResultsProps) {
  const { t } = useTranslation();
  const percentage = attempt.total_questions > 0
    ? (attempt.correct_answers / attempt.total_questions) * 100
    : 0;
  const isPassed = percentage >= 60;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className={`text-6xl mb-4 ${isPassed ? "🎉" : "📚"}`} />
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {isPassed ? t("quiz.greatJob") : t("quiz.keepPracticing")}
          </h2>
          <p className="text-slate-600">
            {quiz?.title || "Quiz"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-8 mb-6">
            <div>
              <div className="text-5xl font-bold text-blue-500">
                {percentage.toFixed(0)}{t("quiz.percentage")}
              </div>
              <p className="text-slate-600">{t("quiz.score")}</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-green-500">
                {attempt.correct_answers}/{attempt.total_questions}
              </div>
              <p className="text-slate-600">{t("quiz.correct")}</p>
            </div>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all ${
                isPassed ? "bg-green-500" : "bg-orange-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-slate-600">
            {isPassed
              ? t("quiz.excellentPerformance")
              : t("quiz.practiceMore")}
          </p>
        </motion.div>

        {attempt.answers && attempt.answers.length > 0 && (
          <div className="mb-8 text-left">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              {t("quiz.reviewAnswers")}
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {attempt.answers.map((answer) => (
                <div
                  key={answer.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    answer.is_correct
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl">
                      {answer.is_correct ? "✓" : "✗"}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">
                        {answer.question_text}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        Your answer: {answer.option_text || answer.text_answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBrowse}
          className="flex-1 px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
        >
          {t("quiz.browseOtherQuizzes")}
        </button>
        <button
          onClick={onRetake}
          className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
        >
          {t("quiz.retakeQuiz")}
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Attempt History Component
// ─────────────────────────────────────────────────────────────────
interface AttemptHistoryProps {
  attempts: any[];
  isLoading: boolean;
  onViewAttempt: (id: number) => void;
  onBack: () => void;
}

function AttemptHistory({
  attempts,
  isLoading,
  onViewAttempt,
  onBack,
}: AttemptHistoryProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="px-4 py-2 text-blue-500 hover:text-blue-600"
        >
          ← {t("quiz.back")}
        </button>
        <h1 className="text-3xl font-bold text-slate-800">{t("quiz.myAttempts")}</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-xl text-slate-600">{t("quiz.noAttempts")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <motion.div
              key={attempt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onViewAttempt(attempt.id)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">
                    {attempt.quiz_title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(attempt.started_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-500">
                    {attempt.percentage?.toFixed(0)}%
                  </div>
                  <p className="text-sm text-slate-600">
                    {attempt.correct_answers}/{attempt.total_questions}
                  </p>
                </div>
              </div>
              {attempt.completed_at && (
                <p className="text-xs text-slate-500 mt-2">
                  Completed: {new Date(attempt.completed_at).toLocaleString()}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
