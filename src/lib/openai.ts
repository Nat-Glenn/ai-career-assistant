import OpenAI from "openai";

/**
 * Lazy singleton OpenAI client.
 *
 * Why lazy? Next.js may import this module during build. We only throw
 * if something actually calls the API without OPENAI_API_KEY set.
 */
let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local (see .env.example).",
    );
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

/** Default model for MVP AI features — cost-efficient and capable enough for analysis. */
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
