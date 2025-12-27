import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, exams, userExamAccess, flashcards, skills, categories, domains, userFlashcardProgress } from "@/db/schema";
import { eq, and, or, sql, inArray } from "drizzle-orm";

type FlashcardQueryResult = {
  flashcard: typeof flashcards.$inferSelect;
  skill: typeof skills.$inferSelect;
  category: typeof categories.$inferSelect;
  domain: typeof domains.$inferSelect;
  progress: typeof userFlashcardProgress.$inferSelect | null;
};

async function validateUserAccess(examCode: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUser.id),
  });

  if (!dbUser) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  const exam = await db.query.exams.findFirst({
    where: eq(exams.code, examCode),
  });

  if (!exam) {
    return { error: NextResponse.json({ error: "Exam not found" }, { status: 404 }) };
  }

  const access = await db.query.userExamAccess.findFirst({
    where: and(
      eq(userExamAccess.userId, dbUser.id),
      eq(userExamAccess.examId, exam.id)
    ),
  });

  if (!access) {
    return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  }

  return { dbUser, exam };
}

function buildQueryConditions(
  examId: string,
  filters: {
    domainId?: string | null;
    categoryId?: string | null;
    skillId?: string | null;
    status?: string | null;
    dueOnly?: boolean;
  }
) {
  const conditions: any[] = [eq(domains.examId, examId)];

  if (filters.domainId) {
    conditions.push(eq(domains.id, filters.domainId));
  }

  if (filters.categoryId) {
    conditions.push(eq(categories.id, filters.categoryId));
  }

  if (filters.skillId) {
    conditions.push(eq(skills.id, filters.skillId));
  }

  if (filters.status) {
    if (filters.status === "new") {
      conditions.push(
        or(
          eq(userFlashcardProgress.status, "new"),
          sql`${userFlashcardProgress.id} IS NULL`
        )
      );
    } else {
      conditions.push(eq(userFlashcardProgress.status, filters.status));
    }
  }

  if (filters.dueOnly) {
    conditions.push(
      or(
        sql`${userFlashcardProgress.nextReviewDate} <= NOW()`,
        sql`${userFlashcardProgress.id} IS NULL`
      )
    );
  }

  return conditions;
}

async function fetchFlashcardsWithProgress(userId: string, conditions: any[]) {
  return await db
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
        eq(userFlashcardProgress.userId, userId)
      )
    )
    .where(and(...conditions))
    .orderBy(flashcards.order);
}

function applySearchFilter(results: FlashcardQueryResult[], searchQuery: string | null) {
  if (!searchQuery) return results;

  const query = searchQuery.toLowerCase();
  return results.filter(
    (r) =>
      r.flashcard.question.toLowerCase().includes(query) ||
      r.flashcard.answer.toLowerCase().includes(query) ||
      r.flashcard.explanation?.toLowerCase().includes(query)
  );
}

function transformFlashcardResults(results: FlashcardQueryResult[]) {
  return results.map((r) => ({
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
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examCode: string }> }
) {
  try {
    const { examCode } = await params;
    const validation = await validateUserAccess(examCode);

    if ('error' in validation) {
      return validation.error;
    }

    const { dbUser, exam } = validation;

    const searchParams = req.nextUrl.searchParams;

    const conditions = buildQueryConditions(exam.id, {
      domainId: searchParams.get("domainId"),
      categoryId: searchParams.get("categoryId"),
      skillId: searchParams.get("skillId"),
      status: searchParams.get("status"),
      dueOnly: searchParams.get("dueOnly") === "true",
    });

    const results = await fetchFlashcardsWithProgress(dbUser.id, conditions);
    const filteredResults = applySearchFilter(results, searchParams.get("search"));
    const flashcardsWithProgress = transformFlashcardResults(filteredResults);

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
