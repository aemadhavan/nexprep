import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { exams, flashcards, users } from "@/db/schema";
import { count } from "drizzle-orm";

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total exams
    const examsCountResult = await db.select({ count: count() }).from(exams);
    const totalExams = examsCountResult[0]?.count || 0;

    // Get total flashcards
    const flashcardsCountResult = await db
      .select({ count: count() })
      .from(flashcards);
    const totalFlashcards = flashcardsCountResult[0]?.count || 0;

    // Get total users
    const usersCountResult = await db.select({ count: count() }).from(users);
    const totalUsers = usersCountResult[0]?.count || 0;

    return NextResponse.json({
      totalExams,
      totalFlashcards,
      totalUsers,
    });
  } catch (error: any) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: error.message },
      { status: 500 }
    );
  }
}
