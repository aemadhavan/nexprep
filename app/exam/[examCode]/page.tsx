import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, exams, userExamAccess, domains, categories, skills } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, ArrowLeft, ClipboardList } from "lucide-react";

export default async function ExamPage({ params }: { params: Promise<{ examCode: string }> }) {
  const { examCode } = await params;
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Get user from DB
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUser.id),
  });

  if (!dbUser) {
    redirect("/dashboard");
  }

  // Get exam
  const exam = await db.query.exams.findFirst({
    where: eq(exams.code, examCode),
  });

  if (!exam) {
    notFound();
  }

  // Check if user has access
  const access = await db.query.userExamAccess.findFirst({
    where: (userExamAccess, { and }) =>
      and(
        eq(userExamAccess.userId, dbUser.id),
        eq(userExamAccess.examId, exam.id)
      ),
  });

  if (!access) {
    redirect("/dashboard");
  }

  // Get exam structure
  const examDomains = await db.query.domains.findMany({
    where: eq(domains.examId, exam.id),
    orderBy: (domains, { asc }) => [asc(domains.order)],
    with: {
      categories: {
        orderBy: (categories, { asc }) => [asc(categories.order)],
        with: {
          skills: {
            orderBy: (skills, { asc }) => [asc(skills.order)],
            with: {
              flashcards: true,
            },
          },
        },
      },
    },
  });

  const totalFlashcards = examDomains.reduce(
    (total, domain) =>
      total +
      domain.categories.reduce(
        (catTotal, category) =>
          catTotal +
          category.skills.reduce(
            (skillTotal, skill) => skillTotal + skill.flashcards.length,
            0
          ),
        0
      ),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Back button */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Exam Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{exam.provider}</Badge>
                    <Badge>{exam.code}</Badge>
                    <Badge variant="secondary">Phase {exam.phase}</Badge>
                  </div>
                  <CardTitle className="text-3xl">{exam.name}</CardTitle>
                  <CardDescription>{exam.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{examDomains.length} Domains</span>
                </div>

              </div>
              <div className="mt-4 flex gap-3">

                <Link href={`/exam/${examCode}/quizzes`}>
                  <Button size="lg" variant="outline">
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Take Quizzes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Exam Structure */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Structure</CardTitle>
              <CardDescription>
                Browse the domains, categories, and skills covered in this exam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="hidden md:block border-2 border-black dark:border-white rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-black dark:bg-white text-white dark:text-black">
                      <th className="px-4 py-3 text-left font-bold border-r border-black dark:border-white">Domain</th>
                      <th className="px-4 py-3 text-left font-bold border-r border-black dark:border-white">Category</th>
                      <th className="px-4 py-3 text-left font-bold">Skills</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examDomains.map((domain, domainIndex) => {
                      const domainSkillCount = domain.categories.reduce(
                        (total, cat) => total + (cat.skills.length || 1),
                        0
                      );

                      return domain.categories.map((category, categoryIndex) => {
                        const categorySkillCount = category.skills.length || 1;
                        const skills = category.skills.length > 0 ? category.skills : [null];

                        return skills.map((skill, skillIndex) => (
                          <tr
                            key={skill ? `${domain.id}-${category.id}-${skill.id}` : `${domain.id}-${category.id}-empty`}
                            className="border-b border-black dark:border-white last:border-b-0 hover:bg-muted/30 transition-colors"
                          >
                            {categoryIndex === 0 && skillIndex === 0 && (
                              <td
                                rowSpan={domainSkillCount}
                                className="px-4 py-3 border-r border-black dark:border-white font-semibold text-base align-top"
                              >
                                {domainIndex + 1}. {domain.title}
                              </td>
                            )}
                            {skillIndex === 0 && (
                              <td
                                rowSpan={categorySkillCount}
                                className="px-4 py-3 border-r border-black dark:border-white text-sm font-medium align-top"
                              >
                                {domainIndex + 1}.{categoryIndex + 1} {category.title}
                              </td>
                            )}
                            <td className="px-4 py-3 text-sm">
                              {skill ? (
                                <div>
                                  {skill.title}

                                </div>
                              ) : (
                                <span className="text-muted-foreground italic">No skills</span>
                              )}
                            </td>
                          </tr>
                        ));
                      });
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {examDomains.map((domain, domainIndex) => (
                  <div key={domain.id} className="border-2 border-black dark:border-white rounded-lg overflow-hidden">
                    <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-3 font-bold">
                      {domainIndex + 1}. {domain.title}
                    </div>
                    <div className="divide-y-2 divide-black dark:divide-white">
                      {domain.categories.map((category, categoryIndex) => (
                        <div key={category.id} className="bg-background">
                          <div className="px-4 py-2 font-medium bg-muted/30 border-b border-black/10 dark:border-white/10">
                            {domainIndex + 1}.{categoryIndex + 1} {category.title}
                          </div>
                          <div className="px-4 py-2 space-y-2">
                            {category.skills.length > 0 ? (
                              category.skills.map((skill) => (
                                <div key={skill.id} className="text-sm pl-2 border-l-2 border-muted-foreground/30">
                                  <span>{skill.title}</span>

                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-muted-foreground italic pl-2">No skills</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
