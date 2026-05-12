# Contributing to StudyForge

Thank you for your interest in contributing! Please read this guide before opening a PR.

---

## Before You Start

- **Open an issue first** for any non-trivial change (new feature, refactor, architecture change) so we can discuss the approach before you write code.
- For bug fixes and small improvements, you can go straight to a PR.
- Check existing issues and PRs to avoid duplicating work.

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
# Fill in your own API keys — never commit .env.local

# 4. Set up Supabase
# Run migrations in supabase/migrations/ in order via the Supabase SQL editor

# 5. Start dev server
pnpm dev
```

---

## Workflow

1. Fork the repo
2. Create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   # or
   git checkout -b fix/your-bug
   ```
3. Make your changes
4. Run the linter before committing:
   ```bash
   pnpm lint
   ```
5. Commit with a clear message (see below)
6. Push to your fork and open a Pull Request against `main`

---

## Commit Message Format

Use the following prefixes:

| Prefix | When to use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code change that isn't a fix or feature |
| `chore:` | Tooling, deps, config |
| `style:` | Formatting, no logic change |

Example:
```
feat: add Brave Search fallback when Tavily quota exhausted
```

---

## Pull Request Rules

- PRs must target `main`
- All PRs require **at least 1 approval** before merging
- New commits after approval will **dismiss the previous review** — the PR must be re-approved
- Direct pushes to `main` are not allowed — everything goes through a PR
- Keep PRs focused — one feature or fix per PR
- Update the README if your change affects setup, env vars, or behaviour

---

## What We Won't Accept

- Commits with API keys, secrets, or credentials of any kind
- Breaking changes to the AI output schema without a migration path
- New AI providers without a graceful fallback
- Changes to `supabase/migrations/` that modify existing migration files (add new ones instead)
- `.env.local` or any file containing real credentials

---

## Security

If you find a security vulnerability, **do not open a public issue**. Contact the maintainer directly via GitHub.

---

## License

By contributing, you agree that your contributions will be licensed under the same [AGPL-3.0 license](./LICENSE) that covers this project.
