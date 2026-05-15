import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from "@/lib/openai";
import { buildResumeTailorPrompt } from "@/prompts/resume-tailor";
import {
  resumeTailoringResultSchema,
  type ResumeTailoringResult,
} from "@/types/resume-tailoring";

/**
 * Tailors resume content to a job description using OpenAI.
 *
 * API routes should call this function — not OpenAI directly — so
 * prompting and validation stay in one place.
 */
export async function tailorResume(
  resumeText: string,
  jobDescription: string,
): Promise<ResumeTailoringResult> {
  const openai = getOpenAIClient();
  const { system, user } = buildResumeTailorPrompt(resumeText, jobDescription);

  const completion = await openai.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content;

  if (!rawContent) {
    throw new Error("OpenAI returned an empty response.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }

  return resumeTailoringResultSchema.parse(parsed);
}
