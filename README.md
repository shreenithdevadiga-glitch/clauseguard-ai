# ClauseGuard AI — Adversarial Contract & Dark-Pattern Shield

> **Challenge:** PromptWars – AI Prompt Challenge (`PROMPTWARS × AI VIBEATHON 2026` by Echo Engineers × Hack2skill)  
> **Live App:** https://clauseguard-ai-phi.vercel.app

**ClauseGuard AI** is a smart, dynamic AI assistant that protects everyday signers—students, renters, freelancers, and job-seekers—from predatory contract clauses, hidden financial traps, and illegal dark patterns in seconds.

---

## 1. Chosen Vertical & Persona
- **Vertical:** **LegalTech & Consumer Protection** (Smart Contract Risk & Negotiation Assistant)
- **Target Persona:** Everyday signers in India (tenants signing 11-month leases, graduates signing startup offer letters/bonds, and freelancers signing client MSAs) who cannot afford ₹5,000–₹25,000 legal reviews.
- **Logical Decision Making Based on User Context:** Automatically classifies the agreement context (*Rental Agreement*, *Employment & Bond*, *Freelance & MSA*, *SaaS / Consumer Terms*, *General Agreement*), evaluates clauses against Indian legal norms, computes a deterministic `0–100` Safety Score, and routes to a clear verdict:
  - `0–44`: **DO NOT SIGN AS-IS**
  - `45–74`: **NEGOTIATE BEFORE SIGNING**
  - `75–100`: **MOSTLY FAIR**

---

## 2. Approach and Logic
Instead of generic summarization, ClauseGuard AI uses a **3-Stage Adversarial Prompt Pipeline** (`src/lib/prompts.ts`) powered by Google Gemini (`@google/genai`):
1. **Agent 1 — Clause Extractor & Taxonomist:** Segments binding obligations, penalties, notice periods, and IP clauses, anchoring exact verbatim `exactQuote` substrings for inline **Contract X-Ray** highlighting.
2. **Agent 2 — Adversarial Red-Team Auditor:** Cross-examines every clause against Indian statutory and market benchmarks (*Indian Contract Act, 1872 Sections 27 & 74*, *Model Tenancy Act*, *Consumer Protection Act, 2019*) and scores 4 risk vectors (*Financial Trap*, *IP & Rights Grab*, *Lock-in & Exit*, *Unilateral Power*).
3. **Agent 3 — Fair-Draft Negotiator:** Generates drop-in replacement counter-clauses (`- Trap` vs `+ Safe Counter-Clause` diff) plus ready-to-send **Email & WhatsApp** negotiation scripts.

---

## 3. How the Solution Works
1. **Multimodal Input Ingestion:** Users paste text or drag-and-drop `PDF`, `Word (.docx/.doc)` (via `mammoth`), `CSV`, `Photos`, `Videos`, `Audio`, or `TXT/MD`.
2. **Efficiency & Caching Layer:** Text audits are hashed (`SHA-256`) and checked against a bounded in-memory LRU cache (`src/lib/cache.ts`, `X-Cache: HIT/MISS`) before calling Gemini.
3. **Resilient Live AI Execution:** `src/app/api/analyze/route.ts` and `src/app/api/chat/route.ts` execute with automatic timeout protection (`AbortSignal.timeout`) and model resilience (`gemini-3.5-flash-lite` → `gemini-4-hydrogen` → `gemini-4-argon`), clamping and validating all returned JSON fields.
4. **Interactive X-Ray & Copilot UI:** Users inspect inline highlighted traps, copy redlines, send negotiation scripts, ask follow-up questions in **Ask ClauseGuard**, or export a `.md` audit report.
5. **Security & Accessibility:**
   - **Security:** Server-only `GEMINI_API_KEY` (`.env.local` gitignored), 20 MB upload limit, strict JSON validation, and HTTP security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`).
   - **Accessibility:** Skip-to-content link, semantic landmarks (`<header>`, `<main>`), ARIA `tablist`/`tab`/`dialog`/`alert`/`live` regions, `<label>` bindings, and `Ctrl+K` Command Palette.

---

## 4. Assumptions Made
- **Educational Guidance, Not Formal Legal Counsel:** ClauseGuard AI provides structured risk analysis and market-standard counter-clauses for educational/negotiation support, not attorney-client representation.
- **Indian Legal Context Default:** Legal benchmarks prioritize Indian contract and tenancy norms unless the uploaded agreement specifies another jurisdiction.
- **Server-Side Key & Privacy:** API keys are stored only in server environment variables (`.env.local` / Vercel Env) and never exposed to client-side code; uploaded files are processed in-memory without persistent database storage.
- **20 MB Multimodal Cap:** Uploaded files are capped at 20 MB to ensure fast, reliable serverless execution.

---

## 5. Testing, Linting & Quick Start
```bash
npm install
cp .env.example .env.local   # Add your GEMINI_API_KEY
npm test                     # Runs 7 automated tests (node --test tests/clauseguard.test.mjs)
npm run lint                 # Runs ESLint
npm run build                # Builds production Next.js bundle
npm run dev                  # Starts locally on http://localhost:3000
```
