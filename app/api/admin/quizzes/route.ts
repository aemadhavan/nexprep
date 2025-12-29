import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { quizzes, quizQuestions, quizOptions, skills } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("id");

    // If quizId is provided, fetch a single quiz with full details
    if (quizId) {
      const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.id, quizId),
        with: {
          skill: {
            with: {
              category: {
                with: {
                  domain: {
                    with: {
                      exam: true,
                    },
                  },
                },
              },
            },
          },
          questions: {
            orderBy: (questions, { asc }) => [asc(questions.order)],
            with: {
              options: {
                orderBy: (options, { asc }) => [asc(options.order)],
              },
            },
          },
        },
      });

      if (!quiz) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }

      return NextResponse.json(quiz);
    }

    // Fetch all quizzes with nested skill/category/domain/exam data
    const allQuizzes = await db.query.quizzes.findMany({
      orderBy: [desc(quizzes.createdAt)],
      with: {
        skill: {
          with: {
            category: {
              with: {
                domain: {
                  with: {
                    exam: true,
                  },
                },
              },
            },
          },
        },
        questions: {
          with: {
            options: true,
          },
        },
      },
    });

    // Transform the data for easier consumption
    const transformedQuizzes = allQuizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      order: quiz.order,
      questionCount: quiz.questions.length,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      skill: {
        id: quiz.skill.id,
        title: quiz.skill.title,
      },
      category: {
        id: quiz.skill.category.id,
        title: quiz.skill.category.title,
      },
      domain: {
        id: quiz.skill.category.domain.id,
        title: quiz.skill.category.domain.title,
      },
      exam: {
        id: quiz.skill.category.domain.exam.id,
        code: quiz.skill.category.domain.exam.code,
        name: quiz.skill.category.domain.exam.name,
      },
    }));

    return NextResponse.json({ quizzes: transformedQuizzes });
  } catch (error: any) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { skillId, title, description, timeLimit, passingScore, order, questions } = body;

    // Validation
    if (!skillId || !title || passingScore === undefined || order === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required" },
        { status: 400 }
      );
    }

    // Verify skill exists
    const skill = await db.query.skills.findFirst({
      where: eq(skills.id, skillId),
    });

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Create quiz
    const [newQuiz] = await db
      .insert(quizzes)
      .values({
        skillId,
        title,
        description: description || null,
        timeLimit: timeLimit || null,
        passingScore: parseInt(passingScore),
        order: parseInt(order),
      })
      .returning();

    // Create questions and options
    for (const question of questions) {
      const [newQuestion] = await db
        .insert(quizQuestions)
        .values({
          quizId: newQuiz.id,
          questionText: question.questionText,
          questionType: question.questionType,
          explanation: question.explanation || null,
          order: question.order,
        })
        .returning();

      // Create options for this question
      if (question.options && question.options.length > 0) {
        await db.insert(quizOptions).values(
          question.options.map((option: any) => ({
            questionId: newQuestion.id,
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            order: option.order,
          }))
        );
      }
    }

    return NextResponse.json(newQuiz, { status: 201 });
  } catch (error: any) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, skillId, title, description, timeLimit, passingScore, order, questions } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Quiz ID is required" },
        { status: 400 }
      );
    }

    // Verify skill exists if being updated
    if (skillId) {
      const skill = await db.query.skills.findFirst({
        where: eq(skills.id, skillId),
      });

      if (!skill) {
        return NextResponse.json({ error: "Skill not found" }, { status: 404 });
      }
    }

    // Update quiz
    const [updatedQuiz] = await db
      .update(quizzes)
      .set({
        skillId,
        title,
        description: description || null,
        timeLimit: timeLimit || null,
        passingScore: passingScore !== undefined ? parseInt(passingScore) : undefined,
        order: order !== undefined ? parseInt(order) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(quizzes.id, id))
      .returning();

    if (!updatedQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // If questions are provided, replace all questions
    if (questions && questions.length > 0) {
      // Delete existing questions (cascade will delete options)
      await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));

      // Create new questions and options
      for (const question of questions) {
        const [newQuestion] = await db
          .insert(quizQuestions)
          .values({
            quizId: id,
            questionText: question.questionText,
            questionType: question.questionType,
            explanation: question.explanation || null,
            order: question.order,
          })
          .returning();

        // Create options for this question
        if (question.options && question.options.length > 0) {
          await db.insert(quizOptions).values(
            question.options.map((option: any) => ({
              questionId: newQuestion.id,
              optionText: option.optionText,
              isCorrect: option.isCorrect,
              order: option.order,
            }))
          );
        }
      }
    }

    return NextResponse.json(updatedQuiz);
  } catch (error: any) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { error: "Failed to update quiz", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Check if user is admin
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("id");

    if (!quizId) {
      return NextResponse.json(
        { error: "Quiz ID is required" },
        { status: 400 }
      );
    }

    // Delete quiz (cascade will delete questions and options)
    await db.delete(quizzes).where(eq(quizzes.id, quizId));

    return NextResponse.json({ success: true, message: "Quiz deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz", details: error.message },
      { status: 500 }
    );
  }
}
