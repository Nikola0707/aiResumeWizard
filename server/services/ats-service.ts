import { openai } from "./openai-client";
import { ATSAnalysisResult } from "./types";

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
