"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { Plus, Edit, Trash2, List, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

interface Flashcard {
  id: string;
  skillId: string;
  question: string;
  answer: string;
  explanation: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  skill: Skill;
}

interface FlashcardFormData {
  skillId: string;
  question: string;
  answer: string;
  explanation: string;
  order: string;
}

export default function FlashcardsManagementPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [viewingFlashcard, setViewingFlashcard] = useState<Flashcard | null>(null);
  const [formData, setFormData] = useState<FlashcardFormData>({
    skillId: "",
    question: "",
    answer: "",
    explanation: "",
    order: "1",
  });
  const [bulkSkillId, setBulkSkillId] = useState("");
  const [bulkFlashcards, setBulkFlashcards] = useState("");
  const [bulkStartOrder, setBulkStartOrder] = useState("1");

  // Fetch skills for dropdown
  const { data: skills } = useQuery({
    queryKey: ["admin-skills"],
    queryFn: async () => {
      const response = await fetch("/api/admin/skills");
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json() as Promise<Skill[]>;
    },
  });

  // Fetch flashcards
  const { data: flashcards, isLoading, error } = useQuery({
    queryKey: ["admin-flashcards"],
    queryFn: async () => {
      const response = await fetch("/api/admin/flashcards");
      if (!response.ok) throw new Error("Failed to fetch flashcards");
      return response.json() as Promise<Flashcard[]>;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FlashcardFormData) => {
      const response = await fetch("/api/admin/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create flashcard");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Bulk create mutation
  const bulkCreateMutation = useMutation({
    mutationFn: async (flashcards: FlashcardFormData[]) => {
      const results = await Promise.all(
        flashcards.map(async (flashcard) => {
          const response = await fetch("/api/admin/flashcards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(flashcard),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create flashcard");
          }
          return response.json();
        })
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setIsBulkDialogOpen(false);
      resetBulkForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FlashcardFormData & { id: string }) => {
      const response = await fetch("/api/admin/flashcards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update flashcard");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flashcards"] });
      setIsDialogOpen(false);
      resetForm();
      setEditingFlashcard(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/flashcards?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete flashcard");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const resetForm = () => {
    setFormData({
      skillId: "",
      question: "",
      answer: "",
      explanation: "",
      order: "1",
    });
    setEditingFlashcard(null);
  };

  const resetBulkForm = () => {
    setBulkSkillId("");
    setBulkFlashcards("");
    setBulkStartOrder("1");
  };

  const handleOpenDialog = (flashcard?: Flashcard) => {
    if (flashcard) {
      setEditingFlashcard(flashcard);
      setFormData({
        skillId: flashcard.skillId,
        question: flashcard.question,
        answer: flashcard.answer,
        explanation: flashcard.explanation || "",
        order: flashcard.order.toString(),
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleViewFlashcard = (flashcard: Flashcard) => {
    setViewingFlashcard(flashcard);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFlashcard) {
      updateMutation.mutate({ ...formData, id: editingFlashcard.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this flashcard?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkSkillId || !bulkFlashcards.trim()) {
      return;
    }

    // Parse flashcards from textarea
    // Format: Q: question | A: answer | E: explanation (optional)
    const lines = bulkFlashcards
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const flashcardsToCreate: FlashcardFormData[] = [];
    let currentOrder = parseInt(bulkStartOrder);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Simple Q&A format: "Q: question text | A: answer text | E: explanation (optional)"
      if (line.startsWith('Q:')) {
        const parts = line.split('|').map(p => p.trim());
        const question = parts[0].substring(2).trim();
        const answer = parts[1]?.startsWith('A:') ? parts[1].substring(2).trim() : '';
        const explanation = parts[2]?.startsWith('E:') ? parts[2].substring(2).trim() : '';

        if (question && answer) {
          flashcardsToCreate.push({
            skillId: bulkSkillId,
            question,
            answer,
            explanation,
            order: currentOrder.toString(),
          });
          currentOrder++;
        }
      }
    }

    if (flashcardsToCreate.length === 0) {
      alert('No valid flashcards found. Use format: Q: question | A: answer | E: explanation');
      return;
    }

    bulkCreateMutation.mutate(flashcardsToCreate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading flashcards..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load flashcards"
        message={error instanceof Error ? error.message : "Unknown error"}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Flashcards</h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and manage exam flashcards
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => resetBulkForm()}>
                <List className="mr-2 h-4 w-4" />
                Bulk Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Add Flashcards</DialogTitle>
                <DialogDescription>
                  Add multiple flashcards at once. Use format: Q: question | A: answer | E: explanation
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
                      {skills?.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.category.domain.exam.code} - {skill.category.domain.title} - {skill.category.title} - {skill.title}
                        </option>
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
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkFlashcards">Flashcards (one per line)</Label>
                    <Textarea
                      id="bulkFlashcards"
                      value={bulkFlashcards}
                      onChange={(e) => setBulkFlashcards(e.target.value)}
                      placeholder="Q: What is Azure? | A: Microsoft's cloud platform | E: Azure provides IaaS, PaaS, and SaaS&#10;Q: What is a VM? | A: Virtual Machine | E: A virtualized computer system"
                      rows={15}
                      required
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: Q: question | A: answer | E: explanation (explanation is optional)
                    </p>
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
                  <Button
                    type="submit"
                    disabled={bulkCreateMutation.isPending}
                  >
                    {bulkCreateMutation.isPending ? "Creating..." : "Create Flashcards"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Flashcard
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFlashcard ? "Edit Flashcard" : "Create New Flashcard"}</DialogTitle>
                <DialogDescription>
                  {editingFlashcard ? "Update flashcard details" : "Add a new flashcard to a skill"}
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
                      {skills?.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.category.domain.exam.code} - {skill.category.domain.title} - {skill.category.title} - {skill.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="question">Question</Label>
                    <Textarea
                      id="question"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Enter the question..."
                      required
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer</Label>
                    <Textarea
                      id="answer"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="Enter the answer..."
                      required
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="explanation">Explanation (Optional)</Label>
                    <Textarea
                      id="explanation"
                      value={formData.explanation}
                      onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                      placeholder="Enter an explanation or additional context..."
                      rows={3}
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
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingFlashcard ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Flashcards</CardTitle>
          <CardDescription>
            {flashcards?.length || 0} flashcard(s) configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flashcards?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No flashcards found. Click "Add Flashcard" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                flashcards?.map((flashcard) => (
                  <TableRow key={flashcard.id}>
                    <TableCell className="font-medium">{flashcard.order}</TableCell>
                    <TableCell className="max-w-md truncate">{flashcard.question}</TableCell>
                    <TableCell>{flashcard.skill.title}</TableCell>
                    <TableCell>{flashcard.skill.category.title}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {flashcard.skill.category.domain.exam.code}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewFlashcard(flashcard)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDialog(flashcard)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(flashcard.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Flashcard Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Flashcard Details</DialogTitle>
          </DialogHeader>
          {viewingFlashcard && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Skill</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {viewingFlashcard.skill.category.domain.exam.code} - {viewingFlashcard.skill.category.domain.title} - {viewingFlashcard.skill.category.title} - {viewingFlashcard.skill.title}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Question</Label>
                <p className="mt-1 whitespace-pre-wrap">{viewingFlashcard.question}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Answer</Label>
                <p className="mt-1 whitespace-pre-wrap">{viewingFlashcard.answer}</p>
              </div>
              {viewingFlashcard.explanation && (
                <div>
                  <Label className="text-sm font-semibold">Explanation</Label>
                  <p className="mt-1 whitespace-pre-wrap">{viewingFlashcard.explanation}</p>
                </div>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-semibold">Order:</span> {viewingFlashcard.order}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
