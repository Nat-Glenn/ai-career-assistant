import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from "@/lib/openai";
import { buildCoverLetterPrompt } from "@/prompts/cover-letter";
import type { GenerateCoverLetterInput } from "@/lib/validators";
import {
  coverLetterResultSchema,
  type CoverLetterResult,
} from "@/types/cover-letter";

/**
 * Generates a tailored cover letter using OpenAI.
 *
 * API routes call this function — not OpenAI directly.
 */
export async function generateCoverLetter(
  input: GenerateCoverLetterInput,
): Promise<CoverLetterResult> {
  const openai = getOpenAIClient();
  const tone = input.tone ?? "professional";

  const { system, user } = buildCoverLetterPrompt({
    resumeText: input.resumeText,
    jobDescription: input.jobDescription,
    companyName: input.companyName,
    roleTitle: input.roleTitle,
    tone,
  });

  const completion = await openai.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    temperature: 0.4,
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

  return coverLetterResultSchema.parse(parsed);
}
