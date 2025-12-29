import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { quizzes, quizQuestions, quizOptions, exams, domains, categories, skills, userExamAccess, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

    // Fetch quiz with exam information to check access
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

    // Check if user has access to this exam
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

    // Fetch questions with options (WITHOUT correct answer information for security)
    const questions = await db
      .select({
        id: quizQuestions.id,
        questionText: quizQuestions.questionText,
        explanation: quizQuestions.explanation,
        order: quizQuestions.order,
        questionType: quizQuestions.questionType,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.order);

    // Fetch options for all questions
    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await db
          .select({
            id: quizOptions.id,
            optionText: quizOptions.optionText,
            order: quizOptions.order,
            // DO NOT include isCorrect for security
          })
          .from(quizOptions)
          .where(eq(quizOptions.questionId, question.id))
          .orderBy(quizOptions.order);

        return {
          ...question,
          options,
        };
      })
    );

    const response = {
      id: quiz.quiz.id,
      title: quiz.quiz.title,
      description: quiz.quiz.description,
      timeLimit: quiz.quiz.timeLimit,
      passingScore: quiz.quiz.passingScore,
      examCode: quiz.exam.code,
      examName: quiz.exam.name,
      skillTitle: quiz.skill.title,
      questions: questionsWithOptions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}
