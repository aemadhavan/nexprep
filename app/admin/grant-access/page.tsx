"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GrantAccessPage() {
  const [examCode, setExamCode] = useState("AB-900");
  const [isLoading, setIsLoading] = useState(false);

  const handleGrantToAll = async () => {
    setIsLoading(true);
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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
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

          <Button onClick={handleGrantToAll} disabled={isLoading}>
            {isLoading ? "Granting Access..." : "Grant Access to All Users"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
