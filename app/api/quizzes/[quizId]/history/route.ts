import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  userQuizAttempts,
  users,
  quizzes,
  exams,
  domains,
  categories,
  skills,
  userExamAccess,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;

    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId));

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch quiz with exam information to verify access
    const [quiz] = await db
      .select({
        quiz: quizzes,
        skill: skills,
        category: categories,
        domain: domains,
        exam: exams,
      })
      .from(quizzes)
      .innerJoin(skills, eq(quizzes.skillId, skills.id))
      .innerJoin(categories, eq(skills.categoryId, categories.id))
      .innerJoin(domains, eq(categories.domainId, domains.id))
      .innerJoin(exams, eq(domains.examId, exams.id))
      .where(eq(quizzes.id, quizId));

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Verify user has access
    const [access] = await db
      .select()
      .from(userExamAccess)
      .where(
        and(
          eq(userExamAccess.userId, dbUser.id),
          eq(userExamAccess.examId, quiz.exam.id)
        )
      );

    if (!access) {
      return NextResponse.json(
        { error: "You don't have access to this exam" },
        { status: 403 }
      );
    }

    // Fetch all attempts for this quiz by this user
    const attempts = await db
      .select()
      .from(userQuizAttempts)
      .where(
        and(
          eq(userQuizAttempts.userId, dbUser.id),
          eq(userQuizAttempts.quizId, quizId)
        )
      )
      .orderBy(desc(userQuizAttempts.completedAt));

    // Calculate statistics
    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter((a) => a.passed).length;
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;
    const averageScore =
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
        : 0;

    const response = {
      quizId: quiz.quiz.id,
      quizTitle: quiz.quiz.title,
      passingScore: quiz.quiz.passingScore,
      examCode: quiz.exam.code,
      examName: quiz.exam.name,
      skillTitle: quiz.skill.title,
      statistics: {
        totalAttempts,
        passedAttempts,
        bestScore,
        averageScore,
      },
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        passed: attempt.passed,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        timeSpent: attempt.timeSpent,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching quiz history:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz history" },
      { status: 500 }
    );
  }
}
