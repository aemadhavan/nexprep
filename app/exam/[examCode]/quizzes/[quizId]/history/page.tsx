"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  TrendingUp,
  Target,
  Award,
  Clock,
  ArrowLeft,
  Eye,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

interface QuizHistoryData {
  quizId: string;
  quizTitle: string;
  passingScore: number;
  examCode: string;
  examName: string;
  skillTitle: string;
  statistics: {
    totalAttempts: number;
    passedAttempts: number;
    bestScore: number;
    averageScore: number;
  };
  attempts: {
    id: string;
    attemptNumber: number;
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    startedAt: string;
    completedAt: string;
  }[];
}

export default function QuizHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const examCode = params.examCode as string;

  const { data, isLoading, error } = useQuery<QuizHistoryData>({
    queryKey: ["quiz-history", quizId],
    queryFn: async () => {
      const response = await fetch(`/api/quizzes/${quizId}/history`);
      if (!response.ok) {
        throw new Error("Failed to fetch quiz history");
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
      <div className="container max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load quiz history. Please try again.
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
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
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

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{data.quizTitle}</h1>
        <p className="text-muted-foreground">
          {data.examName} • {data.skillTitle}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              {data.statistics.passedAttempts} passed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.bestScore}%</div>
            <p className="text-xs text-muted-foreground">
              Passing: {data.passingScore}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              Across all attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.statistics.totalAttempts > 0
                ? Math.round(
                    (data.statistics.passedAttempts / data.statistics.totalAttempts) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attempt History</CardTitle>
          <CardDescription>
            View all your attempts and detailed results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.attempts.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No attempts yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your first quiz attempt to see your history here.
              </p>
              <Button onClick={() => router.push(`/exam/${examCode}/quizzes/${quizId}/take`)}>
                Start Quiz
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attempt</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Correct Answers</TableHead>
                  <TableHead>Time Spent</TableHead>
                  <TableHead>Completed At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">
                      #{attempt.attemptNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{attempt.score}%</span>
                        {attempt.score === data.statistics.bestScore && (
                          <Award className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={attempt.passed ? "default" : "destructive"}>
                        {attempt.passed ? "Passed" : "Failed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {attempt.correctAnswers} / {attempt.totalQuestions}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(attempt.timeSpent)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(attempt.completedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/exam/${examCode}/quizzes/${quizId}/results/${attempt.id}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {data.attempts.length > 0 && (
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push(`/exam/${examCode}/quizzes/${quizId}/take`)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Take Quiz Again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/exam/${examCode}/quizzes`)}
          >
            Back to All Quizzes
          </Button>
        </div>
      )}
    </div>
  );
}
