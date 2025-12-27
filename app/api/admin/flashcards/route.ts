import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { flashcards, skills } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - List all flashcards (optionally filter by skillId)
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get("skillId");

    let allFlashcards;

    if (skillId) {
      allFlashcards = await db.query.flashcards.findMany({
        where: eq(flashcards.skillId, skillId),
        orderBy: (flashcards, { asc }) => [asc(flashcards.order)],
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
        },
      });
    } else {
      allFlashcards = await db.query.flashcards.findMany({
        orderBy: (flashcards, { asc }) => [asc(flashcards.order)],
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
        },
      });
    }

    return NextResponse.json(allFlashcards);
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}

// POST - Create new flashcard
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { skillId, question, answer, explanation, order } = body;

    // Validation
    if (!skillId || !question || !answer || order === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify skill exists
    const skill = await db.query.skills.findFirst({
      where: eq(skills.id, skillId),
    });

    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }

    const [newFlashcard] = await db
      .insert(flashcards)
      .values({
        skillId,
        question,
        answer,
        explanation: explanation || null,
        order: parseInt(order),
      })
      .returning();

    return NextResponse.json(newFlashcard, { status: 201 });
  } catch (error) {
    console.error("Error creating flashcard:", error);
    return NextResponse.json(
      { error: "Failed to create flashcard" },
      { status: 500 }
    );
  }
}

// PUT - Update flashcard
export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, skillId, question, answer, explanation, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Flashcard ID is required" },
        { status: 400 }
      );
    }

    // If skillId is being updated, verify it exists
    if (skillId) {
      const skill = await db.query.skills.findFirst({
        where: eq(skills.id, skillId),
      });

      if (!skill) {
        return NextResponse.json(
          { error: "Skill not found" },
          { status: 404 }
        );
      }
    }

    const [updatedFlashcard] = await db
      .update(flashcards)
      .set({
        skillId,
        question,
        answer,
        explanation: explanation || null,
        order: order !== undefined ? parseInt(order) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(flashcards.id, id))
      .returning();

    if (!updatedFlashcard) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    return NextResponse.json(updatedFlashcard);
  } catch (error) {
    console.error("Error updating flashcard:", error);
    return NextResponse.json(
      { error: "Failed to update flashcard" },
      { status: 500 }
    );
  }
}

// DELETE - Delete flashcard
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
        { error: "Flashcard ID is required" },
        { status: 400 }
      );
    }

    const [deletedFlashcard] = await db
      .delete(flashcards)
      .where(eq(flashcards.id, id))
      .returning();

    if (!deletedFlashcard) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedFlashcard });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    return NextResponse.json(
      { error: "Failed to delete flashcard" },
      { status: 500 }
    );
  }
}
