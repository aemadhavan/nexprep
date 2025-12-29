"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { Upload, CheckCircle, FileJson } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationPreview, setValidationPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith(".json")) {
      setError("Please select a valid JSON file");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Parse and preview JSON
    try {
      const text = await selectedFile.text();
      const json = JSON.parse(text);
      setValidationPreview(json);
    } catch (err) {
      setError("Invalid JSON format. Please check your file.");
      setFile(null);
      setValidationPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !validationPreview) return;

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/upload-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationPreview),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast.success("Exam uploaded successfully!", {
        description: `${data.exam.name} (${data.exam.code}) with ${data.stats.totalFlashcards} flashcards and ${data.stats.totalQuizzes} quizzes`,
      });

      // Reset form
      setFile(null);
      setValidationPreview(null);

      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to upload exam content");
      toast.error("Upload failed", {
        description: err.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getPreviewStats = () => {
    if (!validationPreview) return null;

    const domainCount = validationPreview.domains?.length || 0;
    const categoryCount = validationPreview.domains?.reduce(
      (acc: number, d: any) => acc + (d.categories?.length || 0),
      0
    ) || 0;
    const skillCount = validationPreview.domains?.reduce(
      (acc: number, d: any) =>
        acc + d.categories?.reduce((a: number, c: any) => a + (c.skills?.length || 0), 0),
      0
    ) || 0;
    const flashcardCount = validationPreview.domains?.reduce(
      (acc: number, d: any) =>
        acc +
        d.categories?.reduce(
          (a: number, c: any) =>
            a +
            c.skills?.reduce((s: number, sk: any) => s + (sk.flashcards?.length || 0), 0),
          0
        ),
      0
    ) || 0;
    const quizCount = validationPreview.domains?.reduce(
      (acc: number, d: any) =>
        acc +
        d.categories?.reduce(
          (a: number, c: any) =>
            a +
            c.skills?.reduce((s: number, sk: any) => s + (sk.quizzes?.length || 0), 0),
          0
        ),
      0
    ) || 0;

    return { domainCount, categoryCount, skillCount, flashcardCount, quizCount };
  };

  const stats = getPreviewStats();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Exam Content</h1>
        <p className="text-muted-foreground mt-2">
          Upload a JSON file containing exam structure and flashcards
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select JSON File</CardTitle>
          <CardDescription>
            Choose a JSON file structured according to the exam upload schema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">JSON File</Label>
            <Input
              id="file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {error && <ErrorMessage message={error} />}

          {validationPreview && !error && (
            <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">JSON validated successfully</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Exam Details:</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">Code:</dt>
                  <dd className="font-medium">{validationPreview.exam?.code}</dd>

                  <dt className="text-muted-foreground">Name:</dt>
                  <dd className="font-medium">{validationPreview.exam?.name}</dd>

                  <dt className="text-muted-foreground">Provider:</dt>
                  <dd className="font-medium">{validationPreview.exam?.provider}</dd>

                  <dt className="text-muted-foreground">Phase:</dt>
                  <dd className="font-medium">{validationPreview.exam?.phase}</dd>
                </dl>
              </div>

              {stats && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Content Summary:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-background rounded p-3 text-center">
                      <div className="text-2xl font-bold">{stats.domainCount}</div>
                      <div className="text-xs text-muted-foreground">Domains</div>
                    </div>
                    <div className="bg-background rounded p-3 text-center">
                      <div className="text-2xl font-bold">{stats.categoryCount}</div>
                      <div className="text-xs text-muted-foreground">Categories</div>
                    </div>
                    <div className="bg-background rounded p-3 text-center">
                      <div className="text-2xl font-bold">{stats.skillCount}</div>
                      <div className="text-xs text-muted-foreground">Skills</div>
                    </div>
                    <div className="bg-background rounded p-3 text-center">
                      <div className="text-2xl font-bold text-primary">{stats.flashcardCount}</div>
                      <div className="text-xs text-muted-foreground">Flashcards</div>
                    </div>
                    <div className="bg-background rounded p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.quizCount}</div>
                      <div className="text-xs text-muted-foreground">Quizzes</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!file || !validationPreview || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload Exam"}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/admin")}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Expected JSON Format
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
            {`{
  "exam": {
    "code": "AB-900",
    "name": "Copilot & Agent Administration Fundamentals",
    "provider": "Microsoft",
    "description": "...",
    "phase": 1,
    "price": 0
  },
  "domains": [
    {
      "title": "Domain Title",
      "order": 1,
      "categories": [
        {
          "title": "Category Title",
          "order": 1,
          "skills": [
            {
              "title": "Skill Title",
              "order": 1,
              "flashcards": [
                {
                  "question": "Question text?",
                  "answer": "Answer text",
                  "explanation": "Optional explanation"
                }
              ],
              "quizzes": [
                {
                  "title": "Practice Quiz",
                  "description": "Test your knowledge",
                  "timeLimit": 15,
                  "passingScore": 70,
                  "order": 1,
                  "questions": [
                    {
                      "questionText": "Which are correct?",
                      "questionType": "multiple",
                      "explanation": "Explanation here",
                      "order": 1,
                      "options": [
                        { "optionText": "Option A", "isCorrect": true, "order": 1 },
                        { "optionText": "Option B", "isCorrect": false, "order": 2 }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
