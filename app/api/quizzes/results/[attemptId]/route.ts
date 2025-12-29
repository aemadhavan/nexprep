import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  userQuizAttempts,
  userQuizAnswers,
  users,
  quizzes,
  quizQuestions,
  quizOptions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { userId } = await auth();
    console.log('[Results API] Clerk User ID:', userId);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await params;
    console.log('[Results API] Attempt ID:', attemptId);

    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId));

    console.log('[Results API] DB User found:', !!dbUser, dbUser?.id);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch attempt
    const [attempt] = await db
      .select({
        attempt: userQuizAttempts,
        quiz: quizzes,
      })
      .from(userQuizAttempts)
      .innerJoin(quizzes, eq(userQuizAttempts.quizId, quizzes.id))
      .where(
        and(
          eq(userQuizAttempts.id, attemptId),
          eq(userQuizAttempts.userId, dbUser.id)
        )
      );

    console.log('[Results API] Attempt found:', !!attempt);
    if (!attempt) {
      // Let's check if the attempt exists at all
      const [anyAttempt] = await db
        .select()
        .from(userQuizAttempts)
        .where(eq(userQuizAttempts.id, attemptId));
      console.log('[Results API] Attempt exists in DB:', !!anyAttempt, 'User ID match:', anyAttempt?.userId === dbUser.id);

      return NextResponse.json(
        { error: "Attempt not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch answers for this attempt
    const answers = await db
      .select({
        answer: userQuizAnswers,
        question: quizQuestions,
      })
      .from(userQuizAnswers)
      .innerJoin(
        quizQuestions,
        eq(userQuizAnswers.questionId, quizQuestions.id)
      )
      .where(eq(userQuizAnswers.attemptId, attemptId));

    // Fetch options for all questions
    const detailedAnswers = await Promise.all(
      answers.map(async (answerData) => {
        const allOptions = await db
          .select()
          .from(quizOptions)
          .where(eq(quizOptions.questionId, answerData.question.id));

        const selectedOptionIds = JSON.parse(
          answerData.answer.selectedOptionIds
        ) as string[];

        const correctOptionIds = allOptions
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.id);

        return {
          questionId: answerData.question.id,
          questionText: answerData.question.questionText,
          explanation: answerData.question.explanation,
          questionType: answerData.question.questionType,
          order: answerData.question.order,
          selectedOptionIds,
          correctOptionIds,
          isCorrect: answerData.answer.isCorrect,
          timeSpent: answerData.answer.timeSpent,
          options: allOptions.map((opt) => ({
            id: opt.id,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            order: opt.order,
          })),
        };
      })
    );

    // Sort by question order
    detailedAnswers.sort((a, b) => a.order - b.order);

    const response = {
      attemptId: attempt.attempt.id,
      quizId: attempt.quiz.id,
      quizTitle: attempt.quiz.title,
      score: attempt.attempt.score,
      passed: attempt.attempt.passed,
      correctAnswers: attempt.attempt.correctAnswers,
      totalQuestions: attempt.attempt.totalQuestions,
      timeSpent: attempt.attempt.timeSpent,
      attemptNumber: attempt.attempt.attemptNumber,
      passingScore: attempt.quiz.passingScore,
      startedAt: attempt.attempt.startedAt,
      completedAt: attempt.attempt.completedAt,
      detailedAnswers,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
