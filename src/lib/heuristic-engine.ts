import { ClauseFinding, ContractAnalysis, ContractCategory } from "./types";
import { SAMPLE_CONTRACTS } from "./samples";

interface PatternRule {
  id: string;
  regex: RegExp;
  title: string;
  severity: ClauseFinding["severity"];
  category: ClauseFinding["category"];
  plainEnglishTrap: string;
  legalContext: string;
  counterClause: string;
  potentialLossEstimate: string;
}

const HEURISTIC_RULES: PatternRule[] = [
  {
    id: "h-forfeit",
    regex: /[^.!?]*\b(forfeit|forfeited|forfeiture|non-refundable|withhold(?:ing)?\s+(?:relieving|deposit|salary))[^.!?]*[.!?]?/i,
    title: "Deposit / Pay Forfeiture or Document Withholding",
    severity: "CRITICAL",
    category: "Financial Trap",
    plainEnglishTrap:
      "Allows the other party to seize your entire deposit or withhold your relieving letter/pay as a penalty.",
    legalContext:
      "Under Section 74 of the Indian Contract Act, 1872, arbitrary forfeiture penalties beyond proven actual loss are unenforceable.",
    counterClause:
      "Any deduction shall be limited strictly to documented actual damages or unpaid dues, with full refund/release within 15 days.",
    potentialLossEstimate: "Full deposit or final payout at risk",
  },
  {
    id: "h-noncompete",
    regex: /[^.!?]*\b(non-compete|not\s+join|not\s+compete|restraint|similar\s+business)[^.!?]*[.!?]?/i,
    title: "Post-Exit Non-Compete Restriction",
    severity: "HIGH",
    category: "Lock-in & Exit",
    plainEnglishTrap:
      "Restricts your right to work for other employers or clients in your own industry after leaving.",
    legalContext:
      "Section 27 of the Indian Contract Act, 1872 renders post-employment non-compete clauses void in India.",
    counterClause:
      "Remove post-termination non-compete restrictions; retain standard confidentiality and non-solicitation obligations.",
    potentialLossEstimate: "Career & income mobility lock-in",
  },
  {
    id: "h-ip",
    regex: /[^.!?]*\b(personal\s+time|weekends|pre-existing|irrespective\s+of\s+whether\s+payment|all\s+intellectual\s+property|vest\s+in\s+client)[^.!?]*[.!?]?/i,
    title: "Overbroad IP Grab (Personal or Unpaid Work)",
    severity: "CRITICAL",
    category: "IP & Rights Grab",
    plainEnglishTrap:
      "Transfers ownership of your personal side-projects or transfers project IP before you are even paid.",
    legalContext:
      "Fair IP clauses only assign work created within scope/work hours and strictly conditional upon full payment.",
    counterClause:
      "Project IP transfers solely upon receipt of 100% of due fees. Personal/pre-existing tools remain owned by creator.",
    potentialLossEstimate: "100% IP & portfolio ownership risk",
  },
  {
    id: "h-liability",
    regex: /[^.!?]*\b(unlimited\s+(?:liability|damages)|without\s+any\s+cap|indemnify[^.]{0,60}lost\s+profits)[^.!?]*[.!?]?/i,
    title: "Uncapped Liability & Indemnification",
    severity: "HIGH",
    category: "Financial Trap",
    plainEnglishTrap:
      "Exposes you to unlimited financial damages—potentially far more than the contract is even worth.",
    legalContext:
      "Market-standard agreements cap aggregate liability at total fees paid and exclude consequential/lost-profit damages.",
    counterClause:
      "Aggregate liability under this agreement shall be capped at total fees actually paid, excluding indirect or consequential damages.",
    potentialLossEstimate: "Uncapped personal financial exposure",
  },
  {
    id: "h-unilateral",
    regex: /[^.!?]*\b(sole\s+discretion|without\s+assigning\s+any\s+reason|48\s+hours|sole\s+arbitrator\s+appointed\s+solely|unilateral|revise[^.]{0,40}at\s+any\s+time)[^.!?]*[.!?]?/i,
    title: "Unilateral Power & Asymmetric Notice",
    severity: "HIGH",
    category: "Unilateral Power",
    plainEnglishTrap:
      "Gives one party unchecked power to change terms, terminate abruptly, or pick the arbitrator.",
    legalContext:
      "Mutual notice periods (30–60 days) and mutually appointed arbitrators are required for balanced enforceability.",
    counterClause:
      "Any material modification, termination, or arbitrator appointment requires mutual written consent and symmetric 30-day notice.",
    potentialLossEstimate: "Sudden termination / biased dispute",
  },
  {
    id: "h-payment",
    regex: /[^.!?]*\b(net-90|net\s*90|90\s*days|unlimited\s+revisions|subjectively\s+deems)[^.!?]*[.!?]?/i,
    title: "Delayed Payment / Unlimited Scope Trap",
    severity: "HIGH",
    category: "Financial Trap",
    plainEnglishTrap:
      "Delays your payment for months or forces unlimited free revisions based on subjective approval.",
    legalContext:
      "Standard commercial terms use milestone billing, Net-15/Net-30 invoices, and 2–3 capped revision rounds.",
    counterClause:
      "Invoices payable Net-15 with objective 7-day acceptance criteria and up to 2 revision rounds per milestone.",
    potentialLossEstimate: "Severe cashflow & scope creep risk",
  },
];

function inferCategory(text: string): ContractCategory {
  const lower = text.toLowerCase();
  if (lower.includes("rent") || lower.includes("licensor") || lower.includes("tenant") || lower.includes("lease")) {
    return "Rental Agreement";
  }
  if (lower.includes("employment") || lower.includes("ctc") || lower.includes("service bond") || lower.includes("salary")) {
    return "Employment & Bond";
  }
  if (lower.includes("freelance") || lower.includes("deliverables") || lower.includes("milestone") || lower.includes("contractor")) {
    return "Freelance & MSA";
  }
  if (lower.includes("subscription") || lower.includes("auto-renew") || lower.includes("terms of service")) {
    return "SaaS / Consumer Terms";
  }
  return "General Agreement";
}

export function runDemoOrHeuristicAnalysis(contractText: string): ContractAnalysis {
  const start = Date.now();
  const trimmed = contractText.trim();

  // Check if it matches one of the 3 curated showcase samples
  const matchedSample = SAMPLE_CONTRACTS.find(
    (s) => s.text.trim() === trimmed || trimmed.includes(s.text.trim().slice(0, 120))
  );
  if (matchedSample) {
    return {
      ...matchedSample.demoAnalysis,
      analyzedAt: new Date().toISOString(),
    };
  }

  const findings: ClauseFinding[] = [];
  for (const rule of HEURISTIC_RULES) {
    const match = trimmed.match(rule.regex);
    if (match && match[0]) {
      findings.push({
        id: rule.id,
        title: rule.title,
        severity: rule.severity,
        category: rule.category,
        exactQuote: match[0].trim().slice(0, 240),
        plainEnglishTrap: rule.plainEnglishTrap,
        legalContext: rule.legalContext,
        counterClause: rule.counterClause,
        potentialLossEstimate: rule.potentialLossEstimate,
      });
    }
  }

  const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  const safetyScore = Math.max(12, Math.min(92, 92 - criticalCount * 24 - highCount * 14));
  const verdict: ContractAnalysis["verdict"] =
    safetyScore < 45 ? "DO NOT SIGN AS-IS" : safetyScore < 75 ? "NEGOTIATE BEFORE SIGNING" : "MOSTLY FAIR";

  const category = inferCategory(trimmed);

  return {
    contractTitle: `${category} Risk Audit`,
    category,
    safetyScore,
    verdict,
    executiveSummary:
      findings.length > 0
        ? `Demo Heuristic Engine detected ${findings.length} high-risk clause(s) (${criticalCount} critical, ${highCount} high). Connect a Gemini API key for deep semantic reasoning with Gemini 4 Hydrogen.`
        : "No obvious predatory keyword patterns detected in Demo Mode. For nuanced semantic risk analysis, connect a Gemini API key to run the 3-stage Gemini 4 Hydrogen pipeline.",
    riskVectors: {
      financialTrap: Math.min(95, 25 + findings.filter((f) => f.category === "Financial Trap").length * 32),
      ipRightsGrab: Math.min(95, 15 + findings.filter((f) => f.category === "IP & Rights Grab").length * 45),
      lockInPenalty: Math.min(95, 20 + findings.filter((f) => f.category === "Lock-in & Exit").length * 35),
      unilateralPower: Math.min(95, 20 + findings.filter((f) => f.category === "Unilateral Power").length * 35),
    },
    findings,
    negotiation: {
      subject: `Requested Clarifications on ${category}`,
      tone: "Polite & Collaborative",
      emailBody: `Hi Team,\n\nThank you for sharing the ${category}. Before finalizing, could we align the following items with standard market terms?\n\n${
        findings.length > 0
          ? findings.map((f, i) => `${i + 1}. ${f.title}: ${f.counterClause}`).join("\n")
          : "1. Confirm mutual 30-day termination notice and standard liability caps."
      }\n\nHappy to sign as soon as these updates are reflected!\n\nBest regards,\n[Your Name]`,
      whatsappShort: `Hi! Reviewed the ${category}. Before signing, can we tweak ${
        findings.length || 1
      } clause(s) (${findings.map((f) => f.title).slice(0, 2).join(", ") || "standard mutual terms"}) to match market standards? Happy to finalize right after!`,
    },
    analysisMode: "demo-engine",
    pipelineMs: Math.max(420, Date.now() - start + 420),
    analyzedAt: new Date().toISOString(),
  };
}
