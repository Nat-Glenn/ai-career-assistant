import type { CoverLetterTone } from "@/types/cover-letter";

/**
 * Prompt builder for personalized cover letter generation.
 */

export type CoverLetterPromptInput = {
  resumeText: string;
  jobDescription: string;
  companyName?: string;
  roleTitle?: string;
  tone: CoverLetterTone;
};

export type CoverLetterPrompt = {
  system: string;
  user: string;
};

const JSON_SHAPE = `{
  "subjectLine": "Application for [Role] – [Name] or similar",
  "openingParagraph": "Opening paragraph text",
  "bodyParagraphs": ["First body paragraph", "Second body paragraph"],
  "closingParagraph": "Closing paragraph with sign-off intent (no placeholder name required)",
  "fullCoverLetter": "Complete letter as one string with paragraphs separated by blank lines"
}`;

export function buildCoverLetterPrompt(
  input: CoverLetterPromptInput,
): CoverLetterPrompt {
  const companyLine = input.companyName
    ? `Company: ${input.companyName}`
    : "Company: not provided — infer from job description if clear";
  const roleLine = input.roleTitle
    ? `Role: ${input.roleTitle}`
    : "Role: not provided — infer from job description if clear";

  return {
    system: `You are an expert career coach writing tailored cover letters.
Write in a ${input.tone} tone.
Return ONLY valid JSON matching this exact shape:
${JSON_SHAPE}

Rules:
- Base claims only on the provided resume — do not invent experience
- Reference specific skills and achievements from the resume that match the job
- bodyParagraphs: 1-3 paragraphs
- fullCoverLetter: concatenate all sections in order with blank lines between paragraphs
- Do not include markdown, code fences, or extra keys`,

    user: `${companyLine}
${roleLine}
Tone: ${input.tone}

## Job description

${input.jobDescription}

## Resume

${input.resumeText}`,
  };
}
