export type RiskSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ContractCategory =
  | "Rental Agreement"
  | "Employment & Bond"
  | "Freelance & MSA"
  | "SaaS / Consumer Terms"
  | "General Agreement";

export interface ClauseFinding {
  id: string;
  title: string;
  severity: RiskSeverity;
  category: "Financial Trap" | "IP & Rights Grab" | "Lock-in & Exit" | "Unilateral Power" | "Dark Pattern";
  exactQuote: string;
  plainEnglishTrap: string;
  legalContext: string;
  counterClause: string;
  potentialLossEstimate: string;
}

export interface RiskVectors {
  financialTrap: number; // 0-100 (higher = more dangerous)
  ipRightsGrab: number;
  lockInPenalty: number;
  unilateralPower: number;
}

export interface NegotiationDraft {
  subject: string;
  tone: "Polite & Collaborative" | "Firm & Protective";
  emailBody: string;
  whatsappShort: string;
}

export interface ContractAnalysis {
  contractTitle: string;
  category: ContractCategory;
  safetyScore: number; // 0-100 (100 = completely fair, 0 = predatory)
  verdict: "DO NOT SIGN AS-IS" | "NEGOTIATE BEFORE SIGNING" | "MOSTLY FAIR";
  executiveSummary: string;
  riskVectors: RiskVectors;
  findings: ClauseFinding[];
  negotiation: NegotiationDraft;
  analysisMode: "gemini-4-hydrogen" | "demo-engine";
  pipelineMs: number;
  analyzedAt: string;
  extractedText?: string;
}

export interface SampleContract {
  id: string;
  label: string;
  badge: string;
  category: ContractCategory;
  description: string;
  text: string;
  demoAnalysis: ContractAnalysis;
}

export interface PromptStageInfo {
  stage: number;
  agentName: string;
  role: string;
  model: string;
  systemPrompt: string;
}
