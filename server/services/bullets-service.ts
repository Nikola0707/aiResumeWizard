import { openai } from "./openai-client";
import { BulletPointOptions } from "./types";

export async function generateExperienceBullets(
  options: BulletPointOptions
): Promise<string[]> {
  try {
    const { jobTitle, jobDescription, accomplishments, skills } = options;

    const prompt = `Generate 3-5 achievement-oriented bullet points for a ${jobTitle} position.

Context:
${jobDescription ? `Role: ${jobDescription}` : ""}
${
  accomplishments?.length
    ? `Previous accomplishments: ${accomplishments.join(", ")}`
    : ""
}
${skills?.length ? `Key skills to highlight: ${skills.join(", ")}` : ""}

Requirements for each bullet point:
1. Start with a strong action verb in past tense
2. Include specific metrics, numbers, or percentages where possible
3. Focus on achievements and impact, not just responsibilities
4. Be concise and clear
5. Be ATS-friendly
6. Be specific to the ${jobTitle} role

Format each bullet point on a new line starting with a dash (-).`;

    console.log("Sending prompt to OpenAI:", prompt);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content?.trim();
    console.log("Raw OpenAI Response:", content);

    if (!content) {
      console.error("Empty content in response");
      return [];
    }

    // Split the content into lines and process each bullet point
    const bullets = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-"))
      .map((line) => line.substring(1).trim())
      .filter((line) => line.length > 0 && line.length <= 200);

    console.log("Processed bullets:", bullets);

    if (bullets.length === 0) {
      console.error("No valid bullet points generated");
      return [];
    }

    return bullets;
  } catch (error) {
    console.error("Error generating experience bullets:", error);
    throw new Error("Failed to generate experience bullets");
  }
}
