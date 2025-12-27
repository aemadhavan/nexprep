import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { categories, domains } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - List all categories (optionally filter by domainId)
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");

    let allCategories;

    if (domainId) {
      allCategories = await db.query.categories.findMany({
        where: eq(categories.domainId, domainId),
        orderBy: (categories, { asc }) => [asc(categories.order)],
        with: {
          domain: {
            with: {
              exam: true,
            },
          },
        },
      });
    } else {
      allCategories = await db.query.categories.findMany({
        orderBy: (categories, { asc }) => [asc(categories.order)],
        with: {
          domain: {
            with: {
              exam: true,
            },
          },
        },
      });
    }

    return NextResponse.json(allCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { domainId, title, order } = body;

    // Validation
    if (!domainId || !title || order === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify domain exists
    const domain = await db.query.domains.findFirst({
      where: eq(domains.id, domainId),
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        domainId,
        title,
        order: parseInt(order),
      })
      .returning();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || user.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, domainId, title, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // If domainId is being updated, verify it exists
    if (domainId) {
      const domain = await db.query.domains.findFirst({
        where: eq(domains.id, domainId),
      });

      if (!domain) {
        return NextResponse.json(
          { error: "Domain not found" },
          { status: 404 }
        );
      }
    }

    const [updatedCategory] = await db
      .update(categories)
      .set({
        domainId,
        title,
        order: order !== undefined ? parseInt(order) : undefined,
      })
      .where(eq(categories.id, id))
      .returning();

    if (!updatedCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
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
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const [deletedCategory] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    if (!deletedCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedCategory });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
