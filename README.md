# ClauseGuard AI — Adversarial Contract & Dark-Pattern Shield

> **Challenge:** PromptWars – AI Prompt Challenge (`PROMPTWARS × AI VIBEATHON 2026` by Echo Engineers × Hack2skill)  
> **Live App:** https://clauseguard-ai-phi.vercel.app

**ClauseGuard AI** protects students, renters, freelancers, and job-seekers from predatory contract clauses, hidden financial traps, and illegal dark patterns in seconds.

---

## Problem Statement Alignment (PromptWars – AI Prompt Challenge)
Everyday agreements (11-month Indian rental leases, startup offer letters with ₹2.5L training bonds, and freelance MSAs) hide asymmetric liabilities and unenforceable clauses. Generic AI summaries lack Indian legal context and actionable counter-proposals.

ClauseGuard AI solves this with a **3-Stage Adversarial Prompt Pipeline** (`src/lib/prompts.ts`) powered by Google Gemini (`@google/genai`):
1. **Agent 1 — Clause Extractor & Taxonomist:** Segments binding obligations and anchors exact verbatim `exactQuote` substrings for inline Contract X-Ray highlighting.
2. **Agent 2 — Adversarial Red-Team Auditor:** Evaluates every clause against Indian legal benchmarks (*Indian Contract Act, 1872 Sections 27 & 74*, *Model Tenancy Act*, *Consumer Protection Act, 2019*) and computes a **0–100 Safety Score** across 4 risk vectors.
3. **Agent 3 — Fair-Draft Negotiator:** Generates drop-in replacement counter-clauses (`- Trap` vs `+ Safe Counter-Clause` diff) plus ready-to-send **Email & WhatsApp** negotiation scripts.

---

## Architecture & Engineering Highlights
- **Multimodal Input Support:** Audits pasted text as well as `PDF`, `Word (.docx/.doc)` via `mammoth`, `CSV`, `Photos`, `Videos`, `Audio`, and `TXT/MD`.
- **Security:** Server-only `GEMINI_API_KEY` handling (`.env.local` gitignored), 20 MB upload cap, strict JSON output clamping, and security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `poweredByHeader: false`).
- **Efficiency:** SHA-256 bounded in-memory LRU audit cache (`src/lib/cache.ts` with `X-Cache: HIT/MISS`), `next/dynamic` lazy-loaded modals, `AbortController` request cancellation, and automatic Gemini model resilience (`gemini-3.5-flash-lite` → `gemini-4-hydrogen` → `gemini-4-argon`).
- **Accessibility (WCAG-aligned):** Skip-to-content link, `<main>`/`<header>` landmarks, `role="tablist"`/`role="tab"`/`aria-selected`, `role="dialog"`/`aria-modal="true"` modals, `aria-live="polite"` pipeline status, `role="alert"` error banners, and keyboard `Ctrl+K` Command Palette.
- **Testing & CI:** Automated test suite (`npm test` via `node --test`) + GitHub Actions CI (`.github/workflows/ci.yml`) running tests, ESLint, and production build.

---

## Quick Start
```bash
npm install
cp .env.example .env.local   # Add your GEMINI_API_KEY
npm test                     # Run automated test suite
npm run lint                 # Run ESLint
npm run build                # Build production bundle
npm run dev                  # Start on http://localhost:3000
```
