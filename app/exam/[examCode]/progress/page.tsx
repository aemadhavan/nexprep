"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { ProgressChart } from "@/components/progress/progress-chart";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  TrendingUp,
  Target,
  Award,
  CalendarDays,
} from "lucide-react";

export default function ProgressPage() {
  const params = useParams();
  const router = useRouter();
  const examCode = params.examCode as string;

  // Fetch progress data
  const { data, isLoading, error } = useQuery({
    queryKey: ["progress", examCode],
    queryFn: async () => {
      const response = await fetch(`/api/progress/${examCode}`);
      if (!response.ok) throw new Error("Failed to fetch progress");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading progress..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <ErrorMessage
            title="Failed to load progress"
            message={error.message}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/exam/${examCode}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Exam
                </Button>
              </Link>
              <h1 className="text-3xl font-bold mt-4">Progress Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Track your study progress and performance
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completion
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.completionPercentage}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.studied} of {data.totalFlashcards} cards studied
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Mastery
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.masteryPercentage}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.known} cards fully mastered
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Due for Review
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.dueForReview}</div>
                <p className="text-xs text-muted-foreground">
                  Cards ready to review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Cards
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.totalFlashcards}
                </div>
                <p className="text-xs text-muted-foreground">
                  In this exam
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chart */}
            <ProgressChart
              new={data.new}
              learning={data.learning}
              known={data.known}
              notStarted={data.notStarted}
            />

            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
                <CardDescription>
                  Distribution of cards by learning status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted" />
                    <span className="text-sm">Not Started</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{data.notStarted}</span>
                    <Badge variant="outline">
                      {data.totalFlashcards > 0
                        ? Math.round((data.notStarted / data.totalFlashcards) * 100)
                        : 0}
                      %
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-sm">New</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{data.new}</span>
                    <Badge variant="outline">
                      {data.totalFlashcards > 0
                        ? Math.round((data.new / data.totalFlashcards) * 100)
                        : 0}
                      %
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-chart-2" />
                    <span className="text-sm">Learning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{data.learning}</span>
                    <Badge variant="outline">
                      {data.totalFlashcards > 0
                        ? Math.round((data.learning / data.totalFlashcards) * 100)
                        : 0}
                      %
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-chart-3" />
                    <span className="text-sm">Known</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{data.known}</span>
                    <Badge>
                      {data.totalFlashcards > 0
                        ? Math.round((data.known / data.totalFlashcards) * 100)
                        : 0}
                      %
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          {data.recentActivity && data.recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Recent Activity (Last 7 Days)
                </CardTitle>
                <CardDescription>
                  Cards reviewed per day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.recentActivity.map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <Badge variant="secondary">{activity.count} cards</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Link href={`/exam/${examCode}/flashcards?dueOnly=true`}>
              <Button size="lg">
                <TrendingUp className="mr-2 h-5 w-5" />
                Review Due Cards ({data.dueForReview})
              </Button>
            </Link>
            <Link href={`/exam/${examCode}/flashcards`}>
              <Button variant="outline" size="lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Study All Cards
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
