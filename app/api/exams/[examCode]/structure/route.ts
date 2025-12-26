import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exams, domains, categories, skills } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examCode: string }> }
) {
  try {
    const { examCode } = await params;

    // Get exam
    const exam = await db.query.exams.findFirst({
      where: eq(exams.code, examCode),
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Get all domains
    const allDomains = await db.query.domains.findMany({
      where: eq(domains.examId, exam.id),
      orderBy: (domains, { asc }) => [asc(domains.order)],
    });

    // Get all categories
    const allCategories = await db
      .select({
        id: categories.id,
        title: categories.title,
        domainId: categories.domainId,
      })
      .from(categories)
      .innerJoin(domains, eq(categories.domainId, domains.id))
      .where(eq(domains.examId, exam.id))
      .orderBy(categories.order);

    // Get all skills
    const allSkills = await db
      .select({
        id: skills.id,
        title: skills.title,
        categoryId: skills.categoryId,
      })
      .from(skills)
      .innerJoin(categories, eq(skills.categoryId, categories.id))
      .innerJoin(domains, eq(categories.domainId, domains.id))
      .where(eq(domains.examId, exam.id))
      .orderBy(skills.order);

    return NextResponse.json({
      domains: allDomains.map((d) => ({ id: d.id, title: d.title })),
      categories: allCategories,
      skills: allSkills,
    });
  } catch (error: any) {
    console.error("Error fetching exam structure:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam structure", details: error.message },
      { status: 500 }
    );
  }
}
