import { useState, useEffect, useCallback, useRef } from "react";

export interface QuizQuestion {
  id: string;
  questionText: string;
  explanation: string | null;
  order: number;
  questionType: "single" | "multiple";
  options: {
    id: string;
    optionText: string;
    order: number;
  }[];
}

export interface QuizSessionData {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  questions: QuizQuestion[];
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionIds: string[];
  timeSpent: number;
}

interface UseQuizSessionProps {
  quizData: QuizSessionData;
  onSubmit: (answers: QuizAnswer[], totalTimeSpent: number) => Promise<void>;
}

export function useQuizSession({ quizData, onSubmit }: UseQuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, QuizAnswer>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quizData.timeLimit ? quizData.timeLimit * 60 : null
  );
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [totalStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Auto-submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining]);

  // Track time spent on current question
  const recordQuestionTime = useCallback(() => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const currentAnswer = answers.get(currentQuestion.id);

    if (currentAnswer) {
      setAnswers(
        new Map(
          answers.set(currentQuestion.id, {
            ...currentAnswer,
            timeSpent: currentAnswer.timeSpent + timeSpent,
          })
        )
      );
    }

    setQuestionStartTime(Date.now());
  }, [currentQuestion.id, questionStartTime, answers]);

  const selectOption = useCallback(
    (optionId: string) => {
      const currentAnswer = answers.get(currentQuestion.id);
      let newSelectedIds: string[];

      if (currentQuestion.questionType === "single") {
        // Single answer: replace selection
        newSelectedIds = [optionId];
      } else {
        // Multiple answers: toggle selection
        const currentSelections = currentAnswer?.selectedOptionIds || [];
        if (currentSelections.includes(optionId)) {
          newSelectedIds = currentSelections.filter((id) => id !== optionId);
        } else {
          newSelectedIds = [...currentSelections, optionId];
        }
      }

      setAnswers(
        new Map(
          answers.set(currentQuestion.id, {
            questionId: currentQuestion.id,
            selectedOptionIds: newSelectedIds,
            timeSpent: currentAnswer?.timeSpent || 0,
          })
        )
      );
    },
    [currentQuestion, answers]
  );

  const goToQuestion = useCallback(
    (index: number) => {
      if (index < 0 || index >= quizData.questions.length) return;
      recordQuestionTime();
      setCurrentQuestionIndex(index);
    },
    [quizData.questions.length, recordQuestionTime]
  );

  const nextQuestion = useCallback(() => {
    if (!isLastQuestion) {
      goToQuestion(currentQuestionIndex + 1);
    }
  }, [isLastQuestion, currentQuestionIndex, goToQuestion]);

  const previousQuestion = useCallback(() => {
    if (!isFirstQuestion) {
      goToQuestion(currentQuestionIndex - 1);
    }
  }, [isFirstQuestion, currentQuestionIndex, goToQuestion]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    recordQuestionTime();

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const totalTimeSpent = Math.floor((Date.now() - totalStartTime) / 1000);

    // Ensure all questions have an answer entry (even if empty)
    const completeAnswers: QuizAnswer[] = quizData.questions.map((q) => {
      const existingAnswer = answers.get(q.id);
      return (
        existingAnswer || {
          questionId: q.id,
          selectedOptionIds: [],
          timeSpent: 0,
        }
      );
    });

    try {
      await onSubmit(completeAnswers, totalTimeSpent);
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  }, [isSubmitting, recordQuestionTime, totalStartTime, quizData.questions, answers, onSubmit]);

  const getSelectedOptions = useCallback(
    (questionId: string): string[] => {
      return answers.get(questionId)?.selectedOptionIds || [];
    },
    [answers]
  );

  const getAnsweredQuestionsCount = useCallback(() => {
    return Array.from(answers.values()).filter((a) => a.selectedOptionIds.length > 0).length;
  }, [answers]);

  return {
    // Current state
    currentQuestion,
    currentQuestionIndex,
    timeRemaining,
    isSubmitting,

    // Navigation helpers
    isLastQuestion,
    isFirstQuestion,
    totalQuestions: quizData.questions.length,

    // Answer state
    getSelectedOptions,
    getAnsweredQuestionsCount,

    // Actions
    selectOption,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    handleSubmit,
  };
}
