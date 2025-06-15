import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
// Zod is a TypeScript-first schema validation library that provides two key benefits:
// 1. Runtime validation: Ensures data matches expected schemas when your code is running
// 2. Type inference: Automatically generates TypeScript types from my schemas for compile-time type checking
import { z } from "zod";
import { insertResumeSchema } from "@shared/schema";
import {
  generateProfessionalSummary,
  generateExperienceBullets,
  analyzeResumeForATS,
  generateSkillSuggestions,
  generateCoverLetter,
  incrementAIGenerationCount,
  getAIGenerationStats,
} from "./services/index";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Resume CRUD operations
  app.get("/api/resumes", isAuthenticated, async (req, res) => {
    try {
      const resumes = await storage.getResumesByUserId((req.user as any).id);
      res.json(resumes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resumes" });
    }
  });

  app.get("/api/resumes/:id", isAuthenticated, async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);

      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      if (resume.userId !== (req.user as any).id) {
        return res
          .status(403)
          .json({ message: "Unauthorized access to this resume" });
      }

      res.json(resume);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resume" });
    }
  });

  app.post("/api/resumes", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertResumeSchema.parse({
        ...req.body,
        userId: (req.user as any).id,
      });

      const resume = await storage.createResume(validatedData);
      res.status(201).json(resume);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid resume data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create resume" });
    }
  });

  app.put("/api/resumes/:id", isAuthenticated, async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);

      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      if (resume.userId !== (req.user as any).id) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this resume" });
      }

      const updatedResume = await storage.updateResume(resumeId, req.body);
      res.json(updatedResume);
    } catch (error) {
      res.status(500).json({ message: "Failed to update resume" });
    }
  });

  app.delete("/api/resumes/:id", isAuthenticated, async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);

      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      if (resume.userId !== (req.user as any).id) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this resume" });
      }

      await storage.deleteResume(resumeId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete resume" });
    }
  });

  // Record downloads
  app.post("/api/resumes/:id/download", isAuthenticated, async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);

      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      if (resume.userId !== (req.user as any).id) {
        return res
          .status(403)
          .json({ message: "Unauthorized access to this resume" });
      }

      await storage.incrementDownloads(resumeId);
      res.status(200).json({ message: "Download recorded" });
    } catch (error) {
      res.status(500).json({ message: "Failed to record download" });
    }
  });

  // AI generation routes
  app.post("/api/ai/summary", isAuthenticated, async (req, res) => {
    try {
      const stats = await getAIGenerationStats((req.user as any).id);

      if (!stats || stats.aiGenerationCount >= 3) {
        return res.status(403).json({
          message:
            "AI generation limit reached. Please upgrade your plan for more generations.",
        });
      }

      const summary = await generateProfessionalSummary(req.body);
      await incrementAIGenerationCount((req.user as any).id);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  app.post("/api/ai/bullets", isAuthenticated, async (req, res) => {
    try {
      const stats = await getAIGenerationStats((req.user as any).id);

      if (!stats || stats.aiGenerationCount >= 3) {
        return res.status(403).json({
          message:
            "AI generation limit reached. Please upgrade your plan for more generations.",
        });
      }

      const bullets = await generateExperienceBullets(req.body);
      await incrementAIGenerationCount((req.user as any).id);
      res.json({ bullets });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to generate experience bullets" });
    }
  });

  app.post("/api/ai/analyze", isAuthenticated, async (req, res) => {
    try {
      const stats = await getAIGenerationStats((req.user as any).id);

      if (!stats || stats.aiGenerationCount >= 3) {
        return res.status(403).json({
          message:
            "AI generation limit reached. Please upgrade your plan for more generations.",
        });
      }

      const { resumeText, jobDescription } = req.body;
      const analysis = await analyzeResumeForATS(resumeText, jobDescription);

      // If resumeId is provided, update the ATS score
      if (req.body.resumeId) {
        const resumeId = parseInt(req.body.resumeId);
        await storage.updateAtsScore(resumeId, analysis.score);
      }
      await incrementAIGenerationCount((req.user as any).id);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze resume" });
    }
  });

  app.post("/api/ai/skills", isAuthenticated, async (req, res) => {
    try {
      const stats = await getAIGenerationStats((req.user as any).id);

      if (!stats || stats.aiGenerationCount >= 3) {
        return res.status(403).json({
          message:
            "AI generation limit reached. Please upgrade your plan for more generations.",
        });
      }

      const { jobTitle, jobDescription } = req.body;
      const skills = await generateSkillSuggestions(jobTitle, jobDescription);
      await incrementAIGenerationCount((req.user as any).id);
      res.json({ skills });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate skill suggestions" });
    }
  });

  app.post("/api/ai/cover-letter", isAuthenticated, async (req, res) => {
    try {
      const stats = await getAIGenerationStats((req.user as any).id);

      if (!stats || stats.aiGenerationCount >= 3) {
        return res.status(403).json({
          message:
            "AI generation limit reached. Please upgrade your plan for more generations.",
        });
      }

      const coverLetter = await generateCoverLetter(req.body);
      await incrementAIGenerationCount((req.user as any).id);
      res.json({ coverLetter });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate cover letter" });
    }
  });

  // Add ping endpoint for session extension
  app.post("/api/ping", isAuthenticated, (req, res) => {
    // Just update the session
    req.session.touch();
    res.status(200).json({ message: "Session extended" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
