"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Trophy,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";

interface QuizResultsData {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  attemptNumber: number;
  passingScore: number;
  startedAt: string;
  completedAt: string;
  detailedAnswers: {
    questionId: string;
    questionText: string;
    explanation: string | null;
    questionType: string;
    order: number;
    selectedOptionIds: string[];
    correctOptionIds: string[];
    isCorrect: boolean;
    timeSpent: number;
    options: {
      id: string;
      optionText: string;
      isCorrect: boolean;
      order: number;
    }[];
  }[];
}

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;
  const quizId = params.quizId as string;
  const examCode = params.examCode as string;

  const { data, isLoading, error } = useQuery<QuizResultsData>({
    queryKey: ["quiz-results", attemptId],
    queryFn: async () => {
      const response = await fetch(`/api/quizzes/results/${attemptId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load quiz results. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/exam/${examCode}/quizzes`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
      </div>

      {/* Results Summary */}
      <Card className={data.passed ? "border-green-500" : "border-red-500"}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {data.passed ? (
              <Trophy className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-3xl">
            {data.passed ? "Congratulations!" : "Not Passed"}
          </CardTitle>
          <CardDescription className="text-lg">
            {data.quizTitle} - Attempt #{data.attemptNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score */}
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">{data.score}%</div>
            <p className="text-muted-foreground">
              Passing score: {data.passingScore}%
            </p>
          </div>

          <Separator />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Correct Answers</span>
              </div>
              <div className="text-2xl font-bold">
                {data.correctAnswers} / {data.totalQuestions}
              </div>
            </div>

            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">Time Spent</span>
              </div>
              <div className="text-2xl font-bold">{formatTime(data.timeSpent)}</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="flex items-center justify-center gap-2 mb-2">
                <RotateCcw className="h-5 w-5 text-purple-500" />
                <span className="font-semibold">Attempt</span>
              </div>
              <div className="text-2xl font-bold">#{data.attemptNumber}</div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Completed: {formatDateTime(data.completedAt)}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push(`/exam/${examCode}/quizzes/${quizId}/take`)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/exam/${examCode}/quizzes/${quizId}/history`)}
            >
              View History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Question Breakdown</h2>

        {data.detailedAnswers.map((answer, index) => {
          const isCorrect = answer.isCorrect;
          const userSelectedSet = new Set(answer.selectedOptionIds);
          const correctSet = new Set(answer.correctOptionIds);

          return (
            <Card key={answer.questionId} className={isCorrect ? "border-green-500" : "border-red-500"}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>Question {index + 1}</span>
                      <Badge variant={isCorrect ? "default" : "destructive"}>
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Correct
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Incorrect
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline">
                        {answer.questionType === "multiple" ? "Multiple Choice" : "Single Choice"}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {answer.questionText}
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {formatTime(answer.timeSpent)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Options */}
                <div className="space-y-2">
                  {answer.options.map((option) => {
                    const isUserSelected = userSelectedSet.has(option.id);
                    const isCorrectOption = correctSet.has(option.id);

                    let optionClass = "p-3 rounded-lg border ";
                    let textClass = "";

                    if (isCorrectOption && isUserSelected) {
                      // Correct answer that user selected
                      optionClass += "bg-green-100 border-green-600 dark:bg-green-900/30 dark:border-green-500";
                      textClass = "text-green-900 dark:text-green-100";
                    } else if (isCorrectOption) {
                      // Correct answer that user didn't select
                      optionClass += "bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600";
                      textClass = "text-green-800 dark:text-green-200";
                    } else if (isUserSelected) {
                      // Wrong answer that user selected
                      optionClass += "bg-red-100 border-red-600 dark:bg-red-900/30 dark:border-red-500";
                      textClass = "text-red-900 dark:text-red-100";
                    } else {
                      // Not selected, not correct
                      optionClass += "bg-muted border-muted";
                      textClass = "text-foreground";
                    }

                    return (
                      <div key={option.id} className={optionClass}>
                        <div className="flex items-center justify-between">
                          <span className={textClass}>{option.optionText}</span>
                          <div className="flex gap-2">
                            {isUserSelected && (
                              <Badge
                                variant="outline"
                                className="text-xs border-current"
                              >
                                Your Answer
                              </Badge>
                            )}
                            {isCorrectOption && (
                              <Badge
                                className="text-xs bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                              >
                                Correct
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {answer.explanation && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Explanation:</strong> {answer.explanation}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex gap-4 justify-center pb-8">
        <Button
          onClick={() => router.push(`/exam/${examCode}/quizzes/${quizId}/take`)}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Retake Quiz
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/exam/${examCode}/quizzes`)}
        >
          Back to All Quizzes
        </Button>
      </div>
    </div>
  );
}
