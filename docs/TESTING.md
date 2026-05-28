# Testing Guide

StudyForge has a unit test suite (Vitest) for core logic and a manual testing checklist for UI flows. Automated integration tests (Playwright) are planned and a great area for contributors.

---

## Running Tests

```bash
pnpm test          # run all tests once (CI mode)
pnpm test:watch    # watch mode for development
```

All PRs must pass `pnpm test` with zero failures before merging.

---

## Manual Testing Checklist

Use this checklist before submitting any PR that touches application logic.

### Setup

```bash
pnpm install
pnpm dev         # starts on http://localhost:3000
```

Ensure your `.env.local` has valid Supabase credentials and at least one AI provider key.

---

### 1. Landing page

- [ ] Page loads at `http://localhost:3000`
- [ ] "Get Started" button navigates to `/create`
- [ ] "View on GitHub" link opens the correct GitHub repo
- [ ] Dark mode renders correctly (if OS is set to dark)

### 2. Create page (`/create`)

- [ ] Page loads without console errors
- [ ] University, Course Name fields show validation errors if submitted empty
- [ ] Accepted file types: `.pdf`, `.pptx`, `.ppt`, `.docx` — these should upload
- [ ] Rejected file types: `.txt`, `.jpg`, `.xlsx` — these should be silently ignored by the dropzone
- [ ] Files larger than 50 MB should be rejected
- [ ] Up to 20 files can be added for lecture slides
- [ ] "Include past exam papers" toggle shows/hides the second dropzone
- [ ] Submit button is enabled once the form is valid and a file is added
- [ ] Progress bar appears during upload
- [ ] On success, redirects to `/session/[id]`

### 3. Generation viewer (`/session/[id]`)

- [ ] Page loads and immediately starts generation (POST to `/api/generate`)
- [ ] Status banner shows "Searching web..." then "Generating..."
- [ ] Topics tab: sections appear progressively as the AI streams
- [ ] Sidebar TOC appears on desktop (≥768px) once sections arrive
- [ ] Clicking a TOC item scrolls to that section
- [ ] Expected Questions tab: questions appear with difficulty badges
- [ ] Clicking a question expands the model answer
- [ ] Quiz tab: shows question count and "Start Quiz" button after generation completes
- [ ] Download Topics → downloads a PDF
- [ ] Download Questions → downloads a PDF
- [ ] Download Quiz → downloads a PDF
- [ ] PDFs contain: header, watermark, page numbers, readable content (no raw markdown)

### 4. Quiz runner (`/quiz/[id]`)

- [ ] Page loads and shows first question
- [ ] Progress bar advances on each question
- [ ] MCQ: clicking an option reveals correct/incorrect state immediately
- [ ] MCQ: correct option highlights green, wrong option highlights red
- [ ] MCQ: explanation text appears after selecting
- [ ] MCQ: cannot change answer after selecting (locked)
- [ ] Short answer: text box accepts input
- [ ] Back button is disabled on first question
- [ ] Next button advances to next question
- [ ] Last question shows "Submit Quiz" instead of "Next"
- [ ] Submit shows score screen with percentage
- [ ] Retry button resets the quiz
- [ ] "New study pack" navigates to `/create`

### 5. API routes (manual via curl or Postman)

**POST /api/sessions**
```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"university_name":"Test University","course_name":"Test Course","anon_token":"test-token-123"}'
# Should return: { "session_id": "<uuid>" }
```

**GET /api/quiz/[session_id]**
```bash
curl http://localhost:3000/api/quiz/<session_id>
# Should return quiz object with quiz_questions array, or 404 if not yet generated
```

---

## Running the Linter

```bash
pnpm lint
```

All PRs must pass lint with zero errors before merging.

---

## Running the Build

```bash
pnpm build
```

A successful build confirms:
- No TypeScript type errors
- No missing imports
- All pages can be statically analyzed by Next.js

---

## Automated Tests (Vitest)

Run with `pnpm test`. Currently covers:

| File | Tests |
|------|-------|
| `lib/ai/response-parser.ts` | 10 tests — clean JSON, fence stripping, `<think>` removal, jsonrepair fallback, prose extraction |

### Planned unit tests

| Target | What to test |
|--------|-------------|
| `lib/utils/chunk-text.ts` | Token budget stays within limit, empty input, single large chunk |
| `lib/utils/pdf-export.ts` | Functions return without throwing, correct filename patterns |
| `lib/hooks/useAnonymousSession.ts` | Token is generated and persisted in localStorage |

### Planned integration tests (Playwright)

| Flow | What to test |
|------|-------------|
| Full generation flow | Upload a small PDF → generate → topics appear |
| Quiz flow | Complete a quiz → score screen appears |
| PDF download | Click download → file is downloaded with correct MIME type |

Want to contribute tests? See the [good first issues](https://github.com/RishavRajSingh44/StudyForge/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) list.

---

## CI Checks

The following checks run automatically on every PR via GitHub Actions:

| Check | File | What it does |
|-------|------|-------------|
| Test | `.github/workflows/ci.yml` | Vitest unit tests |
| Lint & Build | `.github/workflows/ci.yml` | ESLint + Next.js build |
| Secret Scanning | `.github/workflows/security.yml` | Gitleaks scans all commits |
| Dependency Audit | `.github/workflows/security.yml` | pnpm audit --audit-level=high |
| CodeQL | `.github/workflows/security.yml` | Static security analysis |
| OpenSSF Scorecard | `.github/workflows/scorecard.yml` | OSS best-practice scoring |

All checks must pass before a PR can be merged.
