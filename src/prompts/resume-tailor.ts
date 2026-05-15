/**
 * Prompt builder for resume tailoring against a job description.
 *
 * Kept separate from the service so prompts can be tuned without
 * changing API or business logic.
 */

export type ResumeTailorPrompt = {
  system: string;
  user: string;
};

const JSON_SHAPE = `{
  "tailoredSummary": "2-4 sentence professional summary tailored to the role",
  "rewrittenBullets": [
    { "original": "original bullet from resume", "rewritten": "improved bullet aligned to the job" }
  ],
  "missingKeywords": ["keyword or skill missing from resume but important for the job"],
  "atsImprovements": ["specific actionable ATS or wording improvements"],
  "strengthsToHighlight": ["existing strengths from the resume to emphasize for this role"]
}`;

const WRITING_GUARDRAILS = `
Writing quality (required):
- Sound like a clear, professional human wrote this — not marketing copy or AI filler.
- Be concise. Prefer plain words over buzzwords.
- Match junior/early-career tone when the resume shows limited experience; do not write like a senior executive.
- Every claim must be grounded in the resume. If it is not supported, do not say it.

Resume bullets:
- Preserve the user's real experience, scope, and tools. Rewrite for clarity and job relevance only.
- Do not invent employers, titles, dates, projects, certifications, or skills.
- Do not invent metrics (%, $, team size, timelines) unless the original bullet already includes them.
- Do not upgrade ownership (e.g., "assisted" → "led company-wide transformation").
- Use strong but believable verbs. One line per bullet when possible.

Avoid:
- Exaggerated or vague claims ("highly motivated self-starter", "proven track record of excellence")
- Buzzword stuffing ("synergy", "leverage", "cutting-edge", "world-class", "dynamic")
- Generic AI phrasing ("results-driven professional", "passionate about delivering value")
- Overly polished or corporate-speak that the candidate likely did not write themselves
`;

export function buildResumeTailorPrompt(
  resumeText: string,
  jobDescription: string,
): ResumeTailorPrompt {
  return {
    system: `You are an expert resume coach helping candidates improve real resumes for specific roles.
Tailor the candidate's resume to the job description and return ONLY valid JSON matching this exact shape:
${JSON_SHAPE}

Rules:
- rewrittenBullets: pick 3-6 of the most impactful bullets from the resume and rewrite them; keep each "original" close to the source text
- missingKeywords: skills/terms from the job description absent or weak in the resume (factual list only)
- atsImprovements: concrete, specific suggestions (keywords, phrasing, section order) — no fabrication
- strengthsToHighlight: real strengths already in the resume that match the role; be specific, not generic
- Do not invent jobs, degrees, tools, or responsibilities the candidate does not have
- Do not include markdown, code fences, or extra keys
${WRITING_GUARDRAILS}`,

    user: `## Job description\n\n${jobDescription}\n\n## Resume\n\n${resumeText}`,
  };
}
