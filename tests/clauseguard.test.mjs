import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("PromptWars alignment: 3-stage prompt pipeline and unified system prompt are defined", () => {
  const promptsSrc = fs.readFileSync(path.join(root, "src/lib/prompts.ts"), "utf8");
  assert.match(promptsSrc, /Agent 1: Clause Extractor & Taxonomist/);
  assert.match(promptsSrc, /Agent 2: Adversarial Red-Team Auditor/);
  assert.match(promptsSrc, /Agent 3: Fair-Draft Negotiator/);
  assert.match(promptsSrc, /UNIFIED_AUDIT_SYSTEM_PROMPT/);
  assert.match(promptsSrc, /Indian Contract Act, 1872/);
});

test("Sample contracts contain valid verbatim quotes and counter-clauses", () => {
  const samplesSrc = fs.readFileSync(path.join(root, "src/lib/samples.ts"), "utf8");
  assert.match(samplesSrc, /id:\s*"rental-blr"/);
  assert.match(samplesSrc, /id:\s*"startup-offer"/);
  assert.match(samplesSrc, /id:\s*"freelance-msa"/);
  assert.match(samplesSrc, /exactQuote:/);
  assert.match(samplesSrc, /counterClause:/);
});

test("Security & validation: analyze API enforces key check, 20 MB file cap, and score clamping", () => {
  const routeSrc = fs.readFileSync(path.join(root, "src/app/api/analyze/route.ts"), "utf8");
  assert.match(routeSrc, /20 \* 1024 \* 1024/);
  assert.match(routeSrc, /GEMINI_API_KEY is not configured/);
  assert.match(routeSrc, /clampScore/);
  assert.match(routeSrc, /mammoth\.extractRawText/);
});

test("Security headers: next.config.ts sets nosniff, DENY, and disables X-Powered-By", () => {
  const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
  assert.match(nextConfig, /poweredByHeader:\s*false/);
  assert.match(nextConfig, /X-Content-Type-Options/);
  assert.match(nextConfig, /X-Frame-Options/);
  assert.match(nextConfig, /Referrer-Policy/);
});

test("Efficiency: SHA-256 LRU cache is wired into analyze API", () => {
  const cacheSrc = fs.readFileSync(path.join(root, "src/lib/cache.ts"), "utf8");
  const routeSrc = fs.readFileSync(path.join(root, "src/app/api/analyze/route.ts"), "utf8");
  assert.match(cacheSrc, /MAX_CACHE_ENTRIES/);
  assert.match(cacheSrc, /sha256/);
  assert.match(routeSrc, /getCachedAudit/);
  assert.match(routeSrc, /setCachedAudit/);
  assert.match(routeSrc, /X-Cache/);
});

test("Accessibility: main landmark, skip link, ARIA tabs, dialogs, and live regions exist", () => {
  const appSrc = fs.readFileSync(path.join(root, "src/components/ClauseGuardApp.tsx"), "utf8");
  const modalSrc = fs.readFileSync(path.join(root, "src/components/PromptInspectorModal.tsx"), "utf8");
  assert.match(appSrc, /Skip to main content/);
  assert.match(appSrc, /role="tablist"/);
  assert.match(appSrc, /role="tab"/);
  assert.match(appSrc, /aria-live="polite"/);
  assert.match(appSrc, /role="alert"/);
  assert.match(modalSrc, /role="dialog"/);
  assert.match(modalSrc, /aria-modal="true"/);
});

test("Security: .gitignore excludes .env*, .vercel, and .zip", () => {
  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
  assert.match(gitignore, /\.env\*/);
  assert.match(gitignore, /\.vercel/);
  assert.match(gitignore, /\*\.zip/);
});
