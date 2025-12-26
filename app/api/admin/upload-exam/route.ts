import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { exams, domains, categories, skills, flashcards } from "@/db/schema";
import { examUploadPayloadSchema } from "@/lib/schemas/upload-schema";

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = examUploadPayloadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data format",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if exam already exists
    const existingExam = await db.query.exams.findFirst({
      where: (exams, { eq }) => eq(exams.code, data.exam.code),
    });

    if (existingExam) {
      return NextResponse.json(
        { error: `Exam with code ${data.exam.code} already exists` },
        { status: 409 }
      );
    }

    // Create exam and all related content in a transaction-like sequence
    let totalFlashcards = 0;

    // 1. Create exam
    const [createdExam] = await db
      .insert(exams)
      .values({
        code: data.exam.code,
        name: data.exam.name,
        provider: data.exam.provider,
        description: data.exam.description,
        phase: data.exam.phase,
        price: data.exam.price,
        isActive: true,
      })
      .returning();

    // 2. Process domains
    for (const domainData of data.domains) {
      const [createdDomain] = await db
        .insert(domains)
        .values({
          examId: createdExam.id,
          title: domainData.title,
          order: domainData.order,
        })
        .returning();

      // 3. Process categories
      for (const categoryData of domainData.categories) {
        const [createdCategory] = await db
          .insert(categories)
          .values({
            domainId: createdDomain.id,
            title: categoryData.title,
            order: categoryData.order,
          })
          .returning();

        // 4. Process skills
        for (const skillData of categoryData.skills) {
          const [createdSkill] = await db
            .insert(skills)
            .values({
              categoryId: createdCategory.id,
              title: skillData.title,
              order: skillData.order,
            })
            .returning();

          // 5. Process flashcards
          if (skillData.flashcards && skillData.flashcards.length > 0) {
            const flashcardValues = skillData.flashcards.map((fc, index) => ({
              skillId: createdSkill.id,
              question: fc.question,
              answer: fc.answer,
              explanation: fc.explanation || null,
              order: index + 1,
            }));

            await db.insert(flashcards).values(flashcardValues);
            totalFlashcards += flashcardValues.length;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Exam content uploaded successfully",
      exam: {
        id: createdExam.id,
        code: createdExam.code,
        name: createdExam.name,
      },
      stats: {
        totalDomains: data.domains.length,
        totalFlashcards,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload exam content",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
