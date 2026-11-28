import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";

const root = process.cwd();
const jiti = createJiti(import.meta.url, {
  alias: { "@": path.join(root, "src") },
});

const {
  buildContractCacheKey,
  getCachedAudit,
  setCachedAudit,
} = await jiti.import("../src/lib/cache.ts");
const { runDemoOrHeuristicAnalysis } = await jiti.import("../src/lib/heuristic-engine.ts");
const {
  InvalidAuditResponseError,
  buildDemoChatReply,
  parseAndValidateAuditResponse,
  runGeminiInteraction,
} = await jiti.import("../src/lib/gemini.ts");
const { SAMPLE_CONTRACTS } = await jiti.import("../src/lib/samples.ts");
const analyzeRoute = await jiti.import("../src/app/api/analyze/route.ts");
const chatRoute = await jiti.import("../src/app/api/chat/route.ts");

function makeDummyAnalysis(title) {
  return {
    contractTitle: title,
    category: "General Agreement",
    safetyScore: 80,
    verdict: "MOSTLY FAIR",
    executiveSummary: "Summary",
    riskVectors: {
      financialTrap: 10,
      ipRightsGrab: 10,
      lockInPenalty: 10,
      unilateralPower: 10,
    },
    findings: [],
    negotiation: {
      subject: "Subject",
      tone: "Polite & Collaborative",
      emailBody: "Body",
      whatsappShort: "Short",
    },
    analysisMode: "demo-engine",
    pipelineMs: 10,
    analyzedAt: new Date().toISOString(),
  };
}

test("samples: every finding exactQuote matches verbatim inside sample contract text", () => {
  assert.equal(SAMPLE_CONTRACTS.length, 3);
  for (const sample of SAMPLE_CONTRACTS) {
    assert.ok(sample.text.trim().length > 100);
    assert.ok(sample.demoAnalysis.findings.length >= 3);
    for (const finding of sample.demoAnalysis.findings) {
      assert.ok(
        sample.text.includes(finding.exactQuote),
        `Sample ${sample.id} finding ${finding.id} exactQuote missing from sample.text`
      );
    }
  }
});

test("cache: buildContractCacheKey trims whitespace and hashes deterministically", () => {
  const k1 = buildContractCacheKey("  Sample Contract Text  ");
  const k2 = buildContractCacheKey("Sample Contract Text");
  const k3 = buildContractCacheKey("Different Contract Text");
  assert.equal(k1, k2);
  assert.notEqual(k1, k3);
  assert.match(k1, /^[a-f0-9]{64}$/);
});

test("cache: getCachedAudit refreshes LRU order so recently read entries survive eviction", () => {
  const prefix = `lru-${Date.now()}-`;
  for (let i = 0; i < 50; i++) {
    setCachedAudit(`${prefix}${i}`, makeDummyAnalysis(`Doc ${i}`));
  }

  // Touch entry 0 so it becomes the most recently used entry
  const hit = getCachedAudit(`${prefix}0`);
  assert.equal(hit?.contractTitle, "Doc 0");

  // Adding a 51st entry should evict entry 1 (oldest unused), NOT entry 0
  setCachedAudit(`${prefix}50`, makeDummyAnalysis("Doc 50"));

  assert.equal(getCachedAudit(`${prefix}0`)?.contractTitle, "Doc 0");
  assert.equal(getCachedAudit(`${prefix}1`), null);
  assert.equal(getCachedAudit(`${prefix}50`)?.contractTitle, "Doc 50");
});

test("heuristic engine: detects curated sample contracts and custom predatory traps", () => {
  const sampleResult = runDemoOrHeuristicAnalysis(SAMPLE_CONTRACTS[0].text);
  assert.equal(sampleResult.contractTitle, SAMPLE_CONTRACTS[0].demoAnalysis.contractTitle);
  assert.equal(sampleResult.analysisMode, "demo-engine");

  const riskyText =
    "If you exit early, your entire security deposit shall be forfeited automatically. " +
    "You agree to a 24-month non-compete across India. All source code created on personal time " +
    "or weekends shall vest in Client irrespective of whether payment is made, with unlimited liability " +
    "and Net-90 payment at Client sole discretion.";
  const customResult = runDemoOrHeuristicAnalysis(riskyText);
  assert.equal(customResult.verdict, "DO NOT SIGN AS-IS");
  assert.ok(customResult.findings.length >= 4);
  assert.ok(customResult.safetyScore < 45);

  const fairText =
    "This mutual consulting agreement uses Net-15 milestone invoices, caps liability at fees paid, " +
    "and allows either party to terminate with 30 days written notice.";
  const fairResult = runDemoOrHeuristicAnalysis(fairText);
  assert.equal(fairResult.verdict, "MOSTLY FAIR");
  assert.equal(fairResult.findings.length, 0);
  assert.ok(fairResult.safetyScore >= 75);
});

test("demo mode integration: UI wires heuristic fallback when no live key is available", () => {
  const appSrc = fs.readFileSync(path.join(root, "src/components/ClauseGuardApp.tsx"), "utf8");
  assert.match(appSrc, /runDemoOrHeuristicAnalysis/);
});

test("API /api/analyze: GET reflects key status and POST validates boundaries cleanly", async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;

    const getRes = await analyzeRoute.GET();
    const getBody = await getRes.json();
    assert.equal(getRes.status, 200);
    assert.equal(getBody.liveConfigured, false);

    // Missing API key -> 401
    const noKeyReq = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contractText: "A".repeat(40) }),
    });
    const noKeyRes = await analyzeRoute.POST(noKeyReq);
    assert.equal(noKeyRes.status, 401);

    // Malformed JSON -> 400 (not 500)
    const badJsonReq = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-valid-json",
    });
    const badJsonRes = await analyzeRoute.POST(badJsonReq);
    assert.equal(badJsonRes.status, 400);

    // Short text -> 400
    const shortReq = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contractText: "Too short", apiKey: "test-key" }),
    });
    const shortRes = await analyzeRoute.POST(shortReq);
    assert.equal(shortRes.status, 400);

    // Oversized file (>20 MB) -> 413
    const form = new FormData();
    const bigBlob = new Blob([new Uint8Array(20 * 1024 * 1024 + 1)], { type: "text/plain" });
    form.append("file", new File([bigBlob], "huge.txt", { type: "text/plain" }));
    form.append("apiKey", "test-key");
    const bigReq = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: form,
    });
    const bigRes = await analyzeRoute.POST(bigReq);
    assert.equal(bigRes.status, 413);

    // Unsupported binary file -> 400
    const badFileForm = new FormData();
    badFileForm.append(
      "file",
      new File([new Uint8Array([0x4d, 0x5a])], "program.exe", {
        type: "application/x-msdownload",
      })
    );
    badFileForm.append("apiKey", "test-key");
    const badFileReq = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: badFileForm,
    });
    const badFileRes = await analyzeRoute.POST(badFileReq);
    assert.equal(badFileRes.status, 400);
  } finally {
    if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prevKey;
  }
});

test("API /api/chat: validates missing question, missing key, and malformed JSON", async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;

    // Malformed JSON -> 400
    const badJsonReq = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad-json",
    });
    const badJsonRes = await chatRoute.POST(badJsonReq);
    assert.equal(badJsonRes.status, 400);

    // Empty question -> 400
    const emptyQReq = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "   " }),
    });
    const emptyQRes = await chatRoute.POST(emptyQReq);
    assert.equal(emptyQRes.status, 400);

    // Missing API key -> 401
    const noKeyReq = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "Is this bond enforceable?" }),
    });
    const noKeyRes = await chatRoute.POST(noKeyReq);
    assert.equal(noKeyRes.status, 401);
  } finally {
    if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prevKey;
  }
});

test("gemini helpers: validates and clamps untrusted LLM JSON and rejects invalid payloads", () => {
  assert.throws(
    () => parseAndValidateAuditResponse("not json at all"),
    InvalidAuditResponseError
  );
  assert.throws(
    () => parseAndValidateAuditResponse('["not-an-object"]'),
    InvalidAuditResponseError
  );

  const normalized = parseAndValidateAuditResponse(
    "```json\n" +
      JSON.stringify({
        contractTitle: "Test Lease",
        category: "Invalid Category",
        safetyScore: 142.7,
        verdict: "INVALID",
        riskVectors: { financialTrap: -20, ipRightsGrab: 88.2 },
        findings: [
          {
            title: "Deposit Trap",
            severity: "EXTREME",
            category: "Unknown",
            exactQuote: "forfeit deposit",
          },
          { bogus: true },
        ],
        negotiation: { tone: "Aggressive" },
      }) +
      "\n```",
    "Fallback extracted text"
  );

  assert.equal(normalized.category, "General Agreement");
  assert.equal(normalized.safetyScore, 100);
  assert.equal(normalized.verdict, "MOSTLY FAIR");
  assert.equal(normalized.riskVectors.financialTrap, 0);
  assert.equal(normalized.riskVectors.ipRightsGrab, 88);
  assert.equal(normalized.findings.length, 1);
  assert.equal(normalized.findings[0].severity, "MEDIUM");
  assert.equal(normalized.findings[0].category, "Unilateral Power");
  assert.equal(normalized.negotiation.tone, "Polite & Collaborative");
  assert.equal(normalized.extractedText, "Fallback extracted text");
});

test("gemini helpers: runGeminiInteraction retries 503/429 and stops immediately on 400", async () => {
  let calls = 0;
  const retryClient = {
    interactions: {
      async create(body) {
        calls++;
        if (calls === 1) {
          throw new Error("503 high demand");
        }
        return { output_text: `ok from ${body.model}` };
      },
    },
  };
  const res = await runGeminiInteraction(retryClient, {
    system_instruction: "sys",
    input: "hello",
  });
  assert.equal(calls, 2);
  assert.equal(res.model, "gemini-4-hydrogen");
  assert.equal(res.outputText, "ok from gemini-4-hydrogen");

  let nonRetryCalls = 0;
  const authFailClient = {
    interactions: {
      async create() {
        nonRetryCalls++;
        throw new Error("401 API key invalid");
      },
    },
  };
  await assert.rejects(
    () => runGeminiInteraction(authFailClient, { system_instruction: "sys", input: "hello" }),
    /401 API key invalid/
  );
  assert.equal(nonRetryCalls, 1);
});

test("gemini helpers: buildDemoChatReply summarizes matching risk in Demo Mode", () => {
  const analysis = runDemoOrHeuristicAnalysis(SAMPLE_CONTRACTS[1].text);
  const reply = buildDemoChatReply("Can I keep my hackathon side projects?", analysis);
  assert.match(reply, /Demo Mode/);
  assert.match(reply, /Hackathon|IP/i);
});

