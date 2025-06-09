import { openai } from "./openai-client";
import { CoverLetterOptions } from "./types";

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
