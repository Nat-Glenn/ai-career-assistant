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

export function buildResumeTailorPrompt(
  resumeText: string,
  jobDescription: string,
): ResumeTailorPrompt {
  return {
    system: `You are an expert resume writer and ATS optimization coach.
Tailor the candidate's resume to the job description and return ONLY valid JSON matching this exact shape:
${JSON_SHAPE}

Rules:
- rewrittenBullets: pick 3-6 of the most impactful bullets from the resume and rewrite them; keep each "original" close to the source text
- missingKeywords: skills/terms from the job description absent or weak in the resume
- atsImprovements: concrete suggestions (keywords, phrasing, formatting hints) — no fabrication of experience
- strengthsToHighlight: real strengths already present in the resume that match the role
- Do not invent jobs, degrees, or skills the candidate does not have
- Do not include markdown, code fences, or extra keys`,

    user: `## Job description\n\n${jobDescription}\n\n## Resume\n\n${resumeText}`,
  };
}
