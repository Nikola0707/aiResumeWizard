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
  industryAnalysis: {
    detectedIndustry: string | null;
    industrySpecificKeywords: string[];
    industryRecommendations: string[];
  };
  formatAnalysis: {
    structureScore: number;
    readabilityScore: number;
    formatIssues: string[];
  };
  contentAnalysis: {
    actionVerbs: string[];
    quantifiableAchievements: string[];
    missingElements: string[];
  };
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
