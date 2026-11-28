import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import {
  ClauseFinding,
  ContractAnalysis,
  ContractCategory,
  RiskSeverity,
} from "./types";

export const LIVE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-4-hydrogen",
  "gemini-4-argon",
] as const;

const VALID_CATEGORIES = new Set<ContractCategory>([
  "Rental Agreement",
  "Employment & Bond",
  "Freelance & MSA",
  "SaaS / Consumer Terms",
  "General Agreement",
]);

const VALID_VERDICTS = new Set<ContractAnalysis["verdict"]>([
  "DO NOT SIGN AS-IS",
  "NEGOTIATE BEFORE SIGNING",
  "MOSTLY FAIR",
]);

const VALID_SEVERITIES = new Set<RiskSeverity>([
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
]);

const VALID_FINDING_CATEGORIES = new Set<ClauseFinding["category"]>([
  "Financial Trap",
  "IP & Rights Grab",
  "Lock-in & Exit",
  "Unilateral Power",
  "Dark Pattern",
]);

export class InvalidAuditResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAuditResponseError";
  }
}

export function clampScore(val: unknown, fallback = 50): number {
  return typeof val === "number" && Number.isFinite(val)
    ? Math.max(0, Math.min(100, Math.round(val)))
    : fallback;
}

export async function safeReadJsonBody(
  req: Request
): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; response: NextResponse }
> {
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Request body must be a JSON object." },
          { status: 400 }
        ),
      };
    }
    return { ok: true, data: parsed as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      ),
    };
  }
}

export async function runGeminiInteraction(
  client: Pick<GoogleGenAI, "interactions">,
  params: {
    system_instruction: string;
    input: unknown;
  },
  timeoutMs = 20000
): Promise<{ outputText: string; model: string }> {
  let lastError: unknown = null;

  for (const modelName of LIVE_MODELS) {
    try {
      const interaction = await client.interactions.create(
        {
          model: modelName,
          system_instruction: params.system_instruction,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input: params.input as any,
          store: false,
        },
        { signal: AbortSignal.timeout(timeoutMs) }
      );
      return {
        outputText: interaction.output_text?.trim() || "",
        model: modelName,
      };
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!/503|429|high demand|timed out|timeout|aborted/i.test(msg)) {
        throw err;
      }
    }
  }

  throw lastError ?? new Error("All live Gemini models failed.");
}

function asNonEmptyString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

export function parseAndValidateAuditResponse(
  rawText: string,
  fallbackExtractedText?: string
): Omit<ContractAnalysis, "analysisMode" | "pipelineMs" | "analyzedAt"> {
  const cleanedJson = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(cleanedJson);
  } catch {
    throw new InvalidAuditResponseError("Model output was not valid JSON.");
  }

  if (!parsedRaw || typeof parsedRaw !== "object" || Array.isArray(parsedRaw)) {
    throw new InvalidAuditResponseError("Model output JSON must be an object.");
  }

  const parsed = parsedRaw as Record<string, unknown>;
  const safetyScore = clampScore(parsed.safetyScore, 50);

  const rawCategory = parsed.category;
  const category: ContractCategory =
    typeof rawCategory === "string" &&
    VALID_CATEGORIES.has(rawCategory as ContractCategory)
      ? (rawCategory as ContractCategory)
      : "General Agreement";

  const rawVerdict = parsed.verdict;
  const derivedVerdict: ContractAnalysis["verdict"] =
    safetyScore < 45
      ? "DO NOT SIGN AS-IS"
      : safetyScore < 75
      ? "NEGOTIATE BEFORE SIGNING"
      : "MOSTLY FAIR";
  const verdict: ContractAnalysis["verdict"] =
    typeof rawVerdict === "string" &&
    VALID_VERDICTS.has(rawVerdict as ContractAnalysis["verdict"])
      ? (rawVerdict as ContractAnalysis["verdict"])
      : derivedVerdict;

  const rawVectors =
    parsed.riskVectors &&
    typeof parsed.riskVectors === "object" &&
    !Array.isArray(parsed.riskVectors)
      ? (parsed.riskVectors as Record<string, unknown>)
      : {};

  const findings: ClauseFinding[] = Array.isArray(parsed.findings)
    ? parsed.findings
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object" && !Array.isArray(item)
        )
        .map((item, idx): ClauseFinding | null => {
          const title = asNonEmptyString(item.title);
          const exactQuote = asNonEmptyString(item.exactQuote);
          if (!title && !exactQuote) return null;

          const severity =
            typeof item.severity === "string" &&
            VALID_SEVERITIES.has(item.severity as RiskSeverity)
              ? (item.severity as RiskSeverity)
              : "MEDIUM";

          const findingCategory =
            typeof item.category === "string" &&
            VALID_FINDING_CATEGORIES.has(
              item.category as ClauseFinding["category"]
            )
              ? (item.category as ClauseFinding["category"])
              : "Unilateral Power";

          return {
            id: asNonEmptyString(item.id, `f${idx + 1}`),
            title: title || "Flagged Contract Clause",
            severity,
            category: findingCategory,
            exactQuote,
            plainEnglishTrap: asNonEmptyString(
              item.plainEnglishTrap,
              "Potential risk identified in this clause."
            ),
            legalContext: asNonEmptyString(
              item.legalContext,
              "Review against standard balanced Indian contract norms."
            ),
            counterClause: asNonEmptyString(
              item.counterClause,
              "Request balanced, mutual wording for this clause."
            ),
            potentialLossEstimate: asNonEmptyString(
              item.potentialLossEstimate,
              "Contractual risk exposure"
            ),
          };
        })
        .filter((f): f is ClauseFinding => f !== null)
    : [];

  const rawNegotiation =
    parsed.negotiation &&
    typeof parsed.negotiation === "object" &&
    !Array.isArray(parsed.negotiation)
      ? (parsed.negotiation as Record<string, unknown>)
      : {};

  const tone =
    rawNegotiation.tone === "Firm & Protective"
      ? "Firm & Protective"
      : "Polite & Collaborative";

  const modelExtracted = asNonEmptyString(parsed.extractedText);
  const resolvedExtracted = modelExtracted || fallbackExtractedText || undefined;

  return {
    contractTitle: asNonEmptyString(parsed.contractTitle, "Contract Risk Audit"),
    category,
    safetyScore,
    verdict,
    executiveSummary: asNonEmptyString(
      parsed.executiveSummary,
      "Audit completed."
    ),
    riskVectors: {
      financialTrap: clampScore(rawVectors.financialTrap, 0),
      ipRightsGrab: clampScore(rawVectors.ipRightsGrab, 0),
      lockInPenalty: clampScore(rawVectors.lockInPenalty, 0),
      unilateralPower: clampScore(rawVectors.unilateralPower, 0),
    },
    findings,
    negotiation: {
      subject: asNonEmptyString(
        rawNegotiation.subject,
        "Requested Contract Clarifications"
      ),
      tone,
      emailBody: asNonEmptyString(rawNegotiation.emailBody),
      whatsappShort: asNonEmptyString(rawNegotiation.whatsappShort),
    },
    extractedText: resolvedExtracted,
  };
}

export function buildDemoChatReply(
  question: string,
  analysis: ContractAnalysis | null
): string {
  if (!analysis) {
    return "Run an audit first so I can review the contract's flagged clauses. (Demo Mode provides educational guidance based on detected risks.)";
  }

  const q = question.toLowerCase();
  const matched = analysis.findings.find(
    (f) =>
      (q.includes("non-compete") && /non-compete|restraint/i.test(f.title + f.legalContext)) ||
      (q.includes("bond") && /bond|forfeit|deposit/i.test(f.title + f.plainEnglishTrap)) ||
      (q.includes("ip") || q.includes("hackathon") || q.includes("side")
        ? f.category === "IP & Rights Grab"
        : false) ||
      (q.includes("financial") || q.includes("trap") || q.includes("money") || q.includes("deposit")
        ? f.category === "Financial Trap" || f.severity === "CRITICAL"
        : false)
  );

  const primary = matched ?? analysis.findings[0];
  if (!primary) {
    return `In Demo Mode, this ${analysis.category} scored ${analysis.safetyScore}/100 (${analysis.verdict}) with no major keyword traps flagged. Connect a Gemini API key for deep semantic Q&A (educational guidance only, not legal representation).`;
  }

  return `[Demo Mode] The top relevant risk is "${primary.title}" (${primary.severity}): ${primary.plainEnglishTrap} ${primary.legalContext} Suggested counter-clause: "${primary.counterClause}" (Educational guidance only; connect a Gemini API key for custom Q&A.)`;
}
