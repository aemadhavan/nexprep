import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, exams, userExamAccess, flashcards, skills, categories, domains, userFlashcardProgress } from "@/db/schema";
import { eq, and, or, sql, inArray } from "drizzle-orm";

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

    // Check access
    const access = await db.query.userExamAccess.findFirst({
      where: and(
        eq(userExamAccess.userId, dbUser.id),
        eq(userExamAccess.examId, exam.id)
      ),
    });

    if (!access) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get query params
    const searchParams = req.nextUrl.searchParams;
    const domainId = searchParams.get("domainId");
    const categoryId = searchParams.get("categoryId");
    const skillId = searchParams.get("skillId");
    const status = searchParams.get("status"); // "new", "learning", "known"
    const dueOnly = searchParams.get("dueOnly") === "true";
    const searchQuery = searchParams.get("search");

    // Build query to get flashcards with their skill/category/domain info
    let query = db
      .select({
        flashcard: flashcards,
        skill: skills,
        category: categories,
        domain: domains,
        progress: userFlashcardProgress,
      })
      .from(flashcards)
      .innerJoin(skills, eq(flashcards.skillId, skills.id))
      .innerJoin(categories, eq(skills.categoryId, categories.id))
      .innerJoin(domains, eq(categories.domainId, domains.id))
      .leftJoin(
        userFlashcardProgress,
        and(
          eq(userFlashcardProgress.flashcardId, flashcards.id),
          eq(userFlashcardProgress.userId, dbUser.id)
        )
      )
      .where(eq(domains.examId, exam.id));

    // Apply filters
    const conditions: any[] = [eq(domains.examId, exam.id)];

    if (domainId) {
      conditions.push(eq(domains.id, domainId));
    }

    if (categoryId) {
      conditions.push(eq(categories.id, categoryId));
    }

    if (skillId) {
      conditions.push(eq(skills.id, skillId));
    }

    if (status) {
      if (status === "new") {
        conditions.push(
          or(
            eq(userFlashcardProgress.status, "new"),
            sql`${userFlashcardProgress.id} IS NULL`
          )
        );
      } else {
        conditions.push(eq(userFlashcardProgress.status, status));
      }
    }

    if (dueOnly) {
      conditions.push(
        or(
          sql`${userFlashcardProgress.nextReviewDate} <= NOW()`,
          sql`${userFlashcardProgress.id} IS NULL`
        )
      );
    }

    const results = await db
      .select({
        flashcard: flashcards,
        skill: skills,
        category: categories,
        domain: domains,
        progress: userFlashcardProgress,
      })
      .from(flashcards)
      .innerJoin(skills, eq(flashcards.skillId, skills.id))
      .innerJoin(categories, eq(skills.categoryId, categories.id))
      .innerJoin(domains, eq(categories.domainId, domains.id))
      .leftJoin(
        userFlashcardProgress,
        and(
          eq(userFlashcardProgress.flashcardId, flashcards.id),
          eq(userFlashcardProgress.userId, dbUser.id)
        )
      )
      .where(and(...conditions))
      .orderBy(flashcards.order);

    // Apply search filter in-memory if needed
    let filteredResults = results;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredResults = results.filter(
        (r) =>
          r.flashcard.question.toLowerCase().includes(query) ||
          r.flashcard.answer.toLowerCase().includes(query) ||
          r.flashcard.explanation?.toLowerCase().includes(query)
      );
    }

    // Transform results
    const flashcardsWithProgress = filteredResults.map((r) => ({
      id: r.flashcard.id,
      question: r.flashcard.question,
      answer: r.flashcard.answer,
      explanation: r.flashcard.explanation,
      order: r.flashcard.order,
      skill: {
        id: r.skill.id,
        title: r.skill.title,
      },
      category: {
        id: r.category.id,
        title: r.category.title,
      },
      domain: {
        id: r.domain.id,
        title: r.domain.title,
      },
      progress: r.progress
        ? {
            id: r.progress.id,
            status: r.progress.status,
            easeFactor: r.progress.easeFactor,
            interval: r.progress.interval,
            repetitions: r.progress.repetitions,
            nextReviewDate: r.progress.nextReviewDate,
            lastReviewedAt: r.progress.lastReviewedAt,
          }
        : null,
    }));

    return NextResponse.json({
      flashcards: flashcardsWithProgress,
      total: flashcardsWithProgress.length,
    });
  } catch (error: any) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards", details: error.message },
      { status: 500 }
    );
  }
}
