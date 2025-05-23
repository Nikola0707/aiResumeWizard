import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

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

export async function generateProfessionalSummary(
  options: SummaryOptions
): Promise<string> {
  try {
    const {
      professionalTitle,
      yearsOfExperience,
      industry,
      keySkills,
      targetJobTitle,
    } = options;

    let prompt = `Write a professional summary for a resume for a ${professionalTitle}.`;

    if (yearsOfExperience) {
      prompt += ` The person has ${yearsOfExperience} years of experience.`;
    }

    if (industry) {
      prompt += ` They work in the ${industry} industry.`;
    }

    if (keySkills?.length) {
      prompt += ` Their key skills include ${keySkills.join(", ")}.`;
    }

    if (targetJobTitle) {
      prompt += ` The summary should be tailored for a ${targetJobTitle} position.`;
    }

    prompt += ` The summary should be professional, concise (3-4 sentences), highlight strengths, and be in first person.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 250,
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error generating professional summary:", error);
    throw new Error("Failed to generate professional summary");
  }
}

export async function generateExperienceBullets(
  options: BulletPointOptions
): Promise<string[]> {
  try {
    const { jobTitle, jobDescription, accomplishments, skills } = options;

    let prompt = `Create 3-5 achievement-oriented bullet points for a resume for someone with the job title "${jobTitle}" with the following job description: "${jobDescription}".`;

    if (accomplishments?.length) {
      prompt += ` Incorporate these accomplishments: ${accomplishments.join(
        ", "
      )}.`;
    }

    if (skills?.length) {
      prompt += ` Highlight these skills: ${skills.join(", ")}.`;
    }

    prompt += ` Each bullet point should start with a strong action verb, include quantifiable achievements when possible, and be ATS-friendly. Format the output as a JSON array of strings where each string is a bullet point.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) return [];

    try {
      const parsedResponse = JSON.parse(content);
      return Array.isArray(parsedResponse.bullets)
        ? parsedResponse.bullets
        : [];
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error generating experience bullets:", error);
    throw new Error("Failed to generate experience bullets");
  }
}

export async function analyzeResumeForATS(
  resumeText: string,
  jobDescription?: string
): Promise<ATSAnalysisResult> {
  try {
    let prompt = `Analyze this resume for ATS compatibility and provide detailed feedback.`;

    if (jobDescription) {
      prompt += ` Compare it with the following job description: "${jobDescription}"`;
    }

    prompt += ` Return the analysis in the following JSON format:
    {
      "score": (a number between 0-100 representing ATS compatibility),
      "recommendations": (an array of specific improvement suggestions),
      "keywordMatches": (an array of objects with "keyword", "present", "importance" (high/medium/low), and "context" properties),
      "strengths": (an array of resume strengths),
      "weaknesses": (an array of resume weaknesses),
      "industryAnalysis": {
        "detectedIndustry": (string or null),
        "industrySpecificKeywords": (array of industry-specific keywords),
        "industryRecommendations": (array of industry-specific suggestions)
      },
      "formatAnalysis": {
        "structureScore": (number between 0-100),
        "readabilityScore": (number between 0-100),
        "formatIssues": (array of formatting issues)
      },
      "contentAnalysis": {
        "actionVerbs": (array of detected action verbs),
        "quantifiableAchievements": (array of detected achievements),
        "missingElements": (array of missing important elements)
      }
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: resumeText },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.5,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from AI");
    }

    const parsedResponse = JSON.parse(content);

    return {
      score: parsedResponse.score || 0,
      recommendations: parsedResponse.recommendations || [],
      keywordMatches: parsedResponse.keywordMatches || [],
      strengths: parsedResponse.strengths || [],
      weaknesses: parsedResponse.weaknesses || [],
      industryAnalysis: parsedResponse.industryAnalysis || {
        detectedIndustry: null,
        industrySpecificKeywords: [],
        industryRecommendations: [],
      },
      formatAnalysis: parsedResponse.formatAnalysis || {
        structureScore: 0,
        readabilityScore: 0,
        formatIssues: [],
      },
      contentAnalysis: parsedResponse.contentAnalysis || {
        actionVerbs: [],
        quantifiableAchievements: [],
        missingElements: [],
      },
    };
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
    let prompt = `Generate a list of 10 relevant hard and soft skills for someone with the job title "${jobTitle}"`;

    if (jobDescription) {
      prompt += ` based on this job description: "${jobDescription}"`;
    }

    prompt += `. Format the output as a JSON array of strings containing only the skill names.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) return [];

    try {
      const parsedResponse = JSON.parse(content);
      return Array.isArray(parsedResponse.skills) ? parsedResponse.skills : [];
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error generating skill suggestions:", error);
    throw new Error("Failed to generate skill suggestions");
  }
}

export async function generateCoverLetter(
  options: CoverLetterOptions
): Promise<string> {
  try {
    const {
      resumeText,
      jobDescription,
      companyName,
      tone = "professional",
      highlightSkills,
      highlightExperience,
      customInstructions,
    } = options;

    let prompt = `Write a cover letter for ${companyName} based on the following resume and job description.`;

    // Add tone instructions
    prompt += ` The tone should be ${tone}.`;

    // Add highlighting instructions
    if (highlightSkills?.length) {
      prompt += ` Emphasize these skills: ${highlightSkills.join(", ")}.`;
    }

    if (highlightExperience?.length) {
      prompt += ` Highlight these experiences: ${highlightExperience.join(
        ", "
      )}.`;
    }

    // Add custom instructions if provided
    if (customInstructions) {
      prompt += ` Additional instructions: ${customInstructions}`;
    }

    prompt += ` The cover letter should be well-structured, engaging, and demonstrate how the candidate's experience aligns with the job requirements.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter");
  }
}
