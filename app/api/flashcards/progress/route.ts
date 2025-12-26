import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, userFlashcardProgress, flashcards } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateNextReview, getUserQualityRating } from "@/lib/spaced-repetition/sm2";

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from DB
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUser.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { flashcardId, rating } = body; // rating: "forgot" | "hard" | "good" | "easy"

    if (!flashcardId || !rating) {
      return NextResponse.json(
        { error: "Missing flashcardId or rating" },
        { status: 400 }
      );
    }

    // Validate rating
    if (!["forgot", "hard", "good", "easy"].includes(rating)) {
      return NextResponse.json(
        { error: "Invalid rating. Must be: forgot, hard, good, or easy" },
        { status: 400 }
      );
    }

    // Check if flashcard exists
    const flashcard = await db.query.flashcards.findFirst({
      where: eq(flashcards.id, flashcardId),
    });

    if (!flashcard) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    // Get existing progress
    const existingProgress = await db.query.userFlashcardProgress.findFirst({
      where: and(
        eq(userFlashcardProgress.userId, dbUser.id),
        eq(userFlashcardProgress.flashcardId, flashcardId)
      ),
    });

    // Convert rating to quality (0-5)
    const quality = getUserQualityRating(rating);

    // Calculate next review using SM-2 algorithm
    const sm2Result = calculateNextReview(
      quality,
      existingProgress?.easeFactor ?? 2.5,
      existingProgress?.interval ?? 0,
      existingProgress?.repetitions ?? 0
    );

    // Determine status based on repetitions
    let status: "new" | "learning" | "known" = "new";
    if (sm2Result.repetitions >= 3) {
      status = "known";
    } else if (sm2Result.repetitions > 0) {
      status = "learning";
    }

    // Update or create progress
    if (existingProgress) {
      const [updated] = await db
        .update(userFlashcardProgress)
        .set({
          status,
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReviewDate: sm2Result.nextReviewDate,
          lastReviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userFlashcardProgress.id, existingProgress.id))
        .returning();

      return NextResponse.json({
        success: true,
        progress: updated,
        message: `Card scheduled for review in ${sm2Result.interval} day(s)`,
      });
    } else {
      const [created] = await db
        .insert(userFlashcardProgress)
        .values({
          userId: dbUser.id,
          flashcardId,
          status,
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReviewDate: sm2Result.nextReviewDate,
          lastReviewedAt: new Date(),
        })
        .returning();

      return NextResponse.json({
        success: true,
        progress: created,
        message: `Card scheduled for review in ${sm2Result.interval} day(s)`,
      });
    }
  } catch (error: any) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress", details: error.message },
      { status: 500 }
    );
  }
}
