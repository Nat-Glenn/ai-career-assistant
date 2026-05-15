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

const TONE_GUIDANCE: Record<CoverLetterTone, string> = {
  professional:
    "Clear and respectful. Confident but understated. No fluff.",
  friendly:
    "Warm and approachable. Still professional. Conversational, not casual slang.",
  enthusiastic:
    "Positive and motivated without hype. No exclamation marks unless truly warranted.",
  formal:
    "Traditional business letter style. Polished but not stiff or archaic.",
};

const WRITING_GUARDRAILS = `
Writing quality (required):
- Sound human, direct, and specific — like a strong candidate wrote it themselves.
- Connect 1-2 real experiences or skills from the resume to what the role needs. Name tools, projects, or outcomes only if they appear on the resume.
- Keep paragraphs short (2-4 sentences each). Use simple sentence structure.
- The letter should be easy to edit; avoid locked-in template language.

Avoid:
- Opening clichés: "I am excited to apply", "I am writing to express my interest", "I was thrilled to see"
- Empty enthusiasm: "dream role", "perfect fit", "passionate about your mission", "unique opportunity"
- Exaggerated claims the resume cannot support
- Buzzword stuffing and corporate jargon blocks
- Repetitive phrases across paragraphs
- Overly dramatic or salesy tone, even when tone is "enthusiastic"
- Generic letters that could be sent to any company without changes

Do not invent experience, employers, awards, or skills.
`;

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
    system: `You are an expert career coach writing tailored cover letters for job applicants.
Write in a ${input.tone} tone. Tone guidance: ${TONE_GUIDANCE[input.tone]}
Return ONLY valid JSON matching this exact shape:
${JSON_SHAPE}

Rules:
- Base every claim on the provided resume — do not invent experience
- Reference specific skills, projects, or outcomes from the resume that match the job (only what is actually there)
- bodyParagraphs: 1-3 paragraphs; each should add something distinct
- fullCoverLetter: concatenate all sections in order with blank lines between paragraphs
- subjectLine: simple and professional (e.g., "Application for [Role title]")
- Do not include markdown, code fences, or extra keys
${WRITING_GUARDRAILS}`,

    user: `${companyLine}
${roleLine}
Tone: ${input.tone}

## Job description

${input.jobDescription}

## Resume

${input.resumeText}`,
  };
}
