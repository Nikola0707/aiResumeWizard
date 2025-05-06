import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertResumeSchema, resumeContent } from "@shared/schema";
import { 
  generateProfessionalSummary, 
  generateExperienceBullets, 
  analyzeResumeForATS, 
  generateSkillSuggestions 
} from "./openai";

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
      const resumes = await storage.getResumesByUserId(req.user.id);
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
      
      if (resume.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to this resume" });
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
        userId: req.user.id // Ensure the resume is created for the authenticated user
      });
      
      const resume = await storage.createResume(validatedData);
      res.status(201).json(resume);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid resume data", errors: error.errors });
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
      
      if (resume.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this resume" });
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
      
      if (resume.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to delete this resume" });
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
      
      if (resume.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to this resume" });
      }
      
      await storage.incrementDownloads(resumeId);
      res.status(200).json({ message: "Download recorded" });
    } catch (error) {
      res.status(500).json({ message: "Failed to record download" });
    }
  });

  // AI routes
  app.post("/api/ai/summary", isAuthenticated, async (req, res) => {
    try {
      const summary = await generateProfessionalSummary(req.body);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  app.post("/api/ai/bullets", isAuthenticated, async (req, res) => {
    try {
      const bullets = await generateExperienceBullets(req.body);
      res.json({ bullets });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate experience bullets" });
    }
  });

  app.post("/api/ai/analyze", isAuthenticated, async (req, res) => {
    try {
      const { resumeText, jobDescription } = req.body;
      const analysis = await analyzeResumeForATS(resumeText, jobDescription);
      
      // If resumeId is provided, update the ATS score
      if (req.body.resumeId) {
        const resumeId = parseInt(req.body.resumeId);
        await storage.updateAtsScore(resumeId, analysis.score);
      }
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze resume" });
    }
  });

  app.post("/api/ai/skills", isAuthenticated, async (req, res) => {
    try {
      const { jobTitle, jobDescription } = req.body;
      const skills = await generateSkillSuggestions(jobTitle, jobDescription);
      res.json({ skills });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate skill suggestions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
