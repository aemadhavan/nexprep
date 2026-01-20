import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, userExamAccess, exams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight, Trophy } from "lucide-react";

export default async function DashboardPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Get or create user in database
  let dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUser.id),
  });

  // If user doesn't exist in DB yet (webhook might not have fired), create or update them
  if (!dbUser) {
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || email || "User";

    const [createdUser] = await db
      .insert(users)
      .values({
        clerkId: clerkUser.id,
        email: email,
        name: name,
        role: "user",
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          clerkId: clerkUser.id,
          name: name,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Auto-grant AB-900 if not already granted
    const ab900Exam = await db.query.exams.findFirst({
      where: eq(exams.code, "AB-900"),
    });

    if (ab900Exam) {
      // Check if user already has access to AB-900
      const existingAccess = await db.query.userExamAccess.findFirst({
        where: (access, { and, eq }) =>
          and(
            eq(access.userId, createdUser.id),
            eq(access.examId, ab900Exam.id)
          ),
      });

      // Only grant if they don't already have access
      if (!existingAccess) {
        await db.insert(userExamAccess).values({
          userId: createdUser.id,
          examId: ab900Exam.id,
          grantType: "auto",
        });
      }
    }

    dbUser = createdUser;
  }

  // Get user's accessible exams
  const accessibleExams = await db
    .select({
      exam: exams,
      access: userExamAccess,
    })
    .from(userExamAccess)
    .innerJoin(exams, eq(userExamAccess.examId, exams.id))
    .where(eq(userExamAccess.userId, dbUser.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {dbUser.name}!
            </p>
          </div>

          {/* My Exams */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">My Exams</h2>

            {accessibleExams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No exams yet</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    You don't have access to any exams yet. Contact your administrator to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {accessibleExams.map(({ exam, access }) => (
                  <Card key={exam.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge variant="outline">{exam.provider}</Badge>
                        <Badge>{exam.code}</Badge>
                      </div>
                      <CardTitle className="mt-4">{exam.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {exam.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Phase {exam.phase}
                          </span>
                        </div>
                        {/* TODO: Add progress indicator */}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/exam/${exam.code}`} className="w-full">
                        <Button className="w-full">
                          Practice Test
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
