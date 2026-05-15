import { promises as fs } from "fs";
import path from "path";
import {
  applicationListSchema,
  type Application,
  type ApplicationStatus,
} from "@/types/application";

/** MVP storage path — JSON file on disk (no database yet). */
const DATA_FILE = path.join(process.cwd(), "data", "applications.json");

export class ApplicationNotFoundError extends Error {
  constructor(id: string) {
    super(`Application not found: ${id}`);
    this.name = "ApplicationNotFoundError";
  }
}

async function readApplications(): Promise<Application[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return applicationListSchema.parse(JSON.parse(raw));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, "[]", "utf-8");
      return [];
    }
    throw error;
  }
}

async function writeApplications(applications: Application[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(applications, null, 2), "utf-8");
}

export async function listApplications(): Promise<Application[]> {
  const applications = await readApplications();
  return applications.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getApplication(id: string): Promise<Application> {
  const applications = await readApplications();
  const application = applications.find((item) => item.id === id);

  if (!application) {
    throw new ApplicationNotFoundError(id);
  }

  return application;
}

export type CreateApplicationInput = {
  companyName: string;
  roleTitle: string;
  jobUrl?: string;
  status?: ApplicationStatus;
  notes?: string;
  followUpDate?: string;
};

export async function createApplication(
  input: CreateApplicationInput,
): Promise<Application> {
  const applications = await readApplications();
  const now = new Date().toISOString();

  const application: Application = {
    id: crypto.randomUUID(),
    companyName: input.companyName,
    roleTitle: input.roleTitle,
    jobUrl: input.jobUrl,
    status: input.status ?? "saved",
    notes: input.notes,
    followUpDate: input.followUpDate,
    createdAt: now,
    updatedAt: now,
  };

  applications.push(application);
  await writeApplications(applications);

  return application;
}

export type UpdateApplicationInput = {
  companyName?: string;
  roleTitle?: string;
  jobUrl?: string | null;
  status?: ApplicationStatus;
  notes?: string | null;
  followUpDate?: string | null;
};

export async function updateApplication(
  id: string,
  input: UpdateApplicationInput,
): Promise<Application> {
  const applications = await readApplications();
  const index = applications.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new ApplicationNotFoundError(id);
  }

  const existing = applications[index];
  const now = new Date().toISOString();

  const updated: Application = {
    ...existing,
    companyName: input.companyName ?? existing.companyName,
    roleTitle: input.roleTitle ?? existing.roleTitle,
    status: input.status ?? existing.status,
    updatedAt: now,
  };

  if (input.jobUrl !== undefined) {
    updated.jobUrl = input.jobUrl || undefined;
  }

  if (input.notes !== undefined) {
    updated.notes = input.notes || undefined;
  }

  if (input.followUpDate !== undefined) {
    updated.followUpDate = input.followUpDate || undefined;
  }

  applications[index] = updated;
  await writeApplications(applications);

  return updated;
}

export async function deleteApplication(id: string): Promise<void> {
  const applications = await readApplications();
  const index = applications.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new ApplicationNotFoundError(id);
  }

  applications.splice(index, 1);
  await writeApplications(applications);
}
