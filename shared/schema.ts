import { pgTable, text, serial, integer, boolean, json, timestamp, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resumeTemplate = z.enum([
  "modern", 
  "professional", 
  "creative", 
  "simple", 
  "elegant"
]);

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  template: text("template").notNull(),
  content: json("content").notNull(),
  lastEdited: timestamp("last_edited").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  downloads: integer("downloads").default(0),
  atsScore: integer("ats_score"),
});

// Define relations after both tables are declared
export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes)
}));

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id]
  })
}));

export const personalInfo = z.object({
  fullName: z.string(),
  professionalTitle: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  summary: z.string().optional(),
});

export const experienceItem = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

export const educationItem = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string().optional(),
  field: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
});

export const skillItem = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().min(1).max(5).optional(),
});

export const resumeContent = z.object({
  personalInfo: personalInfo,
  experience: z.array(experienceItem).optional(),
  education: z.array(educationItem).optional(),
  skills: z.array(skillItem).optional(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

export const insertResumeSchema = createInsertSchema(resumes).pick({
  userId: true,
  title: true,
  template: true,
  content: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;
export type ResumeTemplate = z.infer<typeof resumeTemplate>;
export type PersonalInfo = z.infer<typeof personalInfo>;
export type ExperienceItem = z.infer<typeof experienceItem>;
export type EducationItem = z.infer<typeof educationItem>;
export type SkillItem = z.infer<typeof skillItem>;
export type ResumeContent = z.infer<typeof resumeContent>;
