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

export interface KeywordMatch {
  keyword: string;
  present: boolean;
  importance: "high" | "medium" | "low";
  context?: string;
}

export interface IndustryAnalysis {
  detectedIndustry: string | null;
  industrySpecificKeywords: string[];
  industryRecommendations: string[];
}

export interface FormatAnalysis {
  structureScore: number;
  readabilityScore: number;
  formatIssues: string[];
}

export interface ContentAnalysis {
  actionVerbs: string[];
  quantifiableAchievements: string[];
  missingElements: string[];
}

export interface ATSAnalysisResult {
  score: number;
  recommendations: string[];
  keywordMatches: KeywordMatch[];
  strengths: string[];
  weaknesses: string[];
  industryAnalysis: IndustryAnalysis;
  formatAnalysis: FormatAnalysis;
  contentAnalysis: ContentAnalysis;
}

export interface CoverLetterOptions {
  resumeText: string;
  jobDescription: string;
  companyName: string;
  tone?: "professional" | "enthusiastic" | "formal" | "conversational";
  highlightSkills?: string[];
  highlightExperience?: string[];
  customInstructions?: string;
}

export async function generateProfessionalSummary(
  options: SummaryOptions
): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/ai/summary", options);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }
    const data = await response.json();
    return data.summary;
  } catch (error: any) {
    console.error("Error generating professional summary:", error);
    throw error;
  }
}

export async function generateExperienceBullets(
  options: BulletPointOptions
): Promise<string[]> {
  try {
    const response = await apiRequest("POST", "/api/ai/bullets", options);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }
    const data = await response.json();
    return data.bullets;
  } catch (error: any) {
    console.error("Error generating experience bullets:", error);
    throw error;
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
      resumeId,
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
      jobDescription,
    });

    const data = await response.json();
    return data.skills;
  } catch (error) {
    console.error("Error generating skill suggestions:", error);
    throw new Error("Failed to generate skill suggestions");
  }
}

export async function generateCoverLetter(
  options: CoverLetterOptions
): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/ai/cover-letter", options);
    const data = await response.json();
    return data.coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter");
  }
}
