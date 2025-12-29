"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuizSession, QuizSessionData, QuizAnswer } from "@/hooks/use-quiz-session";
import { Loader2, Clock, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const quizId = params.quizId as string;
  const examCode = params.examCode as string;

  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Fetch quiz data
  const { data: quizData, isLoading, error } = useQuery<QuizSessionData>({
    queryKey: ["quiz-start", quizId],
    queryFn: async () => {
      const response = await fetch(`/api/quizzes/${quizId}/start`);
      if (!response.ok) {
        throw new Error("Failed to fetch quiz");
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async ({
      answers,
      totalTimeSpent,
    }: {
      answers: QuizAnswer[];
      totalTimeSpent: number;
    }) => {
      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, totalTimeSpent }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      return response.json();
    },
    onSuccess: (data) => {
      router.push(`/exam/${examCode}/quizzes/${quizId}/results/${data.attemptId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitQuiz = async (answers: QuizAnswer[], totalTimeSpent: number) => {
    await submitMutation.mutateAsync({ answers, totalTimeSpent });
  };

  // Prevent page refresh/close during quiz
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || "Failed to load quiz"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <QuizSession quizData={quizData} onSubmit={handleSubmitQuiz} examCode={examCode} quizId={quizId} />;
}

function QuizSession({
  quizData,
  onSubmit,
  examCode,
  quizId
}: {
  quizData: QuizSessionData;
  onSubmit: (answers: QuizAnswer[], totalTimeSpent: number) => Promise<void>;
  examCode: string;
  quizId: string;
}) {
  const router = useRouter();
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const quiz = useQuizSession({
    quizData,
    onSubmit,
  });

  const progress = ((quiz.currentQuestionIndex + 1) / quiz.totalQuestions) * 100;
  const selectedOptions = quiz.getSelectedOptions(quiz.currentQuestion.id);
  const answeredCount = quiz.getAnsweredQuestionsCount();

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "No time limit";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmitClick = () => {
    if (answeredCount < quiz.totalQuestions) {
      setShowConfirmSubmit(true);
    } else {
      quiz.handleSubmit();
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{quizData.title}</h1>
        {quizData.description && (
          <p className="text-muted-foreground">{quizData.description}</p>
        )}
      </div>

      {/* Timer and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time Remaining</p>
                <p className={`text-2xl font-bold ${
                  quiz.timeRemaining !== null && quiz.timeRemaining < 60 ? "text-destructive" : ""
                }`}>
                  {formatTime(quiz.timeRemaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Questions Answered</p>
              <p className="text-2xl font-bold">
                {answeredCount} / {quiz.totalQuestions}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Passing Score</p>
              <p className="text-2xl font-bold">{quizData.passingScore}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>
            Question {quiz.currentQuestionIndex + 1} of {quiz.totalQuestions}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Question {quiz.currentQuestionIndex + 1}
          </CardTitle>
          <CardDescription>
            {quiz.currentQuestion.questionType === "multiple"
              ? "Select all that apply"
              : "Select one answer"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg">{quiz.currentQuestion.questionText}</p>

          {/* Options */}
          <div className="space-y-3">
            {quiz.currentQuestion.questionType === "single" ? (
              <RadioGroup
                value={selectedOptions[0] || ""}
                onValueChange={(value) => quiz.selectOption(value)}
              >
                {quiz.currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent cursor-pointer"
                    onClick={() => quiz.selectOption(option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer"
                    >
                      {option.optionText}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-3">
                {quiz.currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent cursor-pointer"
                    onClick={() => quiz.selectOption(option.id)}
                  >
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => quiz.selectOption(option.id)}
                    />
                    <Label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer"
                    >
                      {option.optionText}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Answer status */}
          {selectedOptions.length > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {quiz.currentQuestion.questionType === "multiple"
                  ? `${selectedOptions.length} option(s) selected`
                  : "Answer selected"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Question Navigation */}
      <div className="grid grid-cols-5 gap-2">
        {quizData.questions.map((_, index) => {
          const isAnswered = quiz.getSelectedOptions(quizData.questions[index].id).length > 0;
          const isCurrent = index === quiz.currentQuestionIndex;

          return (
            <Button
              key={index}
              variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
              size="sm"
              onClick={() => quiz.goToQuestion(index)}
              className="relative"
            >
              {index + 1}
              {isAnswered && !isCurrent && (
                <CheckCircle2 className="h-3 w-3 absolute top-1 right-1" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmSubmit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              You have answered {answeredCount} out of {quiz.totalQuestions} questions.
              Unanswered questions will be marked as incorrect.
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setShowConfirmSubmit(false);
                  quiz.handleSubmit();
                }}
              >
                Submit Anyway
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={quiz.previousQuestion}
          disabled={quiz.isFirstQuestion}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {!quiz.isLastQuestion ? (
            <Button onClick={quiz.nextQuestion}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitClick}
              disabled={quiz.isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {quiz.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
