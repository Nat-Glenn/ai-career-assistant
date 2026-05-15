# AGENTS.md

## Project Purpose

AI Career Assistant is an AI-powered job search and application automation platform.

The app helps users:

- Discover relevant jobs automatically
- Analyze job descriptions
- Tailor resumes
- Optimize resumes for ATS systems
- Generate cover letters
- Track applications
- Eventually assist with semi-automated applications

The goal is high-quality AI-assisted job searching, not blind mass application spam.

## Architecture Rules

- Use a monolithic Next.js architecture.
- Keep frontend pages, API routes, services, prompts, and types in one codebase.
- Use TypeScript throughout the project.
- Keep business logic out of React components.
- Place reusable business logic in `src/services`.
- Place prompt templates in `src/prompts`.
- Place shared TypeScript types in `src/types`.
- Place reusable utilities in `src/utils`.
- Place shared clients/configuration in `src/lib`.

## AI Development Rules

- Never expose OpenAI API keys to the browser.
- All AI calls must happen server-side.
- Prompts should be reusable and stored separately from API routes.
- Prefer structured JSON responses for AI outputs.
- Validate user input before sending it to AI services.
- AI-generated content should always be reviewable and editable by the user.
- Do not create fully autonomous job application submission in the MVP.

## MVP Priorities

Build in this order:

1. Project structure
2. Landing page
3. Job description analysis
4. Resume tailoring
5. ATS optimization
6. Cover letter generation
7. Application tracking
8. Job discovery engine
9. Browser automation later

## Coding Style

- Keep code beginner-friendly and readable.
- Prefer simple functions over complex abstractions.
- Avoid premature optimization.
- Avoid unnecessary libraries.
- Use clear file names.
- Use meaningful variable names.
- Add comments only where they clarify important decisions.

## What To Avoid

Do not add these in the MVP:

- Microservices
- Kubernetes
- Kafka
- Event-driven distributed systems
- Advanced AI agents
- Fully automated mass applying
- Complex RBAC
- Multi-region cloud architecture

## Cursor / AI Assistant Instructions

When generating code:

- Read `docs/requirements.md`, `docs/architecture.md`, and this file first.
- Work one step at a time.
- Do not build the whole app at once.
- Explain what files were created or changed.
- Explain why each change matters.
- Keep changes aligned with the documented architecture.
- Ask before introducing major new dependencies.
- Prioritize maintainability and interview-defensible decisions.