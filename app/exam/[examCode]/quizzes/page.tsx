"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { ArrowLeft, Clock, Trophy, CheckCircle, Play } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  questionCount: number;
  skill: { id: string; title: string };
  category: { id: string; title: string };
  domain: { id: string; title: string };
  userStats: {
    attempts: number;
    bestScore: number;
    lastAttemptDate: string;
    passed: boolean;
  } | null;
}

interface QuizzesByDomain {
  [domainTitle: string]: {
    [categoryTitle: string]: {
      [skillTitle: string]: Quiz[];
    };
  };
}

export default function QuizzesPage() {
  const params = useParams();
  const examCode = params.examCode as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["quizzes", examCode],
    queryFn: async () => {
      const response = await fetch(`/api/exams/${examCode}/quizzes`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch quizzes");
      }
      return response.json() as Promise<{
        quizzes: Quiz[];
        exam: { id: string; code: string; name: string };
      }>;
    },
  });

  // Group quizzes by domain → category → skill
  const groupedQuizzes: QuizzesByDomain = {};
  data?.quizzes.forEach((quiz) => {
    const domainTitle = quiz.domain.title;
    const categoryTitle = quiz.category.title;
    const skillTitle = quiz.skill.title;

    if (!groupedQuizzes[domainTitle]) {
      groupedQuizzes[domainTitle] = {};
    }
    if (!groupedQuizzes[domainTitle][categoryTitle]) {
      groupedQuizzes[domainTitle][categoryTitle] = {};
    }
    if (!groupedQuizzes[domainTitle][categoryTitle][skillTitle]) {
      groupedQuizzes[domainTitle][categoryTitle][skillTitle] = [];
    }

    groupedQuizzes[domainTitle][categoryTitle][skillTitle].push(quiz);
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/exam/${examCode}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Exam
                </Button>
              </Link>
              <h1 className="text-3xl font-bold mt-4">
                {data?.exam.name || "Loading..."} - Quizzes
              </h1>
              <p className="text-muted-foreground mt-2">
                Test your knowledge with practice quizzes
              </p>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Loading quizzes..." />
            </div>
          )}

          {error && (
            <ErrorMessage
              title="Failed to load quizzes"
              message={error instanceof Error ? error.message : "Unknown error"}
            />
          )}

          {!isLoading && !error && data && (
            <>
              {data.quizzes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No quizzes available</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      There are no quizzes for this exam yet. Check back later!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Available Quizzes ({data.quizzes.length})</CardTitle>
                    <CardDescription>
                      Quizzes are organized by domain, category, and skill
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      {/* Table Header */}
                      <div className="grid grid-cols-[200px_200px_1fr] bg-muted/50 border-b font-semibold">
                        <div className="px-4 py-3 border-r">Domain</div>
                        <div className="px-4 py-3 border-r">Category</div>
                        <div className="px-4 py-3">Skill & Quizzes</div>
                      </div>
                      {/* Table Body */}
                      <div>
                        {Object.entries(groupedQuizzes).flatMap(([domainTitle, categories]) => {
                          let isFirstDomainRow = true;

                          return Object.entries(categories).flatMap(([categoryTitle, skills]) => {
                            let isFirstCategoryRow = true;

                            return Object.entries(skills).flatMap(([skillTitle, quizzes]) => {
                              let isFirstSkillRow = true;

                              return quizzes.map((quiz) => {
                                const showDomain = isFirstDomainRow;
                                const showCategory = isFirstCategoryRow;
                                const showSkill = isFirstSkillRow;
                                isFirstDomainRow = false;
                                isFirstCategoryRow = false;
                                isFirstSkillRow = false;

                                return (
                                  <div
                                    key={quiz.id}
                                    className="grid grid-cols-[200px_200px_1fr] border-b last:border-b-0"
                                  >
                                    <div className={`px-4 py-3 border-r font-medium align-top ${showDomain ? '' : 'opacity-0 pointer-events-none'}`}>
                                      {showDomain && domainTitle}
                                    </div>
                                    <div className={`px-4 py-3 border-r text-sm align-top ${showCategory ? '' : 'opacity-0 pointer-events-none'}`}>
                                      {showCategory && categoryTitle}
                                    </div>
                                    <div className="px-4 py-3">
                                      {showSkill && (
                                        <div className="text-sm font-medium text-muted-foreground mb-3">
                                          {skillTitle}
                                        </div>
                                      )}
                                      <Card className="border-l-4 border-l-primary">
                                        <CardHeader className="pb-3">
                                          <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                              <CardTitle className="text-base">{quiz.title}</CardTitle>
                                              {quiz.description && (
                                                <CardDescription className="mt-1">
                                                  {quiz.description}
                                                </CardDescription>
                                              )}
                                            </div>
                                            {quiz.userStats && (
                                              <div className="shrink-0">
                                                {quiz.userStats.passed ? (
                                                  <Badge className="bg-green-600">
                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                    Passed
                                                  </Badge>
                                                ) : (
                                                  <Badge variant="secondary">
                                                    Best: {quiz.userStats.bestScore}%
                                                  </Badge>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                              <div className="flex items-center gap-1">
                                                <Trophy className="h-4 w-4" />
                                                {quiz.questionCount} questions
                                              </div>
                                              {quiz.timeLimit && (
                                                <div className="flex items-center gap-1">
                                                  <Clock className="h-4 w-4" />
                                                  {quiz.timeLimit} min
                                                </div>
                                              )}
                                              <div>Pass: {quiz.passingScore}%</div>
                                              {quiz.userStats && (
                                                <div>Attempts: {quiz.userStats.attempts}</div>
                                              )}
                                            </div>
                                            <Link href={`/exam/${examCode}/quizzes/${quiz.id}/take`}>
                                              <Button size="sm" className="w-full sm:w-auto">
                                                <Play className="mr-2 h-4 w-4" />
                                                {quiz.userStats ? "Retake Quiz" : "Start Quiz"}
                                              </Button>
                                            </Link>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </div>
                                );
                              });
                            });
                          });
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
