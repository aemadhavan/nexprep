import { z } from "zod";

export const uploadFlashcardSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  explanation: z.string().optional(),
});

// Quiz option schema
export const uploadQuizOptionSchema = z.object({
  optionText: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
  order: z.number().int().positive(),
});

// Quiz question schema
export const uploadQuizQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum(["single", "multiple"], {
    errorMap: () => ({ message: "Question type must be 'single' or 'multiple'" }),
  }),
  explanation: z.string().optional(),
  order: z.number().int().positive(),
  options: z.array(uploadQuizOptionSchema).min(2, "At least 2 options required per question"),
});

// Quiz schema
export const uploadQuizSchema = z.object({
  title: z.string().min(1, "Quiz title is required"),
  description: z.string().optional(),
  timeLimit: z.number().int().positive().optional(), // in minutes
  passingScore: z.number().int().min(0).max(100).default(70),
  order: z.number().int().positive(),
  questions: z.array(uploadQuizQuestionSchema).min(1, "At least 1 question is required per quiz"),
});

export const uploadSkillSchema = z.object({
  title: z.string().min(1, "Skill title is required"),
  order: z.number().int().positive(),
  flashcards: z.array(uploadFlashcardSchema).min(1, "At least one flashcard is required per skill"),
  quizzes: z.array(uploadQuizSchema).optional().default([]),
});

export const uploadCategorySchema = z.object({
  title: z.string().min(1, "Category title is required"),
  order: z.number().int().positive(),
  skills: z.array(uploadSkillSchema).min(1, "At least one skill is required per category"),
});

export const uploadDomainSchema = z.object({
  title: z.string().min(1, "Domain title is required"),
  order: z.number().int().positive(),
  categories: z.array(uploadCategorySchema).min(1, "At least one category is required per domain"),
});

export const uploadExamSchema = z.object({
  code: z.string().min(1, "Exam code is required").regex(/^[A-Z]{2,3}-\d{3,4}$/, "Exam code must match format (e.g., AB-900)"),
  name: z.string().min(1, "Exam name is required"),
  provider: z.enum(["Microsoft", "AWS", "Google"], {
    errorMap: () => ({ message: "Provider must be Microsoft, AWS, or Google" }),
  }),
  description: z.string().min(1, "Description is required"),
  phase: z.number().int().min(1).max(3),
  price: z.number().min(0),
});

export const examUploadPayloadSchema = z.object({
  exam: uploadExamSchema,
  domains: z.array(uploadDomainSchema).min(1, "At least one domain is required"),
});

export type UploadFlashcardInput = z.infer<typeof uploadFlashcardSchema>;
export type UploadQuizOptionInput = z.infer<typeof uploadQuizOptionSchema>;
export type UploadQuizQuestionInput = z.infer<typeof uploadQuizQuestionSchema>;
export type UploadQuizInput = z.infer<typeof uploadQuizSchema>;
export type UploadSkillInput = z.infer<typeof uploadSkillSchema>;
export type UploadCategoryInput = z.infer<typeof uploadCategorySchema>;
export type UploadDomainInput = z.infer<typeof uploadDomainSchema>;
export type UploadExamInput = z.infer<typeof uploadExamSchema>;
export type ExamUploadPayloadInput = z.infer<typeof examUploadPayloadSchema>;
