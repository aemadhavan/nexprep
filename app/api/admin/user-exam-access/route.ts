import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userExamAccess, users, exams } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const examId = searchParams.get("examId");

    // Build query with relations
    const accessRecords = await db
      .select({
        id: userExamAccess.id,
        userId: userExamAccess.userId,
        examId: userExamAccess.examId,
        grantedAt: userExamAccess.grantedAt,
        expiresAt: userExamAccess.expiresAt,
        grantType: userExamAccess.grantType,
        userName: users.name,
        userEmail: users.email,
        examCode: exams.code,
        examName: exams.name,
        examProvider: exams.provider,
      })
      .from(userExamAccess)
      .leftJoin(users, eq(userExamAccess.userId, users.id))
      .leftJoin(exams, eq(userExamAccess.examId, exams.id))
      .orderBy(desc(userExamAccess.grantedAt))
      .limit(100);

    // Filter if needed
    let filteredRecords = accessRecords;

    if (userId) {
      filteredRecords = filteredRecords.filter(r => r.userId === userId);
    }

    if (examId) {
      filteredRecords = filteredRecords.filter(r => r.examId === examId);
    }

    return NextResponse.json(filteredRecords);
  } catch (error: any) {
    console.error("Error fetching user-exam access:", error);
    return NextResponse.json(
      { error: "Failed to fetch access records", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const accessId = searchParams.get("id");

    if (!accessId) {
      return NextResponse.json(
        { error: "Access ID is required" },
        { status: 400 }
      );
    }

    await db.delete(userExamAccess).where(eq(userExamAccess.id, accessId));

    return NextResponse.json({ message: "Access revoked successfully" });
  } catch (error: any) {
    console.error("Error revoking access:", error);
    return NextResponse.json(
      { error: "Failed to revoke access", details: error.message },
      { status: 500 }
    );
  }
}
