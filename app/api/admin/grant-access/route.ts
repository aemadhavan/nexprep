import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, exams, userExamAccess } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { examCode, userId } = body;

    if (!examCode) {
      return NextResponse.json(
        { error: "examCode is required" },
        { status: 400 }
      );
    }

    // Get exam
    const exam = await db.query.exams.findFirst({
      where: eq(exams.code, examCode),
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // If userId provided, grant to that user, otherwise grant to all users
    if (userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Check if access already exists
      const existingAccess = await db.query.userExamAccess.findFirst({
        where: (access, { and, eq }) =>
          and(eq(access.userId, user.id), eq(access.examId, exam.id)),
      });

      if (existingAccess) {
        return NextResponse.json({
          message: "User already has access to this exam",
        });
      }

      // Grant access
      await db.insert(userExamAccess).values({
        userId: user.id,
        examId: exam.id,
        grantType: "manual",
      });

      return NextResponse.json({
        message: `Access granted to user ${user.email}`,
      });
    } else {
      // Grant to all users
      const allUsers = await db.query.users.findMany();

      for (const user of allUsers) {
        // Check if access already exists
        const existingAccess = await db.query.userExamAccess.findFirst({
          where: (access, { and, eq }) =>
            and(eq(access.userId, user.id), eq(access.examId, exam.id)),
        });

        if (!existingAccess) {
          await db.insert(userExamAccess).values({
            userId: user.id,
            examId: exam.id,
            grantType: "manual",
          });
        }
      }

      return NextResponse.json({
        message: `Access granted to all ${allUsers.length} users`,
      });
    }
  } catch (error: any) {
    console.error("Error granting access:", error);
    return NextResponse.json(
      { error: "Failed to grant access", details: error.message },
      { status: 500 }
    );
  }
}
