# ClauseGuard AI — Adversarial Contract & Dark-Pattern Shield

> Built for **PROMPTWARS × AI VIBEATHON 2026** (Echo Engineers × Hack2skill)

**ClauseGuard AI** protects students, renters, freelancers, and job-seekers from predatory contract clauses, hidden financial traps, and illegal dark patterns in seconds.

## Why ClauseGuard AI?
Every day, millions of people sign 11-month rental agreements, startup offer letters with training bonds, and freelance MSAs without spotting asymmetric liabilities or unenforceable restrictions. Generic AI summaries miss Indian legal benchmarks and don't tell you *what to write back*.

## 3-Stage Adversarial Prompt Pipeline (`gemini-4-hydrogen`)
1. **Agent 1 — Clause Extractor & Taxonomist:** Segments the contract and preserves exact verbatim substrings for inline X-Ray highlighting.
2. **Agent 2 — Adversarial Red-Team Auditor:** Audits against Indian legal & market norms (e.g., *Indian Contract Act, 1872 Section 27 & Section 74*, *Model Tenancy Act*, *Consumer Protection Act, 2019*) and computes a **0–100 Safety Score** across 4 risk vectors.
3. **Agent 3 — Fair-Draft Negotiator:** Generates drop-in replacement counter-clauses + ready-to-send **Email & WhatsApp** negotiation scripts.

## Key Features
- **Interactive Contract X-Ray:** Click any highlighted clause in the document to inspect the trap, legal context, and counter-clause.
- **1-Click Demo Mode + Live Gemini 4 Hydrogen:** Pre-loaded with 3 realistic Indian trap contracts (Bengaluru 11-Month Rental, Startup Offer & Bond, Freelance Dev MSA) plus live analysis via `.env.local` (`GEMINI_API_KEY`) or in-app BYOK.
- **Prompt Strategy Inspector:** Inspect the exact 3-stage system prompts directly in the UI.
- **Negotiation Copilot & Q&A:** Copyable Email/WhatsApp counter-proposals + interactive contract Q&A + `.md` report export.

## Quick Start
```bash
npm install
npm run dev
```
Open `http://localhost:3000`. Optionally copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` for live Gemini 4 Hydrogen audits.
