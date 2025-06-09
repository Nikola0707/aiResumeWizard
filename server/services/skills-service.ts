import { openai } from "./openai-client";

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
