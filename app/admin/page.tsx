"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, BookOpen, Users, Activity, UserPlus, FolderTree, Layers, Target } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading stats..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load stats"
        message={error instanceof Error ? error.message : "Unknown error"}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage exams, content, and users
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalExams || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFlashcards || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Upload Exam Content</CardTitle>
              <CardDescription>
                Import AB-900 flashcards and exam structure from JSON
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/upload">
                <Button className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Content
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grant Exam Access</CardTitle>
              <CardDescription>
                Manually grant exam access to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/grant-access">
                <Button className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Grant Access
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Exams</CardTitle>
              <CardDescription>
                Create, edit, and configure exams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/exams">
                <Button className="w-full">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Manage Exams
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Management */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Content Management</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Manage Domains</CardTitle>
              <CardDescription>
                Organize exam content by domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/domains">
                <Button className="w-full" variant="outline">
                  <FolderTree className="mr-2 h-4 w-4" />
                  Manage Domains
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Categories</CardTitle>
              <CardDescription>
                Organize domains into categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/categories">
                <Button className="w-full" variant="outline">
                  <Layers className="mr-2 h-4 w-4" />
                  Manage Categories
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Skills</CardTitle>
              <CardDescription>
                Define skills within categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/skills">
                <Button className="w-full" variant="outline">
                  <Target className="mr-2 h-4 w-4" />
                  Manage Skills
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
