import { z } from "zod";

/** Allowed writing tones for cover letter generation. */
export const coverLetterToneSchema = z.enum([
  "professional",
  "friendly",
  "enthusiastic",
  "formal",
]);

export type CoverLetterTone = z.infer<typeof coverLetterToneSchema>;

/**
 * Structured cover letter result returned by the AI service.
 * Sections are split so the UI can display and edit each part later.
 */
export const coverLetterResultSchema = z.object({
  subjectLine: z.string(),
  openingParagraph: z.string(),
  bodyParagraphs: z.array(z.string()).min(1),
  closingParagraph: z.string(),
  fullCoverLetter: z.string(),
});

export type CoverLetterResult = z.infer<typeof coverLetterResultSchema>;
