import { z } from "zod";

export const uploadFlashcardSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  explanation: z.string().optional(),
});

export const uploadSkillSchema = z.object({
  title: z.string().min(1, "Skill title is required"),
  order: z.number().int().positive(),
  flashcards: z.array(uploadFlashcardSchema).min(1, "At least one flashcard is required per skill"),
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
export type UploadSkillInput = z.infer<typeof uploadSkillSchema>;
export type UploadCategoryInput = z.infer<typeof uploadCategorySchema>;
export type UploadDomainInput = z.infer<typeof uploadDomainSchema>;
export type UploadExamInput = z.infer<typeof uploadExamSchema>;
export type ExamUploadPayloadInput = z.infer<typeof examUploadPayloadSchema>;
