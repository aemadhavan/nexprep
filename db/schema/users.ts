import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { exams } from "./exams";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userExamAccess = pgTable("user_exam_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  grantType: text("grant_type").notNull(), // "auto", "manual", "purchase"
});

export const userFlashcardProgress = pgTable("user_flashcard_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  flashcardId: uuid("flashcard_id").notNull(),
  status: text("status").notNull().default("new"), // "new", "learning", "known"
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(0),
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewDate: timestamp("next_review_date").notNull().defaultNow(),
  lastReviewedAt: timestamp("last_reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Import needed types
import { flashcards } from "./exams";
import { real, integer } from "drizzle-orm/pg-core";

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  examAccess: many(userExamAccess),
  flashcardProgress: many(userFlashcardProgress),
}));

export const userExamAccessRelations = relations(userExamAccess, ({ one }) => ({
  user: one(users, {
    fields: [userExamAccess.userId],
    references: [users.id],
  }),
  exam: one(exams, {
    fields: [userExamAccess.examId],
    references: [exams.id],
  }),
}));

export const userFlashcardProgressRelations = relations(userFlashcardProgress, ({ one }) => ({
  user: one(users, {
    fields: [userFlashcardProgress.userId],
    references: [users.id],
  }),
  flashcard: one(flashcards, {
    fields: [userFlashcardProgress.flashcardId],
    references: [flashcards.id],
  }),
}));
