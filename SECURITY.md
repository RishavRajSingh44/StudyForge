# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (main) | Yes |
| older commits | No  |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in StudyForge, please report it responsibly:

1. Go to the [GitHub Security Advisories](https://github.com/RishavRajSingh44/StudyForge/security/advisories/new) page for this repository and submit a private advisory.
2. Alternatively, contact the maintainer directly via GitHub profile: [@RishavRajSingh44](https://github.com/RishavRajSingh44).

Please include:
- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix (optional but appreciated)

## What to Expect

- Acknowledgement within **48 hours**
- A status update within **7 days**
- A fix or mitigation plan within **30 days** for critical issues

## Scope

The following are in scope:
- SQL injection or data exposure via Supabase queries
- Server-Side Request Forgery (SSRF) via user-controlled URLs
- Exposure of `SUPABASE_SERVICE_ROLE_KEY` or other secrets
- Authentication bypass or privilege escalation
- Cross-Site Scripting (XSS) in rendered output
- Insecure file upload handling

The following are **out of scope**:
- Vulnerabilities in third-party services (Supabase, Tavily, Ollama, Vercel)
- Rate limiting / DoS on free-tier deployments
- Issues only reproducible with physical access to the server

## Security Measures Already in Place

- Gitleaks secret scanning on every PR (`.github/workflows/security.yml`)
- CodeQL static analysis on every PR
- `pnpm audit` on every PR — fails on high-severity CVEs
- `SUPABASE_SERVICE_ROLE_KEY` is server-only (never exposed to the client)
- Supabase Row Level Security (RLS) policies on all tables
- OpenSSF Scorecard weekly analysis (`.github/workflows/scorecard.yml`)
- AGPL-3.0 license with no warranty clause
