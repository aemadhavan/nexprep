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
import { Plus, Edit, Trash2, List } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Category {
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
}

interface Skill {
  id: string;
  categoryId: string;
  title: string;
  order: number;
  createdAt: string;
  category: Category;
}

interface SkillFormData {
  categoryId: string;
  title: string;
  order: string;
}

export default function SkillsManagementPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState<SkillFormData>({
    categoryId: "",
    title: "",
    order: "1",
  });
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkSkills, setBulkSkills] = useState("");
  const [bulkStartOrder, setBulkStartOrder] = useState("1");

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json() as Promise<Category[]>;
    },
  });

  // Fetch skills
  const { data: skills, isLoading, error } = useQuery({
    queryKey: ["admin-skills"],
    queryFn: async () => {
      const response = await fetch("/api/admin/skills");
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json() as Promise<Skill[]>;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SkillFormData) => {
      const response = await fetch("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create skill");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Bulk create mutation
  const bulkCreateMutation = useMutation({
    mutationFn: async (skills: SkillFormData[]) => {
      const results = await Promise.all(
        skills.map(async (skill) => {
          const response = await fetch("/api/admin/skills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(skill),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create skill");
          }
          return response.json();
        })
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      setIsBulkDialogOpen(false);
      resetBulkForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: SkillFormData & { id: string }) => {
      const response = await fetch("/api/admin/skills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update skill");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      setIsDialogOpen(false);
      resetForm();
      setEditingSkill(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/skills?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete skill");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
    },
  });

  const resetForm = () => {
    setFormData({
      categoryId: "",
      title: "",
      order: "1",
    });
    setEditingSkill(null);
  };

  const resetBulkForm = () => {
    setBulkCategoryId("");
    setBulkSkills("");
    setBulkStartOrder("1");
  };

  const handleOpenDialog = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      setFormData({
        categoryId: skill.categoryId,
        title: skill.title,
        order: skill.order.toString(),
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSkill) {
      updateMutation.mutate({ ...formData, id: editingSkill.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this skill? This will also delete all associated flashcards.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkCategoryId || !bulkSkills.trim()) {
      return;
    }

    // Parse skills from textarea (one skill per line)
    const skillTitles = bulkSkills
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (skillTitles.length === 0) {
      return;
    }

    // Create skill objects with incrementing order
    const skillsToCreate: SkillFormData[] = skillTitles.map((title, index) => ({
      categoryId: bulkCategoryId,
      title,
      order: (parseInt(bulkStartOrder) + index).toString(),
    }));

    bulkCreateMutation.mutate(skillsToCreate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading skills..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load skills"
        message={error instanceof Error ? error.message : "Unknown error"}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Skills</h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and manage exam skills
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Add Skills</DialogTitle>
                <DialogDescription>
                  Add multiple skills at once. Enter one skill per line.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBulkSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkCategoryId">Category</Label>
                    <select
                      id="bulkCategoryId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={bulkCategoryId}
                      onChange={(e) => setBulkCategoryId(e.target.value)}
                      required
                    >
                      <option value="">Select a category...</option>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.domain.exam.code} - {category.domain.title} - {category.title}
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
                    <p className="text-xs text-muted-foreground">
                      Skills will be numbered sequentially starting from this number
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkSkills">Skills (one per line)</Label>
                    <Textarea
                      id="bulkSkills"
                      value={bulkSkills}
                      onChange={(e) => setBulkSkills(e.target.value)}
                      placeholder="Enter skill titles, one per line&#10;Example:&#10;Configure Azure services&#10;Implement security features&#10;Deploy applications"
                      rows={10}
                      required
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {bulkSkills.split('\n').filter(line => line.trim().length > 0).length} skill(s) to create
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
                    {bulkCreateMutation.isPending ? "Creating..." : "Create Skills"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Skill
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSkill ? "Edit Skill" : "Create New Skill"}</DialogTitle>
              <DialogDescription>
                {editingSkill ? "Update skill details" : "Add a new skill to a category"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <select
                    id="categoryId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select a category...</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.domain.exam.code} - {category.domain.title} - {category.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Skill Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter skill title..."
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
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingSkill ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Skills</CardTitle>
          <CardDescription>
            {skills?.length || 0} skill(s) configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No skills found. Click "Add Skill" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                skills?.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell className="font-medium">{skill.order}</TableCell>
                    <TableCell>{skill.title}</TableCell>
                    <TableCell>{skill.category.title}</TableCell>
                    <TableCell>{skill.category.domain.title}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {skill.category.domain.exam.code}
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
                          <DropdownMenuItem onClick={() => handleOpenDialog(skill)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(skill.id)}
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
