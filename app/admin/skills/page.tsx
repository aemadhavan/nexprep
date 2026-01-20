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
import { Plus, Edit, Trash2, List, Search, Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Exam {
  id: string;
  code: string;
  name: string;
}

interface Domain {
  id: string;
  examId: string;
  title: string;
  exam: Exam;
}

interface Category {
  id: string;
  domainId: string;
  title: string;
  domain: Domain;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [generatingSkill, setGeneratingSkill] = useState<Skill | null>(null);
  const [lastGeneratedSkillId, setLastGeneratedSkillId] = useState<string | null>(null);

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

  // Generate Quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const response = await fetch("/api/admin/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate quiz");
      }
      return response.json();
    },
    onSuccess: (_, skillId) => {
      setGeneratingSkill(null);
      setLastGeneratedSkillId(skillId);
      toast.success("Quiz Generated Successfully", {
        description: "Review the new quiz in the Admin Quizzes page.",
      });
      // Invalidate both lists optionally, though quizzes is most important
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
    },
    onError: (error) => {
      setGeneratingSkill(null);
      toast.error("Quiz Generation Failed", {
        description: error.message,
      });
    },
  });

  // Derive unique exams and domains for filters
  const uniqueExams = Array.from(new Set(categories?.map(c => JSON.stringify(c.domain.exam)))).map(e => JSON.parse(e) as Exam);

  // Filter domains based on selected exam if any
  const filteredDomains = categories?.reduce((acc, category) => {
    if (!selectedExam || category.domain.examId === selectedExam) {
      if (!acc.find(d => d.id === category.domainId)) {
        acc.push(category.domain);
      }
    }
    return acc;
  }, [] as Domain[]);

  // Filter categories based on selected exam/domain if any
  const filteredCategories = categories?.reduce((acc, category) => {
    const domain = category.domain;

    const matchesExam = !selectedExam || domain.examId === selectedExam;
    const matchesDomain = !selectedDomain || domain.id === selectedDomain;

    if (matchesExam && matchesDomain) {
      if (!acc.find(c => c.id === category.id)) {
        acc.push(category);
      }
    }
    return acc;
  }, [] as Category[]);

  const filteredSkills = skills?.filter((skill) => {
    const matchesSearch = skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.category.domain.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.category.domain.exam.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDomain = selectedDomain ? skill.category.domainId === selectedDomain : true;
    const matchesCategory = selectedCategory ? skill.categoryId === selectedCategory : true;
    const matchesExam = selectedExam ? skill.category.domain.examId === selectedExam : true;

    return matchesSearch && matchesDomain && matchesExam && matchesCategory;
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

  const handleGenerateQuiz = (skill: Skill) => {
    setGeneratingSkill(skill);
    generateQuizMutation.mutate(skill.id);
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

          {/* Progress Modal */}
          <Dialog open={!!generatingSkill} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Generating Quiz</DialogTitle>
                <DialogDescription>
                  Please wait while AI generates questions for this skill.
                </DialogDescription>
              </DialogHeader>
              {generatingSkill && (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <LoadingSpinner size="lg" />
                  <div className="text-center space-y-1">
                    <p className="font-medium">{generatingSkill.title}</p>
                    <p className="text-sm text-muted-foreground">{generatingSkill.category.domain.exam.code} / {generatingSkill.category.domain.title}</p>
                  </div>
                </div>
              )}
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
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search skills..."
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
                {uniqueExams?.map((exam) => (
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
                {filteredDomains?.map((domain) => (
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
                {filteredCategories?.map((category) => (
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
                <TableHead>Category</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSkills?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No skills found. Click "Add Skill" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSkills?.map((skill) => (
                  <TableRow
                    key={skill.id}
                    className={skill.id === lastGeneratedSkillId ? "bg-green-50/50" : ""}
                  >
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
                          <DropdownMenuItem onClick={() => handleGenerateQuiz(skill)}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Quiz
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
