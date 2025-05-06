import { apiRequest } from "./queryClient";

export interface SummaryOptions {
  professionalTitle: string;
  yearsOfExperience?: number;
  industry?: string;
  keySkills?: string[];
  targetJobTitle?: string;
}

export interface BulletPointOptions {
  jobTitle: string;
  jobDescription: string;
  accomplishments?: string[];
  skills?: string[];
}

export interface ATSAnalysisResult {
  score: number;
  recommendations: string[];
  keywordMatches: { keyword: string; present: boolean }[];
  strengths: string[];
  weaknesses: string[];
}

export async function generateProfessionalSummary(options: SummaryOptions): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/ai/summary", options);
    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error("Error generating professional summary:", error);
    throw new Error("Failed to generate professional summary");
  }
}

export async function generateExperienceBullets(options: BulletPointOptions): Promise<string[]> {
  try {
    const response = await apiRequest("POST", "/api/ai/bullets", options);
    const data = await response.json();
    return data.bullets;
  } catch (error) {
    console.error("Error generating experience bullets:", error);
    throw new Error("Failed to generate experience bullets");
  }
}

export async function analyzeResumeForATS(
  resumeText: string, 
  jobDescription?: string,
  resumeId?: number
): Promise<ATSAnalysisResult> {
  try {
    const response = await apiRequest("POST", "/api/ai/analyze", {
      resumeText,
      jobDescription,
      resumeId
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error analyzing resume for ATS:", error);
    throw new Error("Failed to analyze resume for ATS compatibility");
  }
}

export async function generateSkillSuggestions(
  jobTitle: string, 
  jobDescription?: string
): Promise<string[]> {
  try {
    const response = await apiRequest("POST", "/api/ai/skills", {
      jobTitle,
      jobDescription
    });
    
    const data = await response.json();
    return data.skills;
  } catch (error) {
    console.error("Error generating skill suggestions:", error);
    throw new Error("Failed to generate skill suggestions");
  }
}
