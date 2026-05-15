import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from "@/lib/openai";
import { buildAtsOptimizePrompt } from "@/prompts/ats-optimize";
import {
  atsOptimizationResultSchema,
  type AtsOptimizationResult,
} from "@/types/ats-optimization";

/**
 * Analyzes resume ATS fit for a job description using OpenAI.
 *
 * API routes call this function — not OpenAI directly — so prompts and
 * validation stay centralized.
 */
export async function optimizeResumeForAts(
  resumeText: string,
  jobDescription: string,
): Promise<AtsOptimizationResult> {
  const openai = getOpenAIClient();
  const { system, user } = buildAtsOptimizePrompt(resumeText, jobDescription);

  const completion = await openai.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    temperature: 0.2,
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

  return atsOptimizationResultSchema.parse(parsed);
}
