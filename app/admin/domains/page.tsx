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
import { Plus, Edit, Trash2 } from "lucide-react";
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
  order: number;
  createdAt: string;
  exam: Exam;
}

interface DomainFormData {
  examId: string;
  title: string;
  order: string;
}

export default function DomainsManagementPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState<DomainFormData>({
    examId: "",
    title: "",
    order: "1",
  });

  // Fetch exams for dropdown
  const { data: exams } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const response = await fetch("/api/admin/exams");
      if (!response.ok) throw new Error("Failed to fetch exams");
      return response.json() as Promise<Exam[]>;
    },
  });

  // Fetch domains
  const { data: domains, isLoading, error } = useQuery({
    queryKey: ["admin-domains"],
    queryFn: async () => {
      const response = await fetch("/api/admin/domains");
      if (!response.ok) throw new Error("Failed to fetch domains");
      return response.json() as Promise<Domain[]>;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: DomainFormData) => {
      const response = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create domain");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-domains"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: DomainFormData & { id: string }) => {
      const response = await fetch("/api/admin/domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update domain");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-domains"] });
      setIsDialogOpen(false);
      resetForm();
      setEditingDomain(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/domains?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete domain");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-domains"] });
    },
  });

  const resetForm = () => {
    setFormData({
      examId: "",
      title: "",
      order: "1",
    });
    setEditingDomain(null);
  };

  const handleOpenDialog = (domain?: Domain) => {
    if (domain) {
      setEditingDomain(domain);
      setFormData({
        examId: domain.examId,
        title: domain.title,
        order: domain.order.toString(),
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDomain) {
      updateMutation.mutate({ ...formData, id: editingDomain.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this domain? This will also delete all associated categories, skills, and flashcards.")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading domains..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load domains"
        message={error instanceof Error ? error.message : "Unknown error"}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Domains</h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and manage exam domains
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingDomain ? "Edit Domain" : "Create New Domain"}</DialogTitle>
              <DialogDescription>
                {editingDomain ? "Update domain details" : "Add a new domain to an exam"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="examId">Exam</Label>
                  <select
                    id="examId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.examId}
                    onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                    required
                  >
                    <option value="">Select an exam...</option>
                    {exams?.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.code} - {exam.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Domain Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter domain title..."
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
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingDomain ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Domains</CardTitle>
          <CardDescription>
            {domains?.length || 0} domain(s) configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No domains found. Click "Add Domain" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                domains?.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">{domain.order}</TableCell>
                    <TableCell>{domain.title}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {domain.exam.code} - {domain.exam.name}
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
                          <DropdownMenuItem onClick={() => handleOpenDialog(domain)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(domain.id)}
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
