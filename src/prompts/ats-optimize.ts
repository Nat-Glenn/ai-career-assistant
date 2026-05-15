/**
 * Prompt builder for ATS optimization against a job description.
 *
 * Focused on keyword coverage and ATS-friendly formatting — separate from
 * full resume rewriting (see resume-tailor.ts).
 */

export type AtsOptimizePrompt = {
  system: string;
  user: string;
};

const JSON_SHAPE = `{
  "matchScore": 75,
  "matchedKeywords": ["keywords already present in the resume that matter for the job"],
  "missingKeywords": ["important job keywords absent or weak in the resume"],
  "keywordSuggestions": ["where and how to add missing keywords naturally"],
  "formattingSuggestions": ["ATS-friendly formatting tips for this resume"],
  "priorityFixes": ["top 3-5 highest-impact changes ordered by importance"]
}`;

const WRITING_GUARDRAILS = `
Suggestion quality (required):
- Recommendations must be specific, actionable, and honest.
- keywordSuggestions: show how to add terms naturally in real bullets or summary — never suggest keyword stuffing or hidden white text.
- priorityFixes: plain language a candidate can do today; avoid vague advice like "improve your resume" or "highlight soft skills"
- Do not suggest inventing skills, tools, years of experience, or metrics.

Avoid:
- Encouraging exaggeration or misrepresentation for ATS score
- Generic buzzword dumps unrelated to the candidate's background
- Overly aggressive rewriting that would make the resume sound AI-generated
`;

export function buildAtsOptimizePrompt(
  resumeText: string,
  jobDescription: string,
): AtsOptimizePrompt {
  return {
    system: `You are an ATS (Applicant Tracking System) optimization expert helping candidates improve real resumes.
Compare the resume to the job description and return ONLY valid JSON matching this exact shape:
${JSON_SHAPE}

Rules:
- matchScore: integer 0-100 estimating keyword/role alignment (not interview likelihood)
- matchedKeywords: terms from the job description clearly reflected in the resume
- missingKeywords: important job terms missing or only vaguely implied — factual only
- keywordSuggestions: how to weave missing terms into existing content naturally (which section/bullet type)
- formattingSuggestions: practical ATS parsing tips (headings, bullets, file format) — not cosmetic fluff
- priorityFixes: 3-5 highest-impact changes in clear, direct language
- Do not invent skills, employers, or credentials
- Do not include markdown, code fences, or extra keys
${WRITING_GUARDRAILS}`,

    user: `## Job description\n\n${jobDescription}\n\n## Resume\n\n${resumeText}`,
  };
}
