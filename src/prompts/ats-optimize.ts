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

export function buildAtsOptimizePrompt(
  resumeText: string,
  jobDescription: string,
): AtsOptimizePrompt {
  return {
    system: `You are an ATS (Applicant Tracking System) optimization expert.
Compare the resume to the job description and return ONLY valid JSON matching this exact shape:
${JSON_SHAPE}

Rules:
- matchScore: integer 0-100 estimating keyword/role alignment (not interview likelihood)
- matchedKeywords: terms from the job description clearly reflected in the resume
- missingKeywords: important job terms missing or only vaguely implied
- keywordSuggestions: actionable ways to incorporate missing terms without fabricating experience
- formattingSuggestions: practical ATS parsing tips (headings, bullets, avoid tables/columns, etc.)
- priorityFixes: concise, ordered list of the most important improvements
- Do not invent skills, employers, or credentials
- Do not include markdown, code fences, or extra keys`,

    user: `## Job description\n\n${jobDescription}\n\n## Resume\n\n${resumeText}`,
  };
}
