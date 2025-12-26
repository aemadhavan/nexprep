import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, exams, userFlashcardProgress, flashcards, skills, categories, domains } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examCode: string }> }
) {
  try {
    const { examCode } = await params;
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from DB
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUser.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get exam
    const exam = await db.query.exams.findFirst({
      where: eq(exams.code, examCode),
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Get total flashcards for this exam
    const totalFlashcardsResult = await db
      .select({ count: count() })
      .from(flashcards)
      .innerJoin(skills, eq(flashcards.skillId, skills.id))
      .innerJoin(categories, eq(skills.categoryId, categories.id))
      .innerJoin(domains, eq(categories.domainId, domains.id))
      .where(eq(domains.examId, exam.id));

    const totalFlashcards = totalFlashcardsResult[0]?.count || 0;

    // Get progress stats
    const progressStats = await db
      .select({
        status: userFlashcardProgress.status,
        count: count(),
      })
      .from(userFlashcardProgress)
      .innerJoin(flashcards, eq(userFlashcardProgress.flashcardId, flashcards.id))
      .innerJoin(skills, eq(flashcards.skillId, skills.id))
      .innerJoin(categories, eq(skills.categoryId, categories.id))
      .innerJoin(domains, eq(categories.domainId, domains.id))
      .where(
        and(
          eq(userFlashcardProgress.userId, dbUser.id),
          eq(domains.examId, exam.id)
        )
      )
      .groupBy(userFlashcardProgress.status);

    // Calculate counts
    const newCount =
      progressStats.find((s) => s.status === "new")?.count || 0;
    const learningCount =
      progressStats.find((s) => s.status === "learning")?.count || 0;
    const knownCount =
      progressStats.find((s) => s.status === "known")?.count || 0;

    const studiedCount = newCount + learningCount + knownCount;
    const notStartedCount = totalFlashcards - studiedCount;

    // Get cards due for review
    const dueCardsResult = await db
      .select({ count: count() })
      .from(userFlashcardProgress)
      .innerJoin(flashcards, eq(userFlashcardProgress.flashcardId, flashcards.id))
      .innerJoin(skills, eq(flashcards.skillId, skills.id))
      .innerJoin(categories, eq(skills.categoryId, categories.id))
      .innerJoin(domains, eq(categories.domainId, domains.id))
      .where(
        and(
          eq(userFlashcardProgress.userId, dbUser.id),
          eq(domains.examId, exam.id),
          sql`${userFlashcardProgress.nextReviewDate} <= NOW()`
        )
      );

    const dueCards = dueCardsResult[0]?.count || 0;

    // Calculate percentages
    const completionPercentage =
      totalFlashcards > 0
        ? Math.round((studiedCount / totalFlashcards) * 100)
        : 0;
    const masteryPercentage =
      totalFlashcards > 0
        ? Math.round((knownCount / totalFlashcards) * 100)
        : 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivityResult = await db
      .select({
        date: sql<string>`DATE(${userFlashcardProgress.lastReviewedAt})`,
        count: count(),
      })
      .from(userFlashcardProgress)
      .innerJoin(flashcards, eq(userFlashcardProgress.flashcardId, flashcards.id))
      .innerJoin(skills, eq(flashcards.skillId, skills.id))
      .innerJoin(categories, eq(skills.categoryId, categories.id))
      .innerJoin(domains, eq(categories.domainId, domains.id))
      .where(
        and(
          eq(userFlashcardProgress.userId, dbUser.id),
          eq(domains.examId, exam.id),
          sql`${userFlashcardProgress.lastReviewedAt} >= ${sevenDaysAgo}`
        )
      )
      .groupBy(sql`DATE(${userFlashcardProgress.lastReviewedAt})`)
      .orderBy(sql`DATE(${userFlashcardProgress.lastReviewedAt})`);

    return NextResponse.json({
      totalFlashcards,
      studied: studiedCount,
      notStarted: notStartedCount,
      new: newCount,
      learning: learningCount,
      known: knownCount,
      dueForReview: dueCards,
      completionPercentage,
      masteryPercentage,
      recentActivity: recentActivityResult,
    });
  } catch (error: any) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress", details: error.message },
      { status: 500 }
    );
  }
}
