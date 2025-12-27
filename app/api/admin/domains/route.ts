import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { domains, exams } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - List all domains (optionally filter by examId)
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");

    let allDomains;

    if (examId) {
      allDomains = await db.query.domains.findMany({
        where: eq(domains.examId, examId),
        orderBy: (domains, { asc }) => [asc(domains.order)],
        with: {
          exam: true,
        },
      });
    } else {
      allDomains = await db.query.domains.findMany({
        orderBy: (domains, { asc }) => [asc(domains.order)],
        with: {
          exam: true,
        },
      });
    }

    return NextResponse.json(allDomains);
  } catch (error) {
    console.error("Error fetching domains:", error);
    return NextResponse.json(
      { error: "Failed to fetch domains" },
      { status: 500 }
    );
  }
}

// POST - Create new domain
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { examId, title, order } = body;

    // Validation
    if (!examId || !title || order === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify exam exists
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const [newDomain] = await db
      .insert(domains)
      .values({
        examId,
        title,
        order: parseInt(order),
      })
      .returning();

    return NextResponse.json(newDomain, { status: 201 });
  } catch (error) {
    console.error("Error creating domain:", error);
    return NextResponse.json(
      { error: "Failed to create domain" },
      { status: 500 }
    );
  }
}

// PUT - Update domain
export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, examId, title, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Domain ID is required" },
        { status: 400 }
      );
    }

    // If examId is being updated, verify it exists
    if (examId) {
      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
      });

      if (!exam) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      }
    }

    const [updatedDomain] = await db
      .update(domains)
      .set({
        examId,
        title,
        order: order !== undefined ? parseInt(order) : undefined,
      })
      .where(eq(domains.id, id))
      .returning();

    if (!updatedDomain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    return NextResponse.json(updatedDomain);
  } catch (error) {
    console.error("Error updating domain:", error);
    return NextResponse.json(
      { error: "Failed to update domain" },
      { status: 500 }
    );
  }
}

// DELETE - Delete domain
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
        { error: "Domain ID is required" },
        { status: 400 }
      );
    }

    const [deletedDomain] = await db
      .delete(domains)
      .where(eq(domains.id, id))
      .returning();

    if (!deletedDomain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedDomain });
  } catch (error) {
    console.error("Error deleting domain:", error);
    return NextResponse.json(
      { error: "Failed to delete domain" },
      { status: 500 }
    );
  }
}
