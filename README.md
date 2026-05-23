# StudyForge

> Open-source AI study assistant — upload your lecture slides and get exam-ready notes, expected questions, and an interactive quiz tailored to your university and course.

No account required. Works offline with a local Ollama model. Self-hostable.

[![CI](https://github.com/RishavRajSingh44/StudyForge/actions/workflows/ci.yml/badge.svg)](https://github.com/RishavRajSingh44/StudyForge/actions/workflows/ci.yml)
[![Security Scan](https://github.com/RishavRajSingh44/StudyForge/actions/workflows/security.yml/badge.svg)](https://github.com/RishavRajSingh44/StudyForge/actions/workflows/security.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/RishavRajSingh44/StudyForge/badge)](https://securityscorecards.dev/viewer/?uri=github.com/RishavRajSingh44/StudyForge)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-orange.svg)](./LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)

---

## Architecture

| Diagram | |
|---|---|
| Database Schema | ![Database Schema](docs/diagrams/StudyForge%20Database%20Schema.png) |

> PlantUML source files are in [`docs/diagrams/`](docs/diagrams/).

---

## Features

- **Course-aware generation** — enter your university and course code; the AI tailors everything to your institution's exam style
- **Web search augmentation** — automatically searches for your course syllabus, exam format, and lecture notes before generating
- **Multi-format upload** — PDF, PPTX, DOCX lecture slides and past exam papers (up to 20 files)
- **Structured study notes** — sections with exam tips, memory tricks, key concepts, and a revision sheet
- **Expected exam questions** — 15+ questions with model answers, difficulty, probability scores, mark weightage, and reasoning
- **Interactive quiz** — 20+ questions: MCQ, true/false, short answer, fill-in-the-blank, assertion-reason
- **PDF export** — download notes, questions, or quiz as a branded PDF with watermark
- **Streaming UI** — results stream in real time as the AI generates
- **Multi-provider AI** — Ollama (local/free) → Gemini → Claude → OpenAI, automatic fallback
- **No login required** — anonymous sessions work out of the box

---

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io) — `npm install -g pnpm`
- [Supabase](https://supabase.com) account (free tier works)
- At least one AI provider (see [AI Providers](#ai-providers))
- (Optional but recommended) [Ollama](https://ollama.com) for free local AI

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/RishavRajSingh44/StudyForge.git
cd studyforge

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local and fill in your keys (see Environment Variables below)

# 4. Set up Supabase
# - Create a project at supabase.com
# - Run the SQL migration files in order in the Supabase SQL editor:
#     supabase/migrations/001_initial_schema.sql
#     supabase/migrations/002_rls_policies.sql
#     supabase/migrations/003_indexes.sql
# - Create a private Storage bucket named "uploads"

# 5. (Optional) Start Ollama for free local AI
ollama pull qwen3:30b
ollama serve

# 6. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## AI Providers

StudyForge tries providers in this order and falls back automatically. At least one must be configured.

| Priority | Provider | Cost | Setup |
|---|---|---|---|
| 1 | **Ollama (local)** | Free | Install [Ollama](https://ollama.com), run `ollama pull qwen3:30b` |
| 2 | **Google Gemini** | Free tier available | Get key from [aistudio.google.com](https://aistudio.google.com) |
| 3 | **Anthropic Claude** | Paid | Get key from [console.anthropic.com](https://console.anthropic.com) |
| 4 | **OpenAI GPT-4o** | Paid | Get key from [platform.openai.com](https://platform.openai.com) |

Ollama is recommended for self-hosting — it's free, runs offline, and has no rate limits.

---

## Web Search

When `TAVILY_API_KEY` is configured, StudyForge runs **3 parallel searches** before every generation to make the output course-specific:

| Query | Purpose |
|---|---|
| `{course} {university} syllabus` | Align notes to actual syllabus topics |
| `{course} {university} exam format` | Match question style and mark distribution |
| `{course code} {university} lecture notes` | Pull in supplementary academic context |

Results are injected into the AI prompt alongside your uploaded slides. Without a key, generation falls back to uploaded materials only. Get a free Tavily key at [tavily.com](https://tavily.com).

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase publishable anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase secret service role key (server-only, never expose to client) |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL of the app e.g. `http://localhost:3000` |
| `OLLAMA_MODEL` | No | Primary local model (default: `qwen3:30b`) |
| `OLLAMA_FALLBACK_MODEL` | No | Fallback local model (default: `qwen2.5:14b`) |
| `GEMINI_API_KEY` | No | Google Gemini API key |
| `ANTHROPIC_API_KEY` | No | Anthropic Claude API key |
| `OPENAI_API_KEY` | No | OpenAI GPT-4o key |
| `TAVILY_API_KEY` | No | Tavily web search — strongly recommended |
| `BRAVE_SEARCH_API_KEY` | No | Brave Search — fallback if Tavily quota exhausted |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript strict |
| UI | Tailwind CSS v4 + shadcn/ui + Framer Motion |
| AI | Ollama · Google Gemini · Anthropic Claude · OpenAI GPT-4o |
| Database | Supabase (PostgreSQL 15 + Storage + Auth) |
| File parsing | pdf-parse · officeparser · mammoth (server-side, no third-party APIs) |
| Web search | Tavily · Brave Search |
| State | Zustand + SSE streaming |
| Validation | Zod + React Hook Form |
| PDF export | jsPDF (client-side, branded + watermark) |

---

## Project Structure

```
app/
  (marketing)/      Landing page
  create/           Upload + course input form
  session/[id]/     Generation viewer (notes, questions, quiz)
  quiz/[id]/        Interactive quiz runner
  api/
    sessions/       Create / fetch sessions
    upload/         File upload → parse → chunk → Supabase
    generate/       Web search + AI generation + SSE stream
    quiz/[id]/      Quiz fetch + attempt recording
lib/
  ai/               Claude, Gemini, Ollama, OpenAI providers + prompts + parser
  parsers/          PDF, PPTX, DOCX parsers
  stores/           Zustand stores
  utils/            Token budgeting, text chunking, PDF export
  supabase/         Client + server Supabase helpers
components/
  session/          GenerationViewer (streaming tabs + download buttons)
  ui/               shadcn/ui components
supabase/
  migrations/       001_initial_schema · 002_rls_policies · 003_indexes
types/              TypeScript interfaces for generation output, uploads
```

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide — including setup, workflow, commit format, and PR rules.

New to open source? Check the [Good First Issues](https://github.com/RishavRajSingh44/StudyForge/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) label for beginner-friendly tasks.

---

## Community

| Document | Purpose |
|----------|---------|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute code, docs, and fixes |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | Community standards and enforcement |
| [CLA.md](./CLA.md) | Contributor License Agreement |
| [SECURITY.md](./SECURITY.md) | How to report vulnerabilities |
| [docs/MANUAL.md](./docs/MANUAL.md) | Full user manual and download instructions |
| [docs/TESTING.md](./docs/TESTING.md) | Manual test checklist + planned automated tests |

---

## License

AGPL-3.0 — see [LICENSE](./LICENSE)

This means if you run a modified version of StudyForge as a network service, you must make your modified source code available to users. For commercial use without AGPL obligations, contact us for a commercial license.

