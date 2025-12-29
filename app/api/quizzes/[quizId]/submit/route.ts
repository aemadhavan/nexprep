import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  quizzes,
  quizQuestions,
  quizOptions,
  userQuizAttempts,
  userQuizAnswers,
  users,
  exams,
  domains,
  categories,
  skills,
  userExamAccess,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

interface SubmitQuizRequest {
  answers: {
    questionId: string;
    selectedOptionIds: string[];
    timeSpent: number;
  }[];
  totalTimeSpent: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;
    const body: SubmitQuizRequest = await request.json();

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

    // Fetch all questions with their correct answers
    const questions = await db
      .select({
        id: quizQuestions.id,
        questionText: quizQuestions.questionText,
        explanation: quizQuestions.explanation,
        questionType: quizQuestions.questionType,
        order: quizQuestions.order,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.order);

    // Fetch correct answers for all questions
    const questionsWithCorrectAnswers = await Promise.all(
      questions.map(async (question) => {
        const allOptions = await db
          .select()
          .from(quizOptions)
          .where(eq(quizOptions.questionId, question.id))
          .orderBy(quizOptions.order);

        const correctOptionIds = allOptions
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.id);

        return {
          ...question,
          correctOptionIds,
          allOptions,
        };
      })
    );

    // Score the quiz
    let correctAnswers = 0;
    const scoredAnswers = body.answers.map((userAnswer) => {
      const question = questionsWithCorrectAnswers.find(
        (q) => q.id === userAnswer.questionId
      );

      if (!question) {
        return {
          ...userAnswer,
          isCorrect: false,
        };
      }

      // Check if answer is correct
      const userSelectedSet = new Set(userAnswer.selectedOptionIds);
      const correctSet = new Set(question.correctOptionIds);

      const isCorrect =
        userSelectedSet.size === correctSet.size &&
        [...userSelectedSet].every((id) => correctSet.has(id));

      if (isCorrect) {
        correctAnswers++;
      }

      return {
        ...userAnswer,
        isCorrect,
      };
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= quiz.quiz.passingScore;

    // Get attempt number
    const previousAttempts = await db
      .select()
      .from(userQuizAttempts)
      .where(
        and(
          eq(userQuizAttempts.userId, dbUser.id),
          eq(userQuizAttempts.quizId, quizId)
        )
      )
      .orderBy(desc(userQuizAttempts.attemptNumber));

    const attemptNumber = previousAttempts.length > 0
      ? previousAttempts[0].attemptNumber + 1
      : 1;

    // Save attempt
    const [attempt] = await db
      .insert(userQuizAttempts)
      .values({
        userId: dbUser.id,
        quizId: quizId,
        score,
        totalQuestions,
        correctAnswers,
        timeSpent: body.totalTimeSpent,
        passed,
        attemptNumber,
        startedAt: new Date(Date.now() - body.totalTimeSpent * 1000),
        completedAt: new Date(),
      })
      .returning();

    // Save individual answers
    await db.insert(userQuizAnswers).values(
      scoredAnswers.map((answer) => ({
        attemptId: attempt.id,
        questionId: answer.questionId,
        selectedOptionIds: JSON.stringify(answer.selectedOptionIds),
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent,
      }))
    );

    // Return results with detailed information
    const detailedResults = scoredAnswers.map((answer) => {
      const question = questionsWithCorrectAnswers.find(
        (q) => q.id === answer.questionId
      );

      return {
        questionId: answer.questionId,
        questionText: question?.questionText || "",
        explanation: question?.explanation || null,
        selectedOptionIds: answer.selectedOptionIds,
        correctOptionIds: question?.correctOptionIds || [],
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent,
        options: question?.allOptions || [],
      };
    });

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      passed,
      correctAnswers,
      totalQuestions,
      timeSpent: body.totalTimeSpent,
      attemptNumber,
      passingScore: quiz.quiz.passingScore,
      detailedResults,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
