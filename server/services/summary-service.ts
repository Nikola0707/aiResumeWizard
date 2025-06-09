import { openai } from "./openai-client";
import { SummaryOptions } from "./types";

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
