import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

// Resume content schemas
export const skillItem = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().min(1).max(5),
});

export const educationItem = z.object({
  id: z.string(),
  institution: z.string(),
  location: z.string(),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean().default(false),
  description: z.string().optional(),
});

export const experienceItem = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean().default(false),
  description: z.string(),
  highlights: z.array(z.string()),
});

export const resumeContent = z.object({
  personalInfo: z.object({
    fullName: z.string().optional(),
    professionalTitle: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    website: z.string().optional(),
    summary: z.string().optional(),
  }),
  experience: z.array(experienceItem),
  education: z.array(educationItem),
  skills: z.array(skillItem),
});

export type SkillItem = z.infer<typeof skillItem>;
export type EducationItem = z.infer<typeof educationItem>;
export type ExperienceItem = z.infer<typeof experienceItem>;
export type ResumeContent = z.infer<typeof resumeContent>;

// Resume template type and schema
export type ResumeTemplate = "modern" | "classic" | "professional" | "creative";

export const resumeTemplate = z.enum([
  "modern",
  "classic",
  "professional",
  "creative",
]);

// Resume schema
export const resumeSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  template: resumeTemplate,
  content: resumeContent,
  lastEdited: z.date(),
  createdAt: z.date(),
  downloads: z.number().default(0),
  atsScore: z.number().nullable(),
});

export type Resume = z.infer<typeof resumeSchema>;

// Insert schemas (for creating new records)
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export const insertResumeSchema = resumeSchema.omit({
  id: true,
  createdAt: true,
  lastEdited: true,
  downloads: true,
  atsScore: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertResume = z.infer<typeof insertResumeSchema>;
