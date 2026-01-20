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
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  order: number;
  createdAt: string;
  domain: Domain;
}

interface CategoryFormData {
  domainId: string;
  title: string;
  order: string;
}

export default function CategoriesManagementPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    domainId: "",
    title: "",
    order: "1",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedExam, setSelectedExam] = useState("");

  // Fetch domains for dropdown
  const { data: domains } = useQuery({
    queryKey: ["admin-domains"],
    queryFn: async () => {
      const response = await fetch("/api/admin/domains");
      if (!response.ok) throw new Error("Failed to fetch domains");
      return response.json() as Promise<Domain[]>;
    },
  });

  // Fetch categories
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json() as Promise<Category[]>;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CategoryFormData & { id: string }) => {
      const response = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setIsDialogOpen(false);
      resetForm();
      setEditingCategory(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const resetForm = () => {
    setFormData({
      domainId: "",
      title: "",
      order: "1",
    });
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        domainId: category.domainId,
        title: category.title,
        order: category.order.toString(),
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ ...formData, id: editingCategory.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category? This will also delete all associated skills and flashcards.")) {
      deleteMutation.mutate(id);
    }
  };

  // Derive unique exams from domains
  const uniqueExams = Array.from(new Set(domains?.map(d => JSON.stringify(d.exam)))).map(e => JSON.parse(e) as Exam);

  const filteredCategories = categories?.filter((category) => {
    const matchesSearch = category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.domain.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.domain.exam.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDomain = selectedDomain ? category.domainId === selectedDomain : true;
    const matchesExam = selectedExam ? category.domain.examId === selectedExam : true;

    return matchesSearch && matchesDomain && matchesExam;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading categories..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load categories"
        message={error instanceof Error ? error.message : "Unknown error"}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Categories</h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and manage exam categories
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
              <DialogDescription>
                {editingCategory ? "Update category details" : "Add a new category to a domain"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="domainId">Domain</Label>
                  <select
                    id="domainId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.domainId}
                    onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
                    required
                  >
                    <option value="">Select a domain...</option>
                    {domains?.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.exam.code} - {domain.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Category Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter category title..."
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
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingCategory ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            {categories?.length || 0} category(s) configured
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
                  placeholder="Search categories..."
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
                onChange={(e) => setSelectedDomain(e.target.value)}
              >
                <option value="">All Domains</option>
                {domains
                  ?.filter(d => !selectedExam || d.examId === selectedExam)
                  .map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.title}
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
                <TableHead>Domain</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No categories found. Click "Add Category" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.order}</TableCell>
                    <TableCell>{category.title}</TableCell>
                    <TableCell>{category.domain.title}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {category.domain.exam.code}
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
                          <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(category.id)}
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

      {(createMutation.error || updateMutation.error || deleteMutation.error) && (
        <ErrorMessage
          title="Operation failed"
          message={
            (createMutation.error instanceof Error ? createMutation.error.message : "") ||
            (updateMutation.error instanceof Error ? updateMutation.error.message : "") ||
            (deleteMutation.error instanceof Error ? deleteMutation.error.message : "")
          }
        />
      )}
    </div>
  );
}
