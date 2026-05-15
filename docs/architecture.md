# AI Career Assistant — Architecture

This document describes the technical architecture for **AI Career Assistant**, an AI-powered job search and application automation platform. It is designed to support the [requirements](./requirements.md) while remaining beginner-friendly, modular, and realistic for an MVP portfolio project.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [System Architecture](#2-system-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Major Modules](#4-major-modules)
5. [Data Flow](#5-data-flow)
6. [API Design Approach](#6-api-design-approach)
7. [AI Integration Strategy](#7-ai-integration-strategy)
8. [Data & Persistence](#8-data--persistence)
9. [Security Considerations](#9-security-considerations)
10. [Future Scalability](#10-future-scalability)
11. [Deployment Considerations](#11-deployment-considerations)

---

## 1. Architecture Overview

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Monolith first** | Single Next.js application handles UI, API routes, and server logic |
| **Server-side AI** | All OpenAI calls run on the server; API keys never reach the browser |
| **Modular boundaries** | Clear separation between UI, services, prompts, and data access |
| **Human in the loop** | AI generates suggestions; users review and edit before use |
| **Progressive complexity** | MVP uses simple storage; database and background jobs added later |

### Technology Stack (MVP)

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | OpenAI API (GPT models) |
| Runtime | Node.js (Vercel or similar) |
| Version control | GitHub |

### What We Intentionally Avoid (MVP)

- Microservices, Kubernetes, Kafka, or event-driven distributed systems
- Fully autonomous job applications or mass-application spam workflows
- Overengineered multi-agent orchestration

---

## 2. System Architecture

AI Career Assistant follows a **monolithic Next.js architecture**: one deployable application with logical modules inside the codebase.

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  React UI · Tailwind · Forms · Review/Edit workflows             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js Application (Monolith)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ App Router   │  │ API Routes   │  │ Server Actions (opt.)  │ │
│  │ (Pages/UI)   │  │ Route        │  │                        │ │
│  │              │  │ Handlers     │  │                        │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘ │
│         │                 │                       │              │
│         └─────────────────┼───────────────────────┘              │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Service Layer                            │ │
│  │  Job Discovery · Job Analysis · Resume · Cover Letter ·     │ │
│  │  Application Tracking                                       │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│                               ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              AI Layer (OpenAI Client + Prompts)             │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│                               ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Data Layer (MVP: JSON/file · Future: PostgreSQL)    │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   OpenAI API         Job Sources          (Future: DB, S3)
   (GPT)              (HTTP, RSS, APIs)
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|------------------|
| **Presentation** | Pages, layouts, forms, dashboards, output review UI |
| **API / Server** | Request validation, orchestration, error handling |
| **Services** | Business logic: discovery, analysis, tailoring, tracking |
| **AI** | Prompt templates, model calls, response parsing |
| **Data** | Persistence for jobs, applications, user content |

---

## 3. Folder Structure

Recommended **App Router + `src/` directory** layout. Next.js supports `src/app/` out of the box; keeping application code under `src/` separates product code from repo-level config and scales cleanly as the project grows.

> **Note:** A root-level `app/` layout works for early scaffolding. Prefer migrating to `src/` before the codebase grows—paths below assume the `src/` structure.

```text
ai-career-assistant/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout, fonts, global providers
│   │   ├── page.tsx              # Landing / dashboard home
│   │   ├── globals.css           # Tailwind imports
│   │   │
│   │   ├── jobs/                 # Job discovery & listing
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx     # Job detail + analysis
│   │   │
│   │   ├── resume/               # Resume tailoring workflow
│   │   │   └── page.tsx
│   │   │
│   │   ├── cover-letter/         # Cover letter generation
│   │   │   └── page.tsx
│   │   │
│   │   ├── applications/         # Application tracking (Kanban/list)
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   │
│   │   └── api/                  # Route Handlers (REST-style)
│   │       ├── jobs/
│   │       │   ├── route.ts      # GET list, POST discover/sync
│   │       │   └── [id]/route.ts
│   │       ├── jobs/[id]/analyze/
│   │       │   └── route.ts
│   │       ├── resume/
│   │       │   ├── tailor/route.ts
│   │       │   └── ats-optimize/route.ts
│   │       ├── cover-letter/
│   │       │   └── generate/route.ts
│   │       └── applications/
│   │           ├── route.ts
│   │           └── [id]/route.ts
│   │
│   ├── components/               # Reusable UI
│   │   ├── ui/                   # Buttons, inputs, cards, modals
│   │   ├── jobs/                 # Job cards, filters, detail panels
│   │   ├── resume/               # Upload, diff view, suggestions
│   │   ├── cover-letter/         # Editor, tone selector
│   │   └── applications/         # Status board, notes
│   │
│   ├── lib/                      # Shared utilities (no React)
│   │   ├── openai.ts             # OpenAI client singleton
│   │   ├── validators.ts         # Zod schemas for API inputs
│   │   └── utils.ts              # Formatting, dates, IDs
│   │
│   ├── services/                 # Business logic (framework-agnostic)
│   │   ├── job-discovery/
│   │   │   ├── index.ts          # Orchestrator
│   │   │   ├── sources/          # Per-source connectors (public feeds/APIs)
│   │   │   │   ├── greenhouse.ts
│   │   │   │   ├── lever.ts
│   │   │   │   └── remote-boards.ts
│   │   │   ├── dedupe.ts
│   │   │   └── scoring.ts
│   │   ├── job-analysis/
│   │   │   └── index.ts
│   │   ├── resume/
│   │   │   ├── tailor.ts
│   │   │   └── ats-optimize.ts
│   │   ├── cover-letter/
│   │   │   └── generate.ts
│   │   └── applications/
│   │       └── tracker.ts
│   │
│   ├── prompts/                  # AI prompt templates (versioned text)
│   │   ├── job-analysis.ts
│   │   ├── resume-tailor.ts
│   │   ├── ats-optimize.ts
│   │   ├── cover-letter.ts
│   │   └── job-scoring.ts
│   │
│   └── types/                    # Shared TypeScript types
│       ├── job.ts
│       ├── resume.ts
│       ├── application.ts
│       └── api.ts
│
├── data/                         # MVP persistence (gitignored in prod)
│   └── .gitkeep
│
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   └── roadmap.md
│
├── public/                       # Static assets
├── .env.local                    # Secrets (never committed)
├── .env.example                  # Documented env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Folder Conventions

- **`src/app/`** — Routing and page composition only; minimal business logic.
- **`src/components/`** — Presentational and lightly stateful UI; call APIs or receive props.
- **`src/services/`** — Core domain logic; callable from API routes and future background jobs.
- **`src/prompts/`** — Plain prompt builders; no UI imports.
- **`src/lib/`** — Cross-cutting utilities and third-party client setup.

---

## 4. Major Modules

### 4.1 Job Discovery Engine

**Purpose:** Aggregate job listings from **publicly accessible sources**—official APIs, public job board endpoints, RSS feeds, and employer-hosted career pages that expose listings without authentication.

| Component | Role |
|-----------|------|
| **Source connectors** | One module per allowed source type (Greenhouse public boards, Lever, RSS, documented public APIs) |
| **Orchestrator** | Runs connectors, merges results, handles failures gracefully |
| **Dedupe** | Normalizes URLs/titles/companies to remove duplicates |
| **Scoring** | Ranks jobs by relevance (keywords, role, remote preference) |

**MVP scope:** Start with 2–3 reliable, ToS-friendly sources (e.g., Greenhouse public job boards, a remote job RSS feed). Add connectors incrementally only where access is explicitly permitted.

**Future:** Scheduled cron jobs or a background worker to refresh listings without blocking HTTP requests.

#### Public aggregation policy (important)

When describing this system—in docs, README, or interviews—frame job discovery as **public job aggregation**, not aggressive scraping:

| Do say | Avoid implying |
|--------|----------------|
| Public APIs and RSS feeds | Bypassing anti-bot or CAPTCHA systems |
| Official ATS boards (Greenhouse, Lever) with public listings | Circumventing login walls or paywalls |
| Respecting rate limits, `robots.txt`, and terms of service | Violating a platform’s terms of service |
| User-triggered or scheduled sync of allowed sources | “Scraping anything on the web” |

Sources such as Workday or arbitrary company career sites may be supported **only** when listings are publicly reachable via documented APIs, feeds, or pages the site permits automated access to. If a source requires authenticated sessions, obfuscated endpoints, or ToS-prohibited automation, **do not integrate it**—link users to apply on the employer site instead.

---

### 4.2 Job Description Analysis

**Purpose:** Parse and structure job postings for downstream tailoring.

**Outputs:**

- Skills (technical and soft)
- Responsibilities summary
- Experience level estimate
- ATS keyword list
- Resume–job match score (when resume provided)

**Implementation:** Service calls OpenAI with a structured JSON prompt; validates response with Zod.

---

### 4.3 Resume Tailoring & ATS Optimization

**Purpose:** Improve resume alignment with a specific job description.

| Feature | Behavior |
|---------|----------|
| **Tailoring** | Rewrite bullet points, suggest missing keywords |
| **ATS optimization** | Highlight keyword gaps, phrasing improvements |
| **Review** | Return editable suggestions, not silent overwrites |

**Inputs:** Resume text (paste or upload), job description or analyzed job ID.

---

### 4.4 Cover Letter Generation

**Purpose:** Generate personalized, editable cover letters.

**Inputs:** Job context, resume summary, tone preference, optional company notes.

**Output:** Draft letter with clear sections; user edits in UI before export.

---

### 4.5 Application Tracking

**Purpose:** Central CRM-style tracking for job applications.

**Tracked fields:**

- Company, role title, application URL
- Status (saved, applied, interview, offer, rejected)
- Dates (applied, follow-up)
- Recruiter info, notes, reminders

**MVP:** Local JSON file or in-memory store with API CRUD. **Future:** PostgreSQL via Prisma.

---

## 5. Data Flow

### 5.1 End-to-End Career Workflow

```text
[Job Sources] ──► Job Discovery Service ──► Job Store
                                              │
                                              ▼
                                    Job Listing UI / Filters
                                              │
                         User selects job ────┘
                                              │
                                              ▼
                              Job Analysis Service (OpenAI)
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            Resume Tailor            ATS Optimize           Cover Letter Gen
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              ▼
                                    User Review & Edit
                                              │
                                              ▼
                              Application Tracker (save status)
```

### 5.2 Typical Request Flow (API Route)

```text
Browser → POST /api/resume/tailor
            │
            ▼
      Route Handler
        · validate body (Zod)
        · call resumeService.tailor()
            │
            ▼
      Resume Service
        · load prompt from src/prompts/resume-tailor.ts
        · call OpenAI via src/lib/openai.ts
        · parse & validate JSON response
            │
            ▼
      Return JSON → UI renders suggestions
```

### 5.3 Job Discovery Flow (MVP)

```text
User or cron trigger → POST /api/jobs (discover)
            │
            ▼
      Job Discovery Orchestrator
        · parallel fetch from public source connectors
        · normalize to common Job type
        · dedupe + score
        · persist to data store
            │
            ▼
      GET /api/jobs → UI displays results
```

---

## 6. API Design Approach

### Style

- **REST-like Route Handlers** under `src/app/api/`
- **JSON** request and response bodies
- **Consistent error shape** for client handling

### Example Endpoints (MVP)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/jobs` | List discovered jobs (optional filters) |
| `POST` | `/api/jobs` | Trigger job discovery sync |
| `GET` | `/api/jobs/[id]` | Job detail |
| `POST` | `/api/jobs/[id]/analyze` | Run job description analysis |
| `POST` | `/api/resume/tailor` | Tailor resume to job |
| `POST` | `/api/resume/ats-optimize` | ATS keyword suggestions |
| `POST` | `/api/cover-letter/generate` | Generate cover letter |
| `GET` | `/api/applications` | List tracked applications |
| `POST` | `/api/applications` | Create application record |
| `PATCH` | `/api/applications/[id]` | Update status, notes, dates |

### Request Validation

Use **Zod** schemas in `src/lib/validators.ts` shared between routes and optionally client forms.

```typescript
// Example shape (illustrative)
const tailorResumeSchema = z.object({
  resume: z.string().min(50),
  jobDescription: z.string().min(50),
  jobId: z.string().optional(),
});
```

### Response Conventions

```typescript
// Success
{ "data": { ... } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

### Rate Limiting & Cost Control (Recommended)

- Debounce AI-triggering actions in the UI
- Enforce max input length on resume and job description fields
- Consider simple per-IP or per-session rate limits on AI routes before public launch

---

## 7. AI Integration Strategy

### Principles

1. **Server-only** — `OPENAI_API_KEY` in environment variables; client never sees the key.
2. **Prompts as code** — Templates live in `src/prompts/`; version with git.
3. **Structured outputs** — Prefer JSON mode or explicit JSON schemas for parsing.
4. **Validate everything** — Parse AI responses with Zod before returning to UI.
5. **Fail gracefully** — Timeouts, retries (limited), and user-friendly error messages.

### OpenAI Client Setup

```typescript
// src/lib/openai.ts — single shared client
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### Model Selection (Guidance)

| Use case | Suggested approach |
|----------|-------------------|
| Job analysis, tailoring, cover letters | `gpt-4o-mini` for MVP cost efficiency |
| Complex multi-step reasoning | Upgrade to `gpt-4o` selectively |
| Embeddings (future matching) | `text-embedding-3-small` |

### Prompt Organization

Each file in `src/prompts/` exports functions that return system + user messages:

```typescript
// src/prompts/job-analysis.ts
export function buildJobAnalysisPrompt(jobDescription: string) {
  return {
    system: "You are an expert career coach and ATS analyst...",
    user: `Analyze this job description and return JSON with: skills, ...\n\n${jobDescription}`,
  };
}
```

Keep prompts **focused** (one task per call) rather than one mega-prompt for the entire workflow.

### AI Task Matrix

| Task | Input | Output |
|------|-------|--------|
| Job analysis | Job description text | Structured skills, summary, keywords |
| Resume tailor | Resume + job analysis | Bullet rewrites, gap list |
| ATS optimize | Resume + keywords | Suggestions, keyword coverage |
| Cover letter | Resume + job + tone | Draft letter sections |
| Job scoring | Job + user preferences | Relevance score + rationale |

### Human Review

All generative endpoints return **draft content** for display in editable UI components. The application does not auto-submit applications or overwrite user files without explicit action.

---

## 8. Data & Persistence

### MVP (Simple)

| Data | MVP approach |
|------|----------------|
| Discovered jobs | JSON file under `data/jobs.json` or lightweight SQLite |
| Applications | JSON file under `data/applications.json` |
| User profile / resume | Session or localStorage for single-user demo; optional server file |

Suitable for portfolio demos and single-user local development.

### Future (Multi-user)

| Data | Future approach |
|------|-----------------|
| All entities | PostgreSQL + Prisma |
| Resume files | Object storage (S3, R2) |
| Auth | NextAuth.js or Clerk |

Design services behind interfaces so swapping JSON files for a database does not require rewriting UI or AI logic.

---

## 9. Security Considerations

| Concern | Mitigation |
|---------|------------|
| API key exposure | Keys only in server env; never `NEXT_PUBLIC_*` for OpenAI |
| Input abuse | Max length limits, validation, rate limiting on AI routes |
| Job source compliance | Use only publicly accessible, permitted sources; respect `robots.txt`, rate limits, and terms of service; no anti-bot bypass |
| User data | Sanitize logs; do not log full resumes in production |
| Dependencies | Keep Next.js and OpenAI SDK updated |

---

## 10. Future Scalability

The monolith can grow incrementally without a full rewrite.

### Phase 1 — MVP (Current)

- Monolithic Next.js on Vercel
- File-based or SQLite persistence
- Synchronous job discovery on user action
- OpenAI for all intelligence

### Phase 2 — Growth

| Need | Approach |
|------|----------|
| Persistent multi-user data | PostgreSQL + Prisma |
| Authentication | NextAuth / Clerk |
| Scheduled public source sync | Background jobs (Vercel Cron, Inngest, or BullMQ + worker) |
| File uploads | S3-compatible storage |
| Caching | Redis for job listings and rate limits |

### Phase 3 — Advanced (Post-MVP)

| Need | Approach |
|------|----------|
| Browser automation | Playwright in isolated worker or serverless with care |
| Semantic job matching | Embeddings + vector search (pgvector) |
| Observability | Structured logging, Sentry, analytics |
| Multi-tenant scale | Still one app; optimize DB indexes and job queue concurrency |

### What Stays the Same

- `src/services/` and `src/prompts/` modules remain the core
- API route contracts can remain stable while storage changes underneath
- No requirement to split into microservices until team and traffic justify it

```text
MVP Monolith ──► Monolith + DB + Cron ──► Monolith + Workers + DB
     │                    │                        │
     └────────────────────┴────────────────────────┘
              Same codebase, added infrastructure
```

---

## 11. Deployment Considerations

### Recommended Platform (MVP)

**Vercel** — Native Next.js support, environment variables, serverless API routes, zero Kubernetes overhead.

### Environment Variables

```bash
# .env.example
OPENAI_API_KEY=sk-...
# Future
DATABASE_URL=postgresql://...
```

### Build & Deploy Flow

```text
GitHub push → Vercel build → Deploy preview (PR) / production (main)
```

### Production Checklist

- [ ] Set `OPENAI_API_KEY` in Vercel project settings
- [ ] Add `.env.example` documenting required variables
- [ ] Configure error boundaries and API error logging
- [ ] Set reasonable timeouts on AI routes (e.g., 60s max duration)
- [ ] Enable HTTPS only (default on Vercel)
- [ ] Add basic monitoring (Vercel Analytics, optional Sentry)

### Job Discovery in Production

- Run discovery via **Vercel Cron** (`vercel.json`) or manual sync button for MVP
- Avoid long-running aggregation jobs inside user-facing request paths; return quickly with “sync in progress” if needed later

### Cost Awareness

- OpenAI usage scales with traffic; monitor token usage per feature
- Cache analyzed job results by job ID to avoid duplicate analysis calls
- Use smaller models for MVP unless quality requires upgrade

---

## Summary

AI Career Assistant is architected as a **single Next.js monolith** with clear module boundaries under `src/`: UI in `src/app/` and `src/components/`, business logic in `src/services/`, AI in `src/prompts/` + `src/lib/openai.ts`, and APIs in `src/app/api/`. Job discovery is **public aggregation from permitted sources**—not unrestricted scraping. The MVP prioritizes **job discovery, analysis, resume tailoring, ATS optimization, cover letters, and application tracking** with server-side OpenAI integration and human review at every generative step.

The structure supports a portfolio-ready MVP today and a credible path toward PostgreSQL, background jobs, and browser automation tomorrow—without microservices, Kubernetes, or distributed complexity in the initial release.

---

## Related Documents

- [Requirements](./requirements.md)
- [Roadmap](./roadmap.md)
- [Prompts](./prompts.md)
