import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, exams, userExamAccess, quizzes, userQuizAttempts, skills, categories, domains, quizQuestions } from "@/db/schema";
import { eq, and, desc, inArray, count } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examCode: string }> }
) {
  try {
    const { examCode } = await params;
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Get user from DB
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUser.id),
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Get exam
    const exam = await db.query.exams.findFirst({
      where: eq(exams.code, examCode),
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this exam
    const access = await db.query.userExamAccess.findFirst({
      where: and(
        eq(userExamAccess.userId, dbUser.id),
        eq(userExamAccess.examId, exam.id)
      ),
    });

    if (!access) {
      return NextResponse.json(
        { error: "You do not have access to this exam" },
        { status: 403 }
      );
    }

    // Fetch quizzes for this exam using proper joins
    const examQuizzes = await db
      .select({
        quiz: quizzes,
        skill: skills,
        category: categories,
        domain: domains,
      })
      .from(quizzes)
      .innerJoin(skills, eq(quizzes.skillId, skills.id))
      .innerJoin(categories, eq(skills.categoryId, categories.id))
      .innerJoin(domains, eq(categories.domainId, domains.id))
      .where(eq(domains.examId, exam.id));

    // Get question counts for each quiz
    const quizIds = examQuizzes.map((q) => q.quiz.id);
    const questionCounts = quizIds.length > 0
      ? await db
          .select({
            quizId: quizQuestions.quizId,
            count: count(quizQuestions.id),
          })
          .from(quizQuestions)
          .where(inArray(quizQuestions.quizId, quizIds))
          .groupBy(quizQuestions.quizId)
      : [];

    // Get user's quiz attempts
    const userAttempts = await db.query.userQuizAttempts.findMany({
      where: eq(userQuizAttempts.userId, dbUser.id),
      orderBy: [desc(userQuizAttempts.score)],
    });

    // Build quiz list with user stats
    const quizzesWithStats = examQuizzes.map(({ quiz, skill, category, domain }) => {
      const questionCount = questionCounts.find((qc) => qc.quizId === quiz.id)?.count || 0;
      const attempts = userAttempts.filter((a) => a.quizId === quiz.id);
      const bestAttempt = attempts.length > 0 ? attempts[0] : null;

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        questionCount,
        skill: {
          id: skill.id,
          title: skill.title,
        },
        category: {
          id: category.id,
          title: category.title,
        },
        domain: {
          id: domain.id,
          title: domain.title,
        },
        userStats: bestAttempt
          ? {
              attempts: attempts.length,
              bestScore: bestAttempt.score,
              lastAttemptDate: bestAttempt.completedAt,
              passed: bestAttempt.passed,
            }
          : null,
      };
    });

    return NextResponse.json({
      quizzes: quizzesWithStats,
      exam: {
        id: exam.id,
        code: exam.code,
        name: exam.name,
      },
    });
  } catch (error: any) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes", details: error.message },
      { status: 500 }
    );
  }
}
