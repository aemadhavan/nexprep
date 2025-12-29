import { db } from "../db";
import { userExamAccess } from "../db/schema";
import { sql } from "drizzle-orm";

/**
 * Script to remove duplicate user_exam_access entries
 * Keeps the oldest entry for each user-exam combination
 */
async function cleanupDuplicates() {
  try {
    console.log("🔍 Finding duplicate user_exam_access entries...");

    // Delete duplicates, keeping only the oldest entry for each user-exam pair
    const result = await db.execute(sql`
      DELETE FROM user_exam_access
      WHERE id IN (
        SELECT id
        FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY user_id, exam_id
                   ORDER BY granted_at ASC
                 ) AS row_num
          FROM user_exam_access
        ) t
        WHERE row_num > 1
      )
    `);

    console.log("✅ Cleanup complete!");
    console.log(`Removed duplicate entries.`);

    // Show remaining access records
    const remaining = await db.select().from(userExamAccess);
    console.log(`\n📊 Remaining access records: ${remaining.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error cleaning up duplicates:", error);
    process.exit(1);
  }
}

cleanupDuplicates();
