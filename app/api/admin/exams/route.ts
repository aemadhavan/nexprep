import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { exams } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - List all exams
export async function GET() {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allExams = await db.query.exams.findMany({
      orderBy: (exams, { asc }) => [asc(exams.code)],
    });

    return NextResponse.json(allExams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

// POST - Create new exam
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, provider, description, phase, price, isActive } = body;

    // Validation
    if (!code || !name || !provider || !description || phase === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [newExam] = await db
      .insert(exams)
      .values({
        code,
        name,
        provider,
        description,
        phase: parseInt(phase),
        price: price !== undefined ? parseFloat(price) : 0,
        isActive: isActive !== undefined ? isActive : true,
      })
      .returning();

    return NextResponse.json(newExam, { status: 201 });
  } catch (error: any) {
    console.error("Error creating exam:", error);

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Exam code already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}

// PUT - Update exam
export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, code, name, provider, description, phase, price, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Exam ID is required" },
        { status: 400 }
      );
    }

    const [updatedExam] = await db
      .update(exams)
      .set({
        code,
        name,
        provider,
        description,
        phase: phase !== undefined ? parseInt(phase) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(exams.id, id))
      .returning();

    if (!updatedExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(updatedExam);
  } catch (error) {
    console.error("Error updating exam:", error);
    return NextResponse.json(
      { error: "Failed to update exam" },
      { status: 500 }
    );
  }
}

// DELETE - Delete exam
export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Exam ID is required" },
        { status: 400 }
      );
    }

    const [deletedExam] = await db
      .delete(exams)
      .where(eq(exams.id, id))
      .returning();

    if (!deletedExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedExam });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: "Failed to delete exam" },
      { status: 500 }
    );
  }
}
