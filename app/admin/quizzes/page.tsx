"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { ArrowLeft, Trash2, Clock, Trophy, Plus, List, X, Pencil, Search } from "lucide-react";
import { toast } from "sonner";

interface Skill {
  id: string;
  categoryId: string;
  title: string;
  category: {
    id: string;
    domainId: string;
    title: string;
    domain: {
      id: string;
      examId: string;
      title: string;
      exam: {
        id: string;
        code: string;
        name: string;
      };
    };
  };
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  order: number;
  questionCount: number;
  skill: { id: string; title: string };
  category: { id: string; title: string };
  domain: { id: string; title: string };
  exam: { id: string; code: string; name: string };
}

interface QuizOption {
  optionText: string;
  isCorrect: boolean;
  order: number;
}

interface QuizQuestion {
  questionText: string;
  questionType: "single" | "multiple";
  explanation: string;
  order: number;
  options: QuizOption[];
}

interface QuizFormData {
  skillId: string;
  title: string;
  description: string;
  timeLimit: string;
  passingScore: string;
  order: string;
  questions: QuizQuestion[];
}

export default function QuizzesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuizFormData>({
    skillId: "",
    title: "",
    description: "",
    timeLimit: "",
    passingScore: "70",
    order: "1",
    questions: [],
  });
  const [bulkSkillId, setBulkSkillId] = useState("");
  const [bulkQuizzes, setBulkQuizzes] = useState("");
  const [bulkStartOrder, setBulkStartOrder] = useState("1");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedExam, setSelectedExam] = useState("");

  // Fetch skills for dropdown
  const { data: skills } = useQuery({
    queryKey: ["admin-skills"],
    queryFn: async () => {
      const response = await fetch("/api/admin/skills");
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json() as Promise<Skill[]>;
    },
  });

  // Group skills by exam for better dropdown organization
  const groupedSkills = skills?.reduce((acc, skill) => {
    const examCode = skill.category.domain.exam.code;
    if (!acc[examCode]) {
      acc[examCode] = {
        examName: skill.category.domain.exam.name,
        skills: [],
      };
    }
    acc[examCode].skills.push(skill);
    return acc;
  }, {} as Record<string, { examName: string; skills: Skill[] }>);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-quizzes"],
    queryFn: async () => {
      const response = await fetch("/api/admin/quizzes");
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      return response.json() as Promise<{ quizzes: Quiz[] }>;
    },
  });

  // Derive unique exams and domains for filters
  // We use skills to get the full hierarchy of available options
  const uniqueExams = Array.from(new Set(skills?.map(s => JSON.stringify(s.category.domain.exam)))).map(e => JSON.parse(e));

  // Filter domains based on selected exam if any
  const filteredDomains = skills?.reduce((acc, skill) => {
    const domain = skill.category.domain;
    if (!selectedExam || domain.exam.id === selectedExam) {
      if (!acc.find((d: any) => d.id === domain.id)) {
        acc.push(domain);
      }
    }
    return acc;
  }, [] as any[]);

  // Filter categories based on selected exam/domain if any
  const filteredCategories = skills?.reduce((acc, skill) => {
    const category = skill.category;
    const domain = category.domain;

    const matchesExam = !selectedExam || domain.exam.id === selectedExam;
    const matchesDomain = !selectedDomain || domain.id === selectedDomain;

    if (matchesExam && matchesDomain) {
      if (!acc.find((c: any) => c.id === category.id)) {
        acc.push(category);
      }
    }
    return acc;
  }, [] as any[]);

  const filteredQuizzes = data?.quizzes.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.domain.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.exam.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesExam = selectedExam ? quiz.exam.id === selectedExam : true;
    const matchesDomain = selectedDomain ? quiz.domain.id === selectedDomain : true;
    const matchesCategory = selectedCategory ? quiz.category.id === selectedCategory : true;

    return matchesSearch && matchesExam && matchesDomain && matchesCategory;
  });

  const createMutation = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const response = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create quiz");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success("Quiz created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create quiz", {
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: QuizFormData & { id: string }) => {
      const response = await fetch("/api/admin/quizzes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update quiz");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success("Quiz updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update quiz", {
        description: error.message,
      });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (quizzes: QuizFormData[]) => {
      const results = await Promise.all(
        quizzes.map(async (quiz) => {
          const response = await fetch("/api/admin/quizzes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(quiz),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create quiz");
          }
          return response.json();
        })
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setIsBulkDialogOpen(false);
      resetBulkForm();
      toast.success("Quizzes created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create quizzes", {
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (quizId: string) => {
      const response = await fetch(`/api/admin/quizzes?id=${quizId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete quiz");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Quiz deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete quiz", {
        description: error.message,
      });
    },
  });

  const handleDelete = (quizId: string, quizTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${quizTitle}"? This will also delete all questions and options.`)) {
      deleteMutation.mutate(quizId);
    }
  };

  const resetForm = () => {
    setFormData({
      skillId: "",
      title: "",
      description: "",
      timeLimit: "",
      passingScore: "70",
      order: "1",
      questions: [],
    });
    setEditingQuizId(null);
  };

  const handleEdit = async (quizId: string) => {
    try {
      const response = await fetch(`/api/admin/quizzes?id=${quizId}`);
      if (!response.ok) throw new Error("Failed to fetch quiz details");

      const quiz = await response.json();

      setFormData({
        skillId: quiz.skillId,
        title: quiz.title,
        description: quiz.description || "",
        timeLimit: quiz.timeLimit?.toString() || "",
        passingScore: quiz.passingScore.toString(),
        order: quiz.order.toString(),
        questions: quiz.questions.map((q: any) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          explanation: q.explanation || "",
          order: q.order,
          options: q.options.map((o: any) => ({
            optionText: o.optionText,
            isCorrect: o.isCorrect,
            order: o.order,
          })),
        })),
      });

      setEditingQuizId(quizId);
      setIsDialogOpen(true);
    } catch (error) {
      toast.error("Failed to load quiz", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const resetBulkForm = () => {
    setBulkSkillId("");
    setBulkQuizzes("");
    setBulkStartOrder("1");
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          questionText: "",
          questionType: "single",
          explanation: "",
          order: formData.questions.length + 1,
          options: [
            { optionText: "", isCorrect: false, order: 1 },
            { optionText: "", isCorrect: false, order: 2 },
          ],
        },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options.push({
      optionText: "",
      isCorrect: false,
      order: newQuestions[questionIndex].options.length + 1,
    });
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: keyof QuizOption,
    value: any
  ) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: value,
    };
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.questions.length === 0) {
      toast.error("At least one question is required");
      return;
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      if (question.options.length < 2) {
        toast.error(`Question ${i + 1} must have at least 2 options`);
        return;
      }
      const hasCorrectAnswer = question.options.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        toast.error(`Question ${i + 1} must have at least one correct answer`);
        return;
      }
    }

    if (editingQuizId) {
      updateMutation.mutate({ ...formData, id: editingQuizId });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkSkillId || !bulkQuizzes.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const quizzesToCreate: QuizFormData[] = [];
      let currentOrder = parseInt(bulkStartOrder);

      // Parse JSON
      const parsedQuizzes = JSON.parse(bulkQuizzes);

      if (!Array.isArray(parsedQuizzes)) {
        toast.error("JSON must be an array of quizzes");
        return;
      }

      for (const quiz of parsedQuizzes) {
        if (!quiz.title || !quiz.questions || quiz.questions.length === 0) {
          continue;
        }

        quizzesToCreate.push({
          skillId: bulkSkillId,
          title: quiz.title,
          description: quiz.description || "",
          timeLimit: quiz.timeLimit?.toString() || "",
          passingScore: quiz.passingScore?.toString() || "70",
          order: currentOrder.toString(),
          questions: quiz.questions.map((q: any, qIndex: number) => ({
            questionText: q.questionText,
            questionType: q.questionType || "single",
            explanation: q.explanation || "",
            order: qIndex + 1,
            options: q.options.map((o: any, oIndex: number) => ({
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              order: oIndex + 1,
            })),
          })),
        });
        currentOrder++;
      }

      if (quizzesToCreate.length === 0) {
        toast.error("No valid quizzes found in JSON");
        return;
      }

      bulkCreateMutation.mutate(quizzesToCreate);
    } catch (error) {
      toast.error("Invalid JSON format", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-4">Manage Quizzes</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all quizzes across exams
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => resetBulkForm()}>
                <List className="mr-2 h-4 w-4" />
                Bulk Add (JSON)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Add Quizzes</DialogTitle>
                <DialogDescription>
                  Add multiple quizzes at once using JSON format
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBulkSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkSkillId">Skill</Label>
                    <select
                      id="bulkSkillId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={bulkSkillId}
                      onChange={(e) => setBulkSkillId(e.target.value)}
                      required
                    >
                      <option value="">Select a skill...</option>
                      {groupedSkills && Object.entries(groupedSkills).map(([examCode, group]) => (
                        <optgroup key={examCode} label={`${examCode} - ${group.examName}`}>
                          {group.skills.map((skill) => (
                            <option key={skill.id} value={skill.id}>
                              {skill.category.domain.title} → {skill.category.title} → {skill.title}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkStartOrder">Starting Order Number</Label>
                    <Input
                      id="bulkStartOrder"
                      type="number"
                      value={bulkStartOrder}
                      onChange={(e) => setBulkStartOrder(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkQuizzes">Quizzes (JSON Array)</Label>
                    <Textarea
                      id="bulkQuizzes"
                      value={bulkQuizzes}
                      onChange={(e) => setBulkQuizzes(e.target.value)}
                      placeholder={JSON.stringify([
                        {
                          title: "Sample Quiz",
                          description: "Quiz description",
                          timeLimit: 10,
                          passingScore: 70,
                          questions: [
                            {
                              questionText: "Which are programming languages?",
                              questionType: "multiple",
                              explanation: "JavaScript and Python are programming languages",
                              options: [
                                { optionText: "JavaScript", isCorrect: true },
                                { optionText: "HTML", isCorrect: false },
                                { optionText: "Python", isCorrect: true },
                              ],
                            },
                          ],
                        },
                      ], null, 2)}
                      rows={20}
                      required
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsBulkDialogOpen(false);
                      resetBulkForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={bulkCreateMutation.isPending}>
                    {bulkCreateMutation.isPending ? "Creating..." : "Create Quizzes"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingQuizId ? "Edit Quiz" : "Create New Quiz"}</DialogTitle>
                <DialogDescription>
                  {editingQuizId ? "Update the quiz details, questions, and options" : "Add a new quiz to a skill with questions and options"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="skillId">Skill</Label>
                    <select
                      id="skillId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.skillId}
                      onChange={(e) => setFormData({ ...formData, skillId: e.target.value })}
                      required
                    >
                      <option value="">Select a skill...</option>
                      {groupedSkills && Object.entries(groupedSkills).map(([examCode, group]) => (
                        <optgroup key={examCode} label={`${examCode} - ${group.examName}`}>
                          {group.skills.map((skill) => (
                            <option key={skill.id} value={skill.id}>
                              {skill.category.domain.title} → {skill.category.title} → {skill.title}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Quiz Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Introduction to Azure"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order">Order</Label>
                      <Input
                        id="order"
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the quiz"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit">Time Limit (minutes, optional)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        value={formData.timeLimit}
                        onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                        min="1"
                        placeholder="No limit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passingScore">Passing Score (%)</Label>
                      <Input
                        id="passingScore"
                        type="number"
                        value={formData.passingScore}
                        onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Questions</h3>
                      <Button type="button" onClick={addQuestion} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </div>

                    {formData.questions.map((question, qIndex) => (
                      <Card key={qIndex} className="mb-4">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(qIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Textarea
                              value={question.questionText}
                              onChange={(e) =>
                                updateQuestion(qIndex, "questionText", e.target.value)
                              }
                              placeholder="Enter the question"
                              required
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Question Type</Label>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={question.questionType}
                                onChange={(e) =>
                                  updateQuestion(
                                    qIndex,
                                    "questionType",
                                    e.target.value as "single" | "multiple"
                                  )
                                }
                              >
                                <option value="single">Single Choice</option>
                                <option value="multiple">Multiple Choice</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Explanation (Optional)</Label>
                            <Textarea
                              value={question.explanation}
                              onChange={(e) =>
                                updateQuestion(qIndex, "explanation", e.target.value)
                              }
                              placeholder="Explanation shown after answering"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Options</Label>
                              <Button
                                type="button"
                                onClick={() => addOption(qIndex)}
                                size="sm"
                                variant="outline"
                              >
                                <Plus className="mr-2 h-3 w-3" />
                                Add Option
                              </Button>
                            </div>
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex gap-2 items-center">
                                <Input
                                  value={option.optionText}
                                  onChange={(e) =>
                                    updateOption(qIndex, oIndex, "optionText", e.target.value)
                                  }
                                  placeholder={`Option ${oIndex + 1}`}
                                  required
                                  className="flex-1"
                                />
                                <label className="flex items-center gap-2 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={option.isCorrect}
                                    onChange={(e) =>
                                      updateOption(qIndex, oIndex, "isCorrect", e.target.checked)
                                    }
                                    className="h-4 w-4"
                                  />
                                  <span className="text-sm">Correct</span>
                                </label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(qIndex, oIndex)}
                                  disabled={question.options.length <= 2}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {formData.questions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No questions added yet. Click "Add Question" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingQuizId
                      ? (updateMutation.isPending ? "Updating..." : "Update Quiz")
                      : (createMutation.isPending ? "Creating..." : "Create Quiz")
                    }
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quizzes</CardTitle>
          <CardDescription>
            {data?.quizzes.length || 0} quiz(zes) configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full md:w-[200px]">
              <Label htmlFor="filter-exam" className="sr-only">Filter by Exam</Label>
              <select
                id="filter-exam"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(e.target.value);
                  setSelectedDomain(""); // Reset domain when exam changes
                  setSelectedCategory(""); // Reset category when exam changes
                }}
              >
                <option value="">All Exams</option>
                {uniqueExams?.map((exam: any) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-[200px]">
              <Label htmlFor="filter-domain" className="sr-only">Filter by Domain</Label>
              <select
                id="filter-domain"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedDomain}
                onChange={(e) => {
                  setSelectedDomain(e.target.value);
                  setSelectedCategory(""); // Reset category when domain changes
                }}
              >
                <option value="">All Domains</option>
                {filteredDomains?.map((domain: any) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-[200px]">
              <Label htmlFor="filter-category" className="sr-only">Filter by Category</Label>
              <select
                id="filter-category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {filteredCategories?.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuizzes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No quizzes found. Click "Add Quiz" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuizzes?.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell className="font-medium">{quiz.order}</TableCell>
                    <TableCell>
                      <div className="font-medium">{quiz.title}</div>
                      {quiz.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {quiz.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}
                      </Badge>
                    </TableCell>
                    <TableCell>{quiz.skill.title}</TableCell>
                    <TableCell>{quiz.domain.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{quiz.exam.code}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(quiz.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(quiz.id, quiz.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(createMutation.error || updateMutation.error || deleteMutation.error || bulkCreateMutation.error) && (
        <ErrorMessage
          title="Operation failed"
          message={
            (createMutation.error instanceof Error ? createMutation.error.message : "") ||
            (updateMutation.error instanceof Error ? updateMutation.error.message : "") ||
            (deleteMutation.error instanceof Error ? deleteMutation.error.message : "") ||
            (bulkCreateMutation.error instanceof Error ? bulkCreateMutation.error.message : "")
          }
        />
      )}
    </div>
  );
}
