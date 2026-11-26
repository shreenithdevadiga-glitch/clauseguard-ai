# ClauseGuard AI — Product & Prompt Architecture Spec

> **Competition:** PROMPTWARS × AI VIBEATHON 2026 (Echo Engineers × Hack2skill)  
> **Core Mission:** Protect everyday people—students, renters, freelancers, and job-seekers—from predatory contract clauses, hidden financial traps, and illegal dark patterns in seconds.

## 1. Problem Statement
Every day, millions of people sign 11-month rental agreements, startup offer letters, freelance MSAs, and app terms without understanding asymmetric liabilities, unenforceable non-competes, or hidden forfeiture clauses. Legal review is slow and expensive; generic AI summaries miss Indian legal context and don't give actionable counter-clauses.

## 2. Solution: 3-Stage Adversarial Prompt Pipeline
ClauseGuard AI uses a structured multi-agent prompt pipeline powered by **Gemini 4 Hydrogen** (`gemini-4-hydrogen`) via `@google/genai` (with a full deterministic **1-Click Demo Mode** fallback):

1. **Agent 1 — Clause Extractor & Taxonomist:** Classifies contract type (Rental, Employment/Bond, Freelance/MSA, SaaS/Dark Patterns) and isolates binding obligations, financial penalties, and exit terms.
2. **Agent 2 — Adversarial Red-Team Auditor:** Evaluates every clause against fairness benchmarks and Indian legal principles (e.g., *Indian Contract Act, 1872 Section 27* on restraint of trade, *Model Tenancy Act* deposit norms, *Consumer Protection Act, 2019* dark patterns), assigning a `0–100` Safety Score and severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
3. **Agent 3 — Fair-Draft Negotiator:** Drafts exact drop-in counter-clauses ("Replace X with Y") and generates a ready-to-send polite WhatsApp/Email negotiation message.

## 3. Core User Flows & UI
- **Split-Pane Contract X-Ray:** Interactive annotated contract text on the left with inline severity highlights synchronized to detailed audit cards on the right.
- **Risk Radar & Safety Gauge:** Visual breakdown across 4 risk vectors (Financial Traps, IP/Rights Grab, Lock-in & Exit Penalties, Unilateral/Dark Patterns).
- **Negotiation Copilot & Q&A:** Copyable Email/WhatsApp negotiation scripts + interactive contract Q&A.
- **Prompt Strategy Inspector:** Transparent view of the 3-stage system prompts and JSON schema for PromptWars judges.
- **1-Click Demo Mode + Live Gemini API:** Pre-loaded with 3 realistic Indian trap contracts, plus live analysis for any pasted or uploaded `.txt`/`.md` contract using `.env.local` (`GEMINI_API_KEY`) or an in-session BYOK key.
