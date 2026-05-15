/**
 * Prompt builder for job description analysis.
 *
 * Prompts live here (not in the service or API route) so they are easy to
 * find, version in git, and tune without touching business logic.
 */

export type JobAnalysisPrompt = {
  system: string;
  user: string;
};

const JSON_SHAPE = `{
  "summary": "2-3 sentence overview of the role",
  "technicalSkills": ["skill1", "skill2"],
  "softSkills": ["skill1", "skill2"],
  "responsibilities": ["responsibility1", "responsibility2"],
  "experienceYears": "e.g. 3-5 years or null if not specified",
  "atsKeywords": ["keyword1", "keyword2"]
}`;

export function buildJobAnalysisPrompt(
  jobDescription: string,
): JobAnalysisPrompt {
  return {
    system: `You are an expert career coach and ATS analyst.
Analyze job descriptions and return ONLY valid JSON matching this exact shape:
${JSON_SHAPE}

Rules:
- technicalSkills: hard skills, tools, languages, frameworks
- softSkills: communication, leadership, collaboration, etc.
- responsibilities: key duties as short bullet phrases
- experienceYears: string like "0-2 years", "3+ years", or null if unclear
- atsKeywords: important terms recruiters and ATS systems likely scan for
- Do not include markdown, code fences, or extra keys`,

    user: `Analyze this job description:\n\n${jobDescription}`,
  };
}
