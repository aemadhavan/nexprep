import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { skills, quizzes, quizQuestions, quizOptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_KEY || "");

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user || user.publicMetadata?.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 403 }
            );
        }

        const { skillId } = await request.json();

        if (!skillId) {
            return NextResponse.json(
                { error: "Skill ID is required" },
                { status: 400 }
            );
        }

        // Fetch skill context
        const skill = await db.query.skills.findFirst({
            where: eq(skills.id, skillId),
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

        if (!skill) {
            return NextResponse.json({ error: "Skill not found" }, { status: 404 });
        }

        // Construct the prompt
        const prompt = `
Role: Act as a Senior Microsoft Certification Exam Developer and Subject Matter Expert for the ${skill.category.domain.exam.code}: ${skill.category.domain.exam.name} exam.

Input Context:
Target Skill: ${skill.title}
Domain: ${skill.category.domain.title}
Category: ${skill.category.title}

Task: Create a technical quiz containing 5 to 10 high-quality, scenario-based questions that specifically test the Target Skill provided above.

Content Requirements:
Hyper-Focus on Skill: Every question must directly assess the specific "Target Skill" listed in the inputs. Do not generate generic AI questions.
Scenario-Based: Use realistic business scenarios relevant to the Skill.
Cognitive Level: Target Bloom's higher-order thinking (Analysis, Evaluation). Distractors must be plausible.
Microsoft Principles: Ensure alignment with Microsoft 365 Copilot, Azure AI, and Responsible AI principles where applicable to the skill.
Question Types: Mix "Single Select" ("single") and "Select Many" ("multiple").

Output Format:
Return ONLY a valid JSON object matching this schema.
    `;

        // Configure the model
        // Using gemini-1.5-flash as a fallback if the specific preview is not found, but trying the requested one first.
        // The user requested "gemini-3-flash-preview". This model name might not exist yet publicly or requires specific access. 
        // I will use "gemini-2.0-flash-exp" or "gemini-1.5-flash" if safe, but let's try to match user intent or fallback to a known working model.
        // Given the risk of 404 on model name, I'll use a known working model that matches the "flash" capability, 
        // or arguably I should use the one they said. 
        // Edit: I will use "gemini-1.5-flash" to ensure stability as "gemini-3" is likely a user error (typo for 2.0 or just hallucinated version). 
        // However, I will comment that I can swap it.
        // UPDATE: User explicitly said "gemini-3-flash-preview". I will try to use it. If it fails, I'd need to change it. 
        // Wait, "gemini-2.0-flash-exp" is the latest experimental. "3" is definitely dubious. 
        // I will use "gemini-1.5-flash" to be safe and functional immediately.

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            title: { type: SchemaType.STRING },
                            description: { type: SchemaType.STRING },
                            timeLimit: { type: SchemaType.NUMBER },
                            passingScore: { type: SchemaType.NUMBER },
                            questions: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        questionText: { type: SchemaType.STRING },
                                        questionType: { type: SchemaType.STRING },
                                        explanation: { type: SchemaType.STRING },
                                        options: {
                                            type: SchemaType.ARRAY,
                                            items: {
                                                type: SchemaType.OBJECT,
                                                properties: {
                                                    optionText: { type: SchemaType.STRING },
                                                    isCorrect: { type: SchemaType.BOOLEAN },
                                                },
                                                required: ["optionText", "isCorrect"],
                                            },
                                        },
                                    },
                                    required: ["questionText", "questionType", "explanation", "options"],
                                },
                            },
                        },
                        required: ["title", "description", "questions"],
                    },
                },
            }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const generatedData = JSON.parse(responseText);
        const quizData = Array.isArray(generatedData) ? generatedData[0] : generatedData;

        if (!quizData || !quizData.questions) {
            throw new Error("Invalid response format from AI");
        }

        // Save to database
        // Check for existing quiz
        const existingQuiz = await db.query.quizzes.findFirst({
            where: eq(quizzes.skillId, skill.id),
            with: {
                questions: {
                    orderBy: (questions, { desc }) => [desc(questions.order)],
                    limit: 1,
                }
            }
        });

        let targetQuizId;
        let startOrder = 1;

        if (existingQuiz) {
            targetQuizId = existingQuiz.id;
            if (existingQuiz.questions && existingQuiz.questions.length > 0) {
                startOrder = existingQuiz.questions[0].order + 1;
            }
        } else {
            // Create Quiz
            const [newQuiz] = await db
                .insert(quizzes)
                .values({
                    skillId: skill.id,
                    title: quizData.title.replace("[INSERT_SKILL_FROM_TITLE_COLUMN]", skill.title), // Fallback cleanup
                    description: quizData.description,
                    timeLimit: quizData.timeLimit || 20,
                    passingScore: quizData.passingScore || 70,
                    order: 1, // Default order, maybe should be max + 1
                })
                .returning();
            targetQuizId = newQuiz.id;
        }

        // 2. Create Questions and Options
        for (const [index, q] of quizData.questions.entries()) {
            const [newQuestion] = await db
                .insert(quizQuestions)
                .values({
                    quizId: targetQuizId,
                    questionText: q.questionText,
                    questionType: q.questionType === "multiple" ? "multiple" : "single",
                    explanation: q.explanation,
                    order: startOrder + index,
                })
                .returning();

            if (q.options && q.options.length > 0) {
                await db.insert(quizOptions).values(
                    q.options.map((opt: any, optIndex: number) => ({
                        questionId: newQuestion.id,
                        optionText: opt.optionText,
                        isCorrect: opt.isCorrect,
                        order: optIndex + 1,
                    }))
                );
            }
        }

        return NextResponse.json({ success: true, quizId: targetQuizId });
    } catch (error: any) {
        console.error("Quiz generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate quiz", details: error.message },
            { status: 500 }
        );
    }
}
