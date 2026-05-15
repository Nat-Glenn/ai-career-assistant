/** Application tracking shape (placeholder). */

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export type Application = {
  id: string;
  company: string;
  roleTitle: string;
  status: ApplicationStatus;
  applicationUrl?: string;
  appliedAt?: string;
  notes?: string;
};
