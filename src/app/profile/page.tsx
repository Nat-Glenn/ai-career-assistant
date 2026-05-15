import Link from "next/link";
import { ProfileForm } from "@/components/profile/profile-form";

export default function ProfilePage() {
  return (
    <div className="min-h-full">
      <header className="border-b border-card-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            ← Home
          </Link>
          <span className="text-sm font-medium text-foreground">Profile</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Career preferences
          </h1>
          <p className="mt-3 text-muted">
            Save your target roles, locations, skills, and resume so job
            discovery can match opportunities to you automatically later.
          </p>
        </div>

        <ProfileForm />
      </main>
    </div>
  );
}
