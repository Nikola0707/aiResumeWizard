import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || '',
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
}

export async function generateProfessionalSummary(options: SummaryOptions): Promise<string> {
  try {
    const { professionalTitle, yearsOfExperience, industry, keySkills, targetJobTitle } = options;
    
    let prompt = `Write a professional summary for a resume for a ${professionalTitle}.`;
    
    if (yearsOfExperience) {
      prompt += ` The person has ${yearsOfExperience} years of experience.`;
    }
    
    if (industry) {
      prompt += ` They work in the ${industry} industry.`;
    }
    
    if (keySkills?.length) {
      prompt += ` Their key skills include ${keySkills.join(', ')}.`;
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

export async function generateExperienceBullets(options: BulletPointOptions): Promise<string[]> {
  try {
    const { jobTitle, jobDescription, accomplishments, skills } = options;
    
    let prompt = `Create 3-5 achievement-oriented bullet points for a resume for someone with the job title "${jobTitle}" with the following job description: "${jobDescription}".`;
    
    if (accomplishments?.length) {
      prompt += ` Incorporate these accomplishments: ${accomplishments.join(', ')}.`;
    }
    
    if (skills?.length) {
      prompt += ` Highlight these skills: ${skills.join(', ')}.`;
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
      return Array.isArray(parsedResponse.bullets) ? parsedResponse.bullets : [];
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error generating experience bullets:", error);
    throw new Error("Failed to generate experience bullets");
  }
}

export async function analyzeResumeForATS(resumeText: string, jobDescription?: string): Promise<ATSAnalysisResult> {
  try {
    let prompt = "Analyze this resume for ATS compatibility and provide feedback.";
    
    if (jobDescription) {
      prompt += ` Compare it with the following job description: "${jobDescription}"`;
    }
    
    prompt += ` Return the analysis in the following JSON format:
    {
      "score": (a number between 0-100 representing ATS compatibility),
      "recommendations": (an array of specific improvement suggestions),
      "keywordMatches": (an array of objects with "keyword" and "present" boolean properties),
      "strengths": (an array of resume strengths),
      "weaknesses": (an array of resume weaknesses)
    }`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: resumeText }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
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
      weaknesses: parsedResponse.weaknesses || []
    };
  } catch (error) {
    console.error("Error analyzing resume for ATS:", error);
    throw new Error("Failed to analyze resume for ATS compatibility");
  }
}

export async function generateSkillSuggestions(jobTitle: string, jobDescription?: string): Promise<string[]> {
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
