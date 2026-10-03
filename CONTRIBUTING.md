# Contributing to StudyForge

Thank you for your interest in contributing to StudyForge — an open-source AI study assistant for students.

Before you start, please read this guide fully. It will save you time and avoid frustration.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [CLA / Sign-off](#cla--sign-off)
3. [Before You Start](#before-you-start)
4. [Good First Issues](#good-first-issues)
5. [Development Setup](#development-setup)
6. [Project Structure](#project-structure)
7. [Workflow](#workflow)
8. [Commit Message Format](#commit-message-format)
9. [Pull Request Rules](#pull-request-rules)
10. [Testing Your Changes](#testing-your-changes)
11. [What We Won't Accept](#what-we-wont-accept)
12. [Security](#security)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms. Be kind, be constructive, be inclusive.

---

## CLA / Sign-off

By submitting a Pull Request you agree to the [Contributor License Agreement](./CLA.md) and the Developer Certificate of Origin. Add a sign-off to every commit:

```bash
git commit -s -m "feat: your message"
```

This adds `Signed-off-by: Your Name <email>` to the commit. PRs without sign-offs will not be merged.

---

## Before You Start

- **Open an issue first** for any non-trivial change (new feature, refactor, architecture change). Discuss the approach before writing code — this prevents wasted effort on rejected directions.
- **For bug fixes and typos**, you can go straight to a PR.
- Check [existing issues](https://github.com/RishavRajSingh44/StudyForge/issues) and [open PRs](https://github.com/RishavRajSingh44/StudyForge/pulls) to avoid duplicating work.

---

## Good First Issues

New to the codebase? These are well-scoped starting points that don't require deep knowledge of the whole system.

Look for issues tagged [`good first issue`](https://github.com/RishavRajSingh44/StudyForge/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) on GitHub. Here are some examples of the kind of work that falls into this category:

### Beginner-friendly areas

| Area | Example task |
|------|-------------|
| **UI copy** | Fix typos or improve placeholder text in form inputs |
| **Accessibility** | Add `aria-label` to icon-only buttons (Download, Remove file, etc.) |
| **Accessibility** | Fix color contrast — `text-orange-500` on white fails WCAG AA; shift to `orange-600` for text elements |
| **Landing page** | Add a footer with license info and GitHub link |
| **Error messages** | Make error messages in the create form more descriptive |
| **Dark mode** | Fix any components that don't respond correctly to dark mode |
| **README** | Improve setup instructions for Windows users |
| **PDF export** | Fix `stripInlineMarkdown` crash when `question`, `option`, or `explanation` fields are `undefined` — add a null guard so `undefined` returns `''` instead of throwing (`lib/utils/pdf-export.ts:251`) |
| **Quiz UX** | Show a "correct answer was X" message for short-answer questions on submit |
| **Unit tests** | Add Vitest tests for `lib/utils/chunk-text.ts` or `lib/hooks/useAnonymousSession.ts` (see [Testing Guide](./docs/TESTING.md)) |
| **Loading states** | Add a skeleton loader to the quiz page while the quiz is fetching |
| **Flashcards** | Add a Flashcards tab to the session viewer using existing `key_concepts` data — pure frontend, no API changes |
| **Pomodoro timer** | Add a built-in 25-min study timer to the session viewer — pure client-side, no backend |
| **i18n** | Extract UI strings to `messages/en.json` using `next-intl` and translate to one additional language |

If you're not sure where to start, open an issue and say "I'd like to contribute — what's a good first task?" and the maintainer will help you find something suitable.

---

## Development Setup

```bash
# 1. Fork the repo and clone your fork
git clone https://github.com/RishavRajSingh44/StudyForge.git
cd StudyForge

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.local.example .env.local
# Fill in Supabase credentials and at least one AI provider key
# NEVER commit .env.local

# 4. Set up Supabase
# Run migrations in supabase/migrations/ in order via the Supabase SQL editor
# Create a private Storage bucket named "uploads"

# 5. (Optional) Start Ollama for free local AI
ollama pull qwen3:30b
ollama serve

# 6. Start the dev server
pnpm dev
# Opens on http://localhost:3000
```

See the full [User Manual](./docs/MANUAL.md) for detailed setup instructions including Supabase, AI providers, and Tavily web search.

---

## Project Structure

```
app/
  (marketing)/        Landing page
  create/             Upload form + course input
  session/[id]/       Generation viewer (Topics, Questions, Quiz tabs)
  quiz/[id]/          Interactive quiz runner
  api/
    sessions/         Create / fetch sessions
    upload/           File upload → parse → chunk → save to Supabase
    generate/         Web search + AI generation + SSE stream
    quiz/[id]/        Fetch quiz + record attempt

lib/
  ai/                 AI provider waterfall (Ollama → Gemini → Claude → OpenAI)
                      Prompts, response parser
  parsers/            PDF, PPTX, DOCX text extraction
  stores/             Zustand stores (generation state, quiz state)
  utils/              Token budgeting, text chunking, PDF export
  supabase/           Supabase client (browser) and server (service role) helpers
  hooks/              useAnonymousSession, useSSE

components/
  session/            GenerationViewer — the main streaming output component
  ui/                 shadcn/ui components (Button, Badge, Tabs, etc.)

supabase/
  migrations/         001_initial_schema · 002_rls_policies · 003_indexes

types/                TypeScript interfaces for AI output, uploads, generation
docs/                 MANUAL.md, TESTING.md, diagrams
```

**Key files to understand first:**
- `lib/ai/prompts.ts` — the AI prompt that drives all output
- `lib/ai/provider.ts` — the AI provider waterfall
- `app/api/generate/route.ts` — the core generation pipeline
- `components/session/GenerationViewer.tsx` — the streaming UI

---

## Workflow

1. Fork the repository on GitHub
2. Create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   # or
   git checkout -b fix/your-bug
   # or
   git checkout -b docs/improve-readme
   ```
3. Make your changes
4. Run lint and confirm it passes:
   ```bash
   pnpm lint
   ```
5. Test your changes manually using the [Testing Guide](./docs/TESTING.md)
6. Commit with a sign-off and clear message:
   ```bash
   git commit -s -m "feat: add footer with license info"
   ```
7. Push to your fork:
   ```bash
   git push origin feat/your-feature
   ```
8. Open a Pull Request against `main` on the upstream repo

---

## Commit Message Format

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code change that isn't a fix or feature |
| `chore:` | Tooling, dependencies, config |
| `style:` | Formatting only, no logic change |
| `test:` | Adding or fixing tests |
| `ci:` | CI/CD workflow changes |

**Examples:**
```
feat: add dark mode toggle to header
fix: quiz MCQ options not matching correct answer on true_false questions
docs: add Windows setup instructions to MANUAL.md
test: add unit tests for response-parser
```

Keep the subject line under 72 characters. Use the body for more detail if needed.

---

## Pull Request Rules

- PRs must target `main`
- All PRs require **at least 1 approval** from the maintainer before merging
- New commits after approval **dismiss the previous review** — the PR must be re-approved
- Direct pushes to `main` are not allowed
- Keep PRs focused — **one feature or fix per PR**
- All CI checks must pass (Lint & Build, Secret Scanning, Dependency Audit, CodeQL)
- Every commit must have a `Signed-off-by:` line (see [CLA / Sign-off](#cla--sign-off))
- Update the README or MANUAL if your change affects setup, environment variables, or user-facing behaviour

---

## Testing Your Changes

See [docs/TESTING.md](./docs/TESTING.md) for:
- Manual testing checklist (use this before every PR)
- How to run `pnpm lint` and `pnpm build`
- Planned automated tests and how to contribute them

At minimum before submitting a PR:
```bash
pnpm lint    # must pass with zero errors
pnpm build   # must complete successfully
```

---

## What We Won't Accept

- Commits containing API keys, secrets, tokens, or credentials of any kind
- Breaking changes to the AI output JSON schema without a migration path for existing data
- New AI providers without graceful fallback behaviour
- Changes to existing `supabase/migrations/` files — add a new migration file instead
- `.env.local` or any file containing real credentials
- PRs without a `Signed-off-by:` line on every commit
- Code that removes or weakens security checks (RLS policies, secret scanning, audit)
- Large refactors or architecture changes without a prior issue discussion

---

## Security

If you find a security vulnerability, **do not open a public issue**. See [SECURITY.md](./SECURITY.md) for the responsible disclosure process.

---

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0 license](./LICENSE) that covers this project, as described in the [CLA](./CLA.md).
