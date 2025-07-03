import React, { useState, useEffect } from "react";
import QuizCard from "../components/QuizCard";
import { Question } from "../types";

const Quiz: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Array<{ questionId: number; isCorrect: boolean }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [chatSessionId, setChatSessionId] = useState<number | null>(null);
  const [isPdfQuiz, setIsPdfQuiz] = useState(false);

  useEffect(() => {
    // Check URL parameters for PDF quiz
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("chat_session_id");
    if (sessionId) {
      setChatSessionId(parseInt(sessionId));
      setIsPdfQuiz(true);
      // Auto-start PDF quiz
      loadQuiz(null, parseInt(sessionId));
    }
  }, []);

  const loadQuiz = async (
    difficulty: string | null = null,
    sessionId: number | null = null
  ) => {
    setLoading(true);
    try {
      // Build URL with parameters
      let url = "/api/quiz";
      const params = new URLSearchParams();

      if (sessionId || chatSessionId) {
        params.append(
          "chat_session_id",
          (sessionId || chatSessionId)!.toString()
        );
      }

      if (difficulty || selectedDifficulty) {
        params.append("difficulty", difficulty || selectedDifficulty);
      }

      if (params.toString()) {
        url += "?" + params.toString();
      }

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load quiz");
      }

      const data = await response.json();
      setQuestions(data.questions);
      setQuizStarted(true);
    } catch (error) {
      console.error("Error loading quiz:", error);
      alert("Failed to load quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, isCorrect: boolean) => {
    const newAnswers = [...answers, { questionId, isCorrect }];
    setAnswers(newAnswers);

    // Move to next question or complete quiz
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 500);
    } else {
      setTimeout(() => {
        completeQuiz(newAnswers);
      }, 500);
    }
  };

  const completeQuiz = async (
    finalAnswers: Array<{ questionId: number; isCorrect: boolean }>
  ) => {
    try {
      const response = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ answers: finalAnswers }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      setQuizCompleted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz results.");
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuizCompleted(false);
    setQuizStarted(false);
  };

  const calculateScore = () => {
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
    return Math.round((correctAnswers / answers.length) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Excellent work! 🎉";
    if (score >= 80) return "Great job! 👏";
    if (score >= 70) return "Good effort! 👍";
    if (score >= 60) return "Keep practicing! 📚";
    return "Don't give up! 💪";
  };

  if (!quizStarted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPdfQuiz ? "PDF Quiz" : "Adaptive Quiz"}
          </h1>
          <p className="text-gray-600">
            {isPdfQuiz
              ? "Test your understanding of the uploaded PDF document and your conversation."
              : "Take a personalized quiz based on your learning progress and weak areas."}
          </p>
        </div>

        <div className="card">
          <div className="card-content text-center py-12">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i
                className={`fas ${
                  isPdfQuiz ? "fa-file-pdf" : "fa-brain"
                } text-primary-600 text-3xl`}
              ></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isPdfQuiz ? "Ready for Your PDF Quiz?" : "Ready for Your Quiz?"}
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {isPdfQuiz
                ? "Questions will be generated based on your PDF content and chat conversation."
                : "We'll generate questions based on your learning history and areas that need improvement."}
            </p>

            {/* Difficulty Selection - Only for regular quizzes */}
            {!isPdfQuiz && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Difficulty Level
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {[
                    {
                      value: "easy",
                      label: "Easy",
                      icon: "fa-smile",
                      description: "Basic concepts and simple questions",
                    },
                    {
                      value: "medium",
                      label: "Medium",
                      icon: "fa-meh",
                      description: "Moderate difficulty with some challenges",
                    },
                    {
                      value: "hard",
                      label: "Hard",
                      icon: "fa-frown",
                      description: "Advanced concepts and complex problems",
                    },
                  ].map((difficulty) => (
                    <button
                      key={difficulty.value}
                      type="button"
                      onClick={() => setSelectedDifficulty(difficulty.value)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedDifficulty === difficulty.value
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i
                          className={`fas ${difficulty.icon} text-primary-600 text-xl`}
                        ></i>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {difficulty.label}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {difficulty.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => loadQuiz()}
              disabled={loading || (!isPdfQuiz && !selectedDifficulty)}
              className="btn btn-primary btn-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Generating Quiz...
                </>
              ) : (
                <>
                  <i className="fas fa-play mr-2"></i>
                  Start Quiz
                </>
              )}
            </button>

            {!isPdfQuiz && !selectedDifficulty && (
              <p className="text-sm text-gray-500 mt-3">
                Please select a difficulty level to continue
              </p>
            )}
          </div>
        </div>

        {/* Quiz Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-target text-primary-600 text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">Personalized</h3>
              <p className="text-gray-600 text-sm">
                Questions tailored to your learning level and weak areas
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-success-600 text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">Progress Tracking</h3>
              <p className="text-gray-600 text-sm">
                Monitor your improvement over time with detailed analytics
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-lightbulb text-warning-600 text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">Instant Feedback</h3>
              <p className="text-gray-600 text-sm">
                Get immediate explanations for correct and incorrect answers
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const score = calculateScore();
    const correctCount = answers.filter((answer) => answer.isCorrect).length;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-content text-center py-12">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-trophy text-primary-600 text-3xl"></i>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Quiz Complete!
            </h2>
            <p className="text-gray-600 mb-8">{getScoreMessage(score)}</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="text-center">
                <div
                  className={`text-4xl font-bold mb-2 ${getScoreColor(score)}`}
                >
                  {score}%
                </div>
                <p className="text-gray-600">
                  {correctCount} out of {answers.length} questions correct
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {correctCount}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {answers.length - correctCount}
                </div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={resetQuiz} className="btn btn-primary">
                <i className="fas fa-redo mr-2"></i>
                Take Another Quiz
              </button>
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="btn btn-outline"
              >
                <i className="fas fa-chart-line mr-2"></i>
                View Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-content text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your personalized quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Quiz in Progress</h1>
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Current Question */}
      <QuizCard
        key={currentQuestion.id}
        question={currentQuestion}
        onAnswer={handleAnswer}
      />

      {/* Quiz Navigation */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          {currentQuestionIndex < questions.length - 1
            ? "Answer to continue to the next question"
            : "This is the final question"}
        </p>
      </div>
    </div>
  );
};

export default Quiz;
