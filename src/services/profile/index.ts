import { promises as fs } from "fs";
import path from "path";
import {
  userProfileSchema,
  type UserProfile,
  type ExperienceLevel,
  type RemotePreference,
} from "@/types/profile";

const DATA_FILE = path.join(process.cwd(), "data", "profile.json");

export function createDefaultProfile(): UserProfile {
  return {
    targetRoles: [],
    targetLocations: [],
    remotePreference: "any",
    coreSkills: [],
    preferredKeywords: [],
    excludedKeywords: [],
    experienceLevel: "entry",
    updatedAt: new Date().toISOString(),
  };
}

async function readProfileFile(): Promise<UserProfile> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return userProfileSchema.parse(JSON.parse(raw));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT") {
      return createDefaultProfile();
    }

    throw error;
  }
}

async function writeProfileFile(profile: UserProfile): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(profile, null, 2), "utf-8");
}

/**
 * Returns the saved profile or sensible defaults if none exists yet.
 */
export async function getProfile(): Promise<UserProfile> {
  return readProfileFile();
}

export type UpdateProfileInput = {
  fullName?: string;
  targetRoles: string[];
  targetLocations: string[];
  remotePreference: RemotePreference;
  coreSkills: string[];
  preferredKeywords: string[];
  excludedKeywords?: string[];
  experienceLevel: ExperienceLevel;
  resumeText?: string;
};

/**
 * Replaces the stored profile (single-user MVP).
 */
export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const profile: UserProfile = {
    fullName: input.fullName?.trim() || undefined,
    targetRoles: input.targetRoles,
    targetLocations: input.targetLocations,
    remotePreference: input.remotePreference,
    coreSkills: input.coreSkills,
    preferredKeywords: input.preferredKeywords,
    excludedKeywords: input.excludedKeywords?.length
      ? input.excludedKeywords
      : undefined,
    experienceLevel: input.experienceLevel,
    resumeText: input.resumeText?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  const validated = userProfileSchema.parse(profile);
  await writeProfileFile(validated);

  return validated;
}
