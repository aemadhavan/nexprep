import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { or, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser || clerkUser.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");

    let allUsers;

    if (query) {
      // Search by email or name
      allUsers = await db.query.users.findMany({
        where: or(
          ilike(users.email, `%${query}%`),
          ilike(users.name, `%${query}%`)
        ),
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      });
    } else {
      // Get all users
      allUsers = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      });
    }

    return NextResponse.json(allUsers);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}
