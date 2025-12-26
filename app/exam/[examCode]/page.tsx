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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Play, ArrowLeft } from "lucide-react";

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
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{totalFlashcards} Flashcards</span>
                </div>
              </div>
              <div className="mt-4">
                <Link href={`/exam/${examCode}/flashcards`}>
                  <Button size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Start Studying
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
              <Accordion type="multiple" className="w-full">
                {examDomains.map((domain, domainIndex) => (
                  <AccordionItem key={domain.id} value={`domain-${domain.id}`}>
                    <AccordionTrigger className="text-left">
                      <span className="font-semibold">
                        {domainIndex + 1}. {domain.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-4">
                        {domain.categories.map((category, categoryIndex) => (
                          <Accordion key={category.id} type="multiple">
                            <AccordionItem value={`category-${category.id}`}>
                              <AccordionTrigger className="text-left text-sm">
                                {domainIndex + 1}.{categoryIndex + 1} {category.title}
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-1 pl-4">
                                  {category.skills.map((skill) => (
                                    <li key={skill.id} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="mt-1">•</span>
                                      <span className="flex-1">
                                        {skill.title}
                                        <span className="ml-2 text-xs">
                                          ({skill.flashcards.length} cards)
                                        </span>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
