import { pgTable, text, integer, boolean, timestamp, uuid, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const exams = pgTable("exams", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  description: text("description").notNull(),
  phase: integer("phase").notNull(),
  price: real("price").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const domains = pgTable("domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  domainId: uuid("domain_id").notNull().references(() => domains.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const flashcards = pgTable("flashcards", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  explanation: text("explanation"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const examsRelations = relations(exams, ({ many }) => ({
  domains: many(domains),
}));

export const domainsRelations = relations(domains, ({ one, many }) => ({
  exam: one(exams, {
    fields: [domains.examId],
    references: [exams.id],
  }),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  domain: one(domains, {
    fields: [categories.domainId],
    references: [domains.id],
  }),
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  category: one(categories, {
    fields: [skills.categoryId],
    references: [categories.id],
  }),
  flashcards: many(flashcards),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  skill: one(skills, {
    fields: [flashcards.skillId],
    references: [skills.id],
  }),
}));

