import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/db";
import { users, userExamAccess, exams } from "@/db/schema";
import { eq } from "drizzle-orm";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook
  const wh = new Webhook(webhookSecret);
  let evt: any;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  const eventType = evt.type;

  if (eventType === "user.created") {
    try {
      const { id, email_addresses, first_name, last_name } = evt.data;

      // Get primary email
      const primaryEmail = email_addresses.find((e: any) => e.id === evt.data.primary_email_address_id);
      const email = primaryEmail?.email_address || email_addresses[0]?.email_address;

      if (!email) {
        return NextResponse.json(
          { error: "No email found for user" },
          { status: 400 }
        );
      }

      // Create user in database
      const [createdUser] = await db
        .insert(users)
        .values({
          clerkId: id,
          email: email,
          name: `${first_name || ""} ${last_name || ""}`.trim() || email,
          role: "user",
        })
        .returning();

      // Find AB-900 exam
      const ab900Exam = await db.query.exams.findFirst({
        where: eq(exams.code, "AB-900"),
      });

      // Auto-grant AB-900 access if exam exists
      if (ab900Exam) {
        await db.insert(userExamAccess).values({
          userId: createdUser.id,
          examId: ab900Exam.id,
          grantType: "auto",
        });

        console.log(`✅ Auto-granted AB-900 access to user: ${email}`);
      } else {
        console.log(`⚠️  AB-900 exam not found, skipping auto-grant for: ${email}`);
      }

      return NextResponse.json({
        success: true,
        message: "User created and AB-900 access granted",
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Failed to create user", details: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
