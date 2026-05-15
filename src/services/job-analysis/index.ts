import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from "@/lib/openai";
import { buildJobAnalysisPrompt } from "@/prompts/job-analysis";
import {
  jobAnalysisResultSchema,
  type JobAnalysisResult,
} from "@/types/job-analysis";

/**
 * Analyzes a job description using OpenAI and returns structured data.
 *
 * This module owns the "how" of calling AI. API routes only orchestrate
 * HTTP concerns (parsing, status codes).
 */
export async function analyzeJobDescription(
  jobDescription: string,
): Promise<JobAnalysisResult> {
  const openai = getOpenAIClient();
  const { system, user } = buildJobAnalysisPrompt(jobDescription);

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

  // Validate shape before returning — never trust raw model output.
  return jobAnalysisResultSchema.parse(parsed);
}
