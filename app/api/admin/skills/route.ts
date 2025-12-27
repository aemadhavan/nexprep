import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { skills, categories } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - List all skills (optionally filter by categoryId)
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    let allSkills;

    if (categoryId) {
      allSkills = await db.query.skills.findMany({
        where: eq(skills.categoryId, categoryId),
        orderBy: (skills, { asc }) => [asc(skills.order)],
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
      });
    } else {
      allSkills = await db.query.skills.findMany({
        orderBy: (skills, { asc }) => [asc(skills.order)],
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
      });
    }

    return NextResponse.json(allSkills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}

// POST - Create new skill
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, title, order } = body;

    // Validation
    if (!categoryId || !title || order === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const [newSkill] = await db
      .insert(skills)
      .values({
        categoryId,
        title,
        order: parseInt(order),
      })
      .returning();

    return NextResponse.json(newSkill, { status: 201 });
  } catch (error) {
    console.error("Error creating skill:", error);
    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 }
    );
  }
}

// PUT - Update skill
export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, categoryId, title, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Skill ID is required" },
        { status: 400 }
      );
    }

    // If categoryId is being updated, verify it exists
    if (categoryId) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, categoryId),
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    const [updatedSkill] = await db
      .update(skills)
      .set({
        categoryId,
        title,
        order: order !== undefined ? parseInt(order) : undefined,
      })
      .where(eq(skills.id, id))
      .returning();

    if (!updatedSkill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json(updatedSkill);
  } catch (error) {
    console.error("Error updating skill:", error);
    return NextResponse.json(
      { error: "Failed to update skill" },
      { status: 500 }
    );
  }
}

// DELETE - Delete skill
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
        { error: "Skill ID is required" },
        { status: 400 }
      );
    }

    const [deletedSkill] = await db
      .delete(skills)
      .where(eq(skills.id, id))
      .returning();

    if (!deletedSkill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedSkill });
  } catch (error) {
    console.error("Error deleting skill:", error);
    return NextResponse.json(
      { error: "Failed to delete skill" },
      { status: 500 }
    );
  }
}
