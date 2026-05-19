# StudyForge — User Manual

## Table of Contents

1. [What StudyForge Does](#1-what-studyforge-does)
2. [How to Download and Run Locally](#2-how-to-download-and-run-locally)
3. [Setting Up Supabase](#3-setting-up-supabase)
4. [Setting Up AI Providers](#4-setting-up-ai-providers)
5. [Using the App](#5-using-the-app)
6. [Understanding Your Study Pack](#6-understanding-your-study-pack)
7. [Downloading PDFs](#7-downloading-pdfs)
8. [Taking the Quiz](#8-taking-the-quiz)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. What StudyForge Does

StudyForge takes your lecture slides (PDF, PPTX, DOCX) and generates:

- **Structured study notes** — sections with exam tips, memory tricks, examples
- **Expected exam questions** — 15+ questions with model answers, difficulty, and mark weightage
- **Interactive quiz** — 20+ questions (MCQ and short answer) with instant feedback

It also searches the internet for your specific course syllabus and exam format before generating, so the output is tailored to your university — not generic.

---

## 2. How to Download and Run Locally

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| pnpm | latest | `npm install -g pnpm` |
| Git | any | [git-scm.com](https://git-scm.com) |
| Supabase account | free | [supabase.com](https://supabase.com) |
| Ollama (optional) | latest | [ollama.com](https://ollama.com) |

### Step-by-step

```bash
# 1. Clone the repository
git clone https://github.com/RishavRajSingh44/StudyForge.git
cd StudyForge

# 2. Install dependencies
pnpm install

# 3. Copy the environment template
cp .env.local.example .env.local
```

Open `.env.local` in any text editor and fill in your values (see sections 3 and 4 below).

```bash
# 4. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production build

```bash
pnpm build      # builds the Next.js app
pnpm start      # starts the production server on port 3000
```

### Deploy to Vercel (recommended for cloud hosting)

```bash
npm install -g vercel
vercel
```

Follow the prompts. Add all environment variables from `.env.local` in the Vercel dashboard under **Project → Settings → Environment Variables**.

> **Note:** Ollama cannot run on Vercel (serverless). Configure at least one cloud AI provider (Gemini recommended — free tier available).

---

## 3. Setting Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**, give it a name, and choose a region close to you.
3. Once the project is ready, go to **Project Settings → API**:
   - Copy **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon / public key** → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role / secret key** → paste as `SUPABASE_SERVICE_ROLE_KEY`

4. Run the database migrations — go to **SQL Editor** in Supabase and run each file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_indexes.sql`

5. Create the storage bucket — go to **Storage** and create a new bucket:
   - Name: `uploads`
   - Public: **No** (keep it private)

---

## 4. Setting Up AI Providers

StudyForge tries providers in this order. Configure at least one.

### Ollama (free, local, recommended for self-hosting)

```bash
# Install from ollama.com, then:
ollama pull qwen3:30b          # primary model (~19 GB)
ollama pull qwen2.5:14b        # fallback model (~9 GB)
ollama serve                   # starts on http://localhost:11434
```

No API key needed. Leave `OLLAMA_MODEL` and `OLLAMA_FALLBACK_MODEL` at their defaults or set them in `.env.local`.

### Google Gemini (free tier available)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API key**
3. Copy the key → paste as `GEMINI_API_KEY` in `.env.local`

### Anthropic Claude (paid)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Paste as `ANTHROPIC_API_KEY` in `.env.local`

### OpenAI GPT-4o (paid)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Paste as `OPENAI_API_KEY` in `.env.local`

### Web Search — Tavily (strongly recommended)

Without Tavily, generation works but is less course-specific.

1. Go to [tavily.com](https://tavily.com) and create a free account
2. Copy your API key → paste as `TAVILY_API_KEY` in `.env.local`

---

## 5. Using the App

### Creating a study pack

1. Go to [http://localhost:3000](http://localhost:3000) and click **Get Started**.
2. Enter your **University / College** name (e.g. `MIT`, `IIT Delhi`, `Oxford`).
3. Enter your **Course Name** (e.g. `Data Structures and Algorithms`).
4. Optionally enter your **Course Code** (e.g. `CS301`) — this improves web search accuracy.
5. Upload your **lecture slides** — drag and drop or click to browse. Supports PDF, PPTX, PPT, DOCX. Up to 20 files, 50 MB each.
6. Optionally upload **past exam papers** — click `+ Include past exam papers` and upload PDFs of previous exams. This significantly improves expected question quality.
7. Click **Generate my study pack →**.

Generation takes 30–90 seconds depending on your AI provider and document size.

---

## 6. Understanding Your Study Pack

### Notes tab

- **Sections** — topic-by-topic breakdown of your lecture content
- **Exam Tips** — highlighted in an orange box below each section
- **Sidebar TOC** — click any section title to jump to it

### Expected Questions tab

- Each question shows difficulty (easy / medium / hard) as a coloured badge
- Click any question to expand the **model answer**
- Questions are ordered by exam probability

### Quiz tab

- Shows total question count and a **Start Quiz** button
- Click to go to the interactive quiz runner

---

## 7. Downloading PDFs

Every tab has a **Download** button in the top-right corner:

| Button | Downloads |
|--------|-----------|
| Download Notes | All study notes as a branded PDF |
| Download Questions | All expected questions + model answers as PDF |
| Download Quiz | All quiz questions + answers as PDF |

PDFs include:
- StudyForge orange header
- Course title and generation date
- Diagonal StudyForge watermark
- Page numbers

---

## 8. Taking the Quiz

1. From the Quiz tab, click **Start Quiz →**.
2. For **MCQ questions** — click any option. The correct answer highlights green immediately. Your selection highlights red if wrong. An explanation appears below.
3. For **short answer questions** — type your answer in the text box.
4. Use **Back** and **Next** to navigate between questions. The progress bar at the top tracks your position.
5. On the last question, click **Submit Quiz** to see your score.
6. The results screen shows your score, percentage, and a performance message.
7. Click **Retry** to attempt the same quiz again, or **New study pack** to start fresh.

---

## 9. Troubleshooting

### "Failed to start generation"

- Check that your Supabase credentials in `.env.local` are correct.
- Check that at least one AI provider key is set.
- If using Ollama, make sure `ollama serve` is running and the model is pulled.

### Generation produces empty notes

- The AI may have returned malformed JSON. Try generating again.
- If you are using Ollama with a smaller model (e.g. `qwen2.5:7b`), switch to a larger model for better JSON compliance.

### Files fail to upload

- Check that the `uploads` Storage bucket exists in Supabase and is set to **private**.
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly — the upload route uses this key to write to Storage.
- File must be under 50 MB and in a supported format (PDF, PPTX, PPT, DOCX).

### Quiz shows "Quiz not found"

- The quiz is generated at the end of the AI generation pipeline. If generation failed or was interrupted, the quiz may not have been saved.
- Go back to your session page and check if the Quiz tab shows questions. If it does, click Start Quiz again.

### Hydration mismatch warning in browser console

- This is a cosmetic warning about the submit button's disabled state on first render. It does not affect functionality and can be safely ignored.

### pnpm install fails

- Make sure you are using Node.js 18 or later: `node --version`
- Delete `node_modules` and `pnpm-lock.yaml` and run `pnpm install` again.
