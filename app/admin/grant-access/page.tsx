"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Search, User, CheckCircle2, Trash2 } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type Exam = {
  id: string;
  code: string;
  name: string;
  provider: string;
  isActive: boolean;
};

type UserExamAccess = {
  id: string;
  userId: string;
  examId: string;
  grantedAt: string;
  expiresAt: string | null;
  grantType: string;
  userName: string;
  userEmail: string;
  examCode: string;
  examName: string;
  examProvider: string;
};

export default function GrantAccessPage() {
  // Grant to All Users state
  const [examCode, setExamCode] = useState("AB-900");
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Grant to Specific User state
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [isLoadingGrant, setIsLoadingGrant] = useState(false);
  const [showUserResults, setShowUserResults] = useState(false);

  // Access Records state
  const [accessRecords, setAccessRecords] = useState<UserExamAccess[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // Fetch exams and access records on mount
  useEffect(() => {
    const fetchExams = async () => {
      setIsLoadingExams(true);
      try {
        const response = await fetch("/api/admin/exams");
        if (!response.ok) throw new Error("Failed to fetch exams");
        const data = await response.json();
        setExams(data.filter((exam: Exam) => exam.isActive));
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoadingExams(false);
      }
    };
    fetchExams();
    fetchAccessRecords();
  }, []);

  const fetchAccessRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const response = await fetch("/api/admin/user-exam-access");
      if (!response.ok) throw new Error("Failed to fetch access records");
      const data = await response.json();
      setAccessRecords(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Search users as user types
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setUsers([]);
        return;
      }

      setIsLoadingUsers(true);
      try {
        const response = await fetch(`/api/admin/users?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error("Failed to search users");
        const data = await response.json();
        setUsers(data);
        setShowUserResults(true);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleGrantToAll = async () => {
    setIsLoadingAll(true);
    try {
      const response = await fetch("/api/admin/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to grant access");
      }

      toast.success(data.message);
      fetchAccessRecords(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoadingAll(false);
    }
  };

  const handleGrantToUser = async () => {
    if (!selectedUser || !selectedExamId) {
      toast.error("Please select both a user and an exam");
      return;
    }

    setIsLoadingGrant(true);
    try {
      const exam = exams.find((e) => e.id === selectedExamId);
      const response = await fetch("/api/admin/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examCode: exam?.code,
          userId: selectedUser.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to grant access");
      }

      toast.success(data.message);
      // Reset form
      setSelectedUser(null);
      setSelectedExamId("");
      setSearchQuery("");
      setUsers([]);
      fetchAccessRecords(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoadingGrant(false);
    }
  };

  const handleRevokeAccess = async (accessId: string, userName: string, examName: string) => {
    if (!confirm(`Are you sure you want to revoke access to "${examName}" for ${userName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/user-exam-access?id=${accessId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to revoke access");
      }

      toast.success(data.message);
      fetchAccessRecords(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery(user.email);
    setShowUserResults(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mt-4">Grant Exam Access</h1>
        <p className="text-muted-foreground mt-2">
          Manually grant exam access to users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grant Access to Specific User</CardTitle>
          <CardDescription>
            Search for a user and assign them access to a specific exam
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userSearch">Search User (by email or name)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="userSearch"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedUser(null);
                }}
                onFocus={() => setShowUserResults(true)}
                placeholder="Type to search users..."
                className="pl-10"
              />
              {selectedUser && (
                <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />
              )}
            </div>

            {/* User Search Results */}
            {showUserResults && users.length > 0 && (
              <div className="border rounded-md mt-1 max-h-48 overflow-y-auto bg-background">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full text-left px-4 py-3 hover:bg-muted flex items-start gap-3 border-b last:border-b-0"
                  >
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isLoadingUsers && (
              <p className="text-sm text-muted-foreground">Searching...</p>
            )}

            {searchQuery.length >= 2 && users.length === 0 && !isLoadingUsers && (
              <p className="text-sm text-muted-foreground">No users found</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="examSelect">Select Exam</Label>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger id="examSelect">
                <SelectValue placeholder="Choose an exam" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingExams ? (
                  <SelectItem value="loading" disabled>
                    Loading exams...
                  </SelectItem>
                ) : exams.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No active exams available
                  </SelectItem>
                ) : (
                  exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.code} - {exam.name} ({exam.provider})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGrantToUser}
            disabled={isLoadingGrant || !selectedUser || !selectedExamId}
            className="w-full"
          >
            {isLoadingGrant ? "Granting Access..." : "Grant Access to User"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grant Access to All Users</CardTitle>
          <CardDescription>
            Grant access to all registered users for a specific exam
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="examCode">Exam Code</Label>
            <Input
              id="examCode"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              placeholder="e.g., AB-900"
            />
          </div>

          <Button onClick={handleGrantToAll} disabled={isLoadingAll} className="w-full">
            {isLoadingAll ? "Granting Access..." : "Grant Access to All Users"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current User-Exam Access</CardTitle>
          <CardDescription>
            View and manage all user exam access grants (showing last 100 records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <p className="text-center text-muted-foreground py-8">Loading access records...</p>
          ) : accessRecords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No access records found</p>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Grant Type</TableHead>
                    <TableHead>Granted At</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{record.userName}</span>
                          <span className="text-xs text-muted-foreground">{record.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{record.examCode}</span>
                          <span className="text-xs text-muted-foreground">{record.examName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{record.examProvider}</TableCell>
                      <TableCell>
                        <Badge variant={
                          record.grantType === "auto" ? "secondary" :
                          record.grantType === "manual" ? "default" :
                          "outline"
                        }>
                          {record.grantType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(record.grantedAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {record.expiresAt ? new Date(record.expiresAt).toLocaleDateString() : "Never"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeAccess(record.id, record.userName, record.examName)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
