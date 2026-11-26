"use client";

import React, { useEffect, useRef, useState } from "react";
import { SAMPLE_CONTRACTS } from "@/lib/samples";
import { ContractAnalysis, ClauseFinding } from "@/lib/types";
import { SafetyGauge } from "./SafetyGauge";
import { AnnotatedContract, UploadedFileMeta } from "./AnnotatedContract";
import { PromptInspectorModal } from "./PromptInspectorModal";
import { CommandPalette } from "./CommandPalette";
import {
  AlertTriangle,
  Check,
  Command,
  Copy,
  Cpu,
  Download,
  FileWarning,
  History,
  KeyRound,
  MessageSquare,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type RightTab = "audit" | "negotiate" | "qa";

interface AuditHistoryItem {
  id: string;
  title: string;
  score: number;
  text: string;
  analysis: ContractAnalysis;
}

export function ClauseGuardApp() {
  const initialSample = SAMPLE_CONTRACTS[0];

  const [contractText, setContractText] = useState<string>(initialSample.text);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(initialSample.id);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileMeta | null>(null);
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [serverLiveConfigured, setServerLiveConfigured] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"edit" | "xray">("xray");
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("audit");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState<string>("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Q&A state
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<{ q: string; a: string; mode?: string }[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const pushHistory = (text: string, res: ContractAnalysis) => {
    setHistory((prev) => {
      const next: AuditHistoryItem = {
        id: `${Date.now()}`,
        title: res.contractTitle || "Contract Audit",
        score: res.safetyScore,
        text,
        analysis: res,
      };
      return [next, ...prev.filter((h) => h.title !== res.contractTitle)].slice(0, 5);
    });
  };

  const runLiveAudit = async (textToAudit: string) => {
    if (textToAudit.trim().length < 30) {
      setErrorMsg("Please paste at least 30 characters of contract text.");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    setErrorMsg(null);
    setIsAnalyzing(true);
    setPipelineStage(1);

    const t1 = setTimeout(() => setPipelineStage(2), 450);
    const t2 = setTimeout(() => setPipelineStage(3), 900);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contractText: textToAudit,
          apiKey: apiKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Live Gemini audit failed");
      }
      const typed = data as ContractAnalysis;
      setAnalysis(typed);
      pushHistory(textToAudit, typed);
      setActiveFindingId(typed.findings?.[0]?.id ?? null);
      setViewMode("xray");
      setRightTab("audit");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Only show timeout error if this controller is still the active one
        if (abortRef.current === controller) {
          setErrorMsg("Gemini took too long to respond. Please click 'Run 3-Stage AI Audit' to retry.");
        }
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Live Gemini audit failed.");
      }
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(t1);
      clearTimeout(t2);
      if (abortRef.current === controller) {
        setPipelineStage(0);
        setIsAnalyzing(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/analyze")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setServerLiveConfigured(Boolean(d?.liveConfigured));
      })
      .catch(() => {});

    const timer = setTimeout(() => {
      if (!cancelled) void runLiveAudit(initialSample.text);
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCmdPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSelectSample = (sampleId: string) => {
    const found = SAMPLE_CONTRACTS.find((s) => s.id === sampleId);
    if (!found) return;
    setSelectedSampleId(found.id);
    setUploadedFile(null);
    setContractText(found.text);
    setQaHistory([]);
    setErrorMsg(null);
    void runLiveAudit(found.text);
  };

  const handleUploadFile = async (file: File) => {
    setErrorMsg(null);
    setSelectedSampleId("");
    setQaHistory([]);

    const previewUrl =
      file.type.startsWith("image/") || file.type.startsWith("video/")
        ? URL.createObjectURL(file)
        : undefined;

    setUploadedFile({
      name: file.name,
      type: file.type,
      size: file.size,
      previewUrl,
    });

    setIsAnalyzing(true);
    setPipelineStage(1);
    const t1 = setTimeout(() => setPipelineStage(2), 500);
    const t2 = setTimeout(() => setPipelineStage(3), 1100);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (apiKey.trim()) {
        formData.append("apiKey", apiKey.trim());
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze uploaded file.");
      }
      const typed = data as ContractAnalysis;
      const finalText = typed.extractedText || `[Analyzed multimodal file: ${file.name}]`;
      setContractText(finalText);
      setAnalysis(typed);
      pushHistory(finalText, typed);
      setActiveFindingId(typed.findings?.[0]?.id ?? null);
      setViewMode("xray");
      setRightTab("audit");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "File analysis failed.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setPipelineStage(0);
      setIsAnalyzing(false);
    }
  };

  const handleRunAudit = async () => {
    await runLiveAudit(contractText);
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = qaQuestion.trim();
    if (!q || isAsking) return;
    setIsAsking(true);
    setQaQuestion("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          contractText,
          analysis,
          apiKey: apiKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to answer");
      setQaHistory((prev) => [...prev, { q, a: data.answer, mode: data.mode }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Live Gemini Q&A failed.";
      setQaHistory((prev) => [...prev, { q, a: `Error: ${msg}` }]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleExportReport = () => {
    if (!analysis) return;
    const md = [
      `# ClauseGuard AI — Contract Audit Report`,
      `**Title:** ${analysis.contractTitle}`,
      `**Category:** ${analysis.category}`,
      `**Safety Score:** ${analysis.safetyScore}/100 (${analysis.verdict})`,
      `**Engine:** ${analysis.analysisMode}`,
      ``,
      `## Executive Summary`,
      analysis.executiveSummary,
      ``,
      `## Flagged Clauses (${analysis.findings.length})`,
      ...analysis.findings.map(
        (f, i) => `### ${i + 1}. [${f.severity}] ${f.title}
- **Category:** ${f.category}
- **Potential Impact:** ${f.potentialLossEstimate}
- **Exact Quote:** "${f.exactQuote}"
- **The Trap:** ${f.plainEnglishTrap}
- **Indian Legal / Market Context:** ${f.legalContext}
- **Recommended Counter-Clause:** "${f.counterClause}"
`
      ),
      `## Negotiation Email Draft`,
      `**Subject:** ${analysis.negotiation.subject}`,
      ``,
      analysis.negotiation.emailBody,
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clauseguard-audit-report.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const severityBadge = (sev: ClauseFinding["severity"]) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-500/15 text-rose-300 border-rose-500/40";
      case "HIGH":
        return "bg-amber-500/15 text-amber-300 border-amber-500/40";
      case "MEDIUM":
        return "bg-sky-500/15 text-sky-300 border-sky-500/40";
      default:
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-grid-spotlight text-slate-100">
      {/* Top Glass Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050811]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <ShieldAlert className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  ClauseGuard <span className="text-amber-400">AI</span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
                  PromptWars × AI Vibeathon 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Adversarial 3-Stage Multimodal Contract Shield
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCmdPalette(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition"
              title="Open Command Palette"
            >
              <Command className="w-3.5 h-3.5 text-slate-400" />
              <span>Quick Actions</span>
              <kbd className="ml-1 px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-mono text-slate-400 border border-white/10">
                Ctrl+K
              </kbd>
            </button>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                apiKey.trim() || serverLiveConfigured || analysis?.analysisMode === "gemini-4-hydrogen"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-300 border-rose-500/30"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {apiKey.trim() || serverLiveConfigured || analysis?.analysisMode === "gemini-4-hydrogen"
                ? "Live Gemini 4 Hydrogen"
                : "API Key Required"}
            </span>

            <button
              type="button"
              onClick={() => setShowKeyInput((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>{apiKey ? "Key Set" : "Gemini Key"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPromptModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Prompt Pipeline</span>
            </button>

            <button
              type="button"
              onClick={handleExportReport}
              disabled={!analysis}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-200 border border-white/10 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export .md</span>
            </button>
          </div>
        </div>

        {/* Optional BYOK Drawer */}
        {showKeyInput && (
          <div className="border-t border-white/10 bg-slate-900/90 px-4 sm:px-6 py-2.5">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-300">
                Optional Custom Gemini API Key (overrides server key, kept in memory only):
              </span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="flex-1 min-w-[220px] max-w-sm px-3 py-1 rounded-lg bg-slate-950 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowKeyInput(false)}
                className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Sample Selector, Audit History & Action Strip */}
      <section className="border-b border-white/10 bg-black/25 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400 mr-1">
              Sample Contracts:
            </span>
            {SAMPLE_CONTRACTS.map((s) => {
              const active = selectedSampleId === s.id && contractText.trim() === s.text.trim();
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    active
                      ? "bg-amber-500/15 text-amber-200 border-amber-400/50 shadow-sm shadow-amber-500/10"
                      : "bg-white/5 text-slate-300 border-white/10 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span>{s.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                    {s.badge}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 text-slate-950 hover:brightness-110 disabled:opacity-60 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>{isAnalyzing ? "Running 3-Stage Audit..." : "Run 3-Stage AI Audit"}</span>
          </button>
        </div>

        {/* Session Audit History Strip */}
        {history.length > 1 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2.5 flex items-center gap-2 overflow-x-auto">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 flex-shrink-0">
              <History className="w-3 h-3" /> Recent:
            </span>
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setContractText(item.text);
                  setAnalysis(item.analysis);
                  setActiveFindingId(item.analysis.findings?.[0]?.id ?? null);
                  setViewMode("xray");
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex-shrink-0 transition"
              >
                <span className="truncate max-w-[160px]">{item.title}</span>
                <span
                  className={`font-mono font-bold ${
                    item.score < 45
                      ? "text-rose-400"
                      : item.score < 75
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {item.score}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Live 3-Stage Pipeline Progress */}
        {isAnalyzing && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 1, label: "1. Clause Extractor & Taxonomist" },
                { id: 2, label: "2. Adversarial Red-Team Auditor" },
                { id: 3, label: "3. Fair-Draft Negotiator" },
              ].map((st) => (
                <div
                  key={st.id}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition ${
                    pipelineStage >= st.id
                      ? "bg-amber-500/15 border-amber-400/40 text-amber-200"
                      : "bg-white/5 border-white/10 text-slate-500"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      pipelineStage === st.id
                        ? "bg-amber-400 animate-ping"
                        : pipelineStage > st.id
                        ? "bg-emerald-400"
                        : "bg-slate-700"
                    }`}
                  />
                  <span className="truncate">{st.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3">
            <div className="px-3 py-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}
      </section>

      {/* Main Split-Pane Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Pane: Contract X-Ray */}
        <div className="lg:col-span-5 h-[520px] lg:h-[calc(100vh-215px)] min-h-[460px]">
          <AnnotatedContract
            text={contractText}
            onChangeText={(v) => {
              setContractText(v);
              setSelectedSampleId("");
            }}
            onUploadFile={handleUploadFile}
            uploadedFile={uploadedFile}
            onClearFile={() => setUploadedFile(null)}
            findings={analysis?.findings ?? []}
            activeFindingId={activeFindingId}
            onSelectFinding={(id) => {
              setActiveFindingId(id);
              setRightTab("audit");
            }}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
          />
        </div>

        {/* Right Pane: Audit Dashboard */}
        <div className="lg:col-span-7 flex flex-col gap-4 lg:h-[calc(100vh-215px)] lg:overflow-y-auto pr-0.5">
          {!analysis ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-10 text-center space-y-3 shadow-xl">
              <Sparkles className="w-9 h-9 text-amber-400 mx-auto animate-pulse" />
              <h2 className="text-sm font-bold text-white">
                {isAnalyzing
                  ? "Running Live 3-Stage Gemini 4 Hydrogen Audit..."
                  : "Ready for Live Contract Audit"}
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Extracting binding clauses, cross-examining against Indian legal benchmarks, and drafting fair counter-clauses.
              </p>
            </div>
          ) : (
            <>
              {/* Safety Score & Risk Vectors */}
              <SafetyGauge
                score={analysis.safetyScore}
                verdict={analysis.verdict}
                riskVectors={analysis.riskVectors}
                findings={analysis.findings}
              />

              {/* Executive Summary Card */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-4 space-y-1.5 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileWarning className="w-4 h-4 text-amber-400" />
                    {analysis.contractTitle}
                  </h2>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {analysis.category} • {(analysis.pipelineMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {analysis.executiveSummary}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
                <button
                  type="button"
                  onClick={() => setRightTab("audit")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    rightTab === "audit"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Clause Redlines ({analysis.findings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab("negotiate")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    rightTab === "negotiate"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Negotiation Copilot (Email & WhatsApp)
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab("qa")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    rightTab === "qa"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/40"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ask ClauseGuard
                </button>
              </div>

              {/* Tab 1: Clause Findings with GitHub PR-style Diff */}
              {rightTab === "audit" && (
                <div className="space-y-3 pb-4">
                  {analysis.findings.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-2">
                      <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-sm font-semibold text-emerald-200">
                        No Major Predatory Clauses Detected
                      </p>
                      <p className="text-xs text-slate-300">
                        This agreement appears balanced based on our 3-stage audit.
                      </p>
                    </div>
                  ) : (
                    analysis.findings.map((f) => {
                      const isActive = f.id === activeFindingId;
                      return (
                        <div
                          key={f.id}
                          onClick={() => setActiveFindingId(f.id)}
                          className={`rounded-2xl border p-4 space-y-3 transition cursor-pointer backdrop-blur-md ${
                            isActive
                              ? "border-amber-400/60 bg-slate-900/90 shadow-lg shadow-amber-500/10"
                              : "border-white/10 bg-slate-900/55 hover:border-white/20"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${severityBadge(
                                    f.severity
                                  )}`}
                                >
                                  {f.severity}
                                </span>
                                <span className="text-[11px] text-slate-400">{f.category}</span>
                              </div>
                              <h3 className="text-sm font-bold text-white">{f.title}</h3>
                            </div>
                            <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-rose-950/70 text-rose-300 border border-rose-500/25">
                              {f.potentialLossEstimate}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="font-semibold text-rose-300">Why It&apos;s a Trap</span>
                              <p className="text-slate-300 leading-relaxed">{f.plainEnglishTrap}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-semibold text-sky-300">Indian Legal / Market Norm</span>
                              <p className="text-slate-300 leading-relaxed">{f.legalContext}</p>
                            </div>
                          </div>

                          {/* GitHub PR-Style Redline Diff */}
                          <div className="rounded-xl border border-white/10 overflow-hidden text-xs font-mono">
                            <div className="bg-rose-950/40 border-b border-white/10 px-3 py-2 text-rose-200/90 flex items-start gap-2">
                              <span className="font-bold text-rose-400 select-none">-</span>
                              <span>&ldquo;{f.exactQuote}&rdquo;</span>
                            </div>
                            <div className="bg-emerald-950/35 px-3 py-2.5 text-emerald-100/95 space-y-1.5">
                              <div className="flex items-center justify-between gap-2 font-sans">
                                <span className="text-[11px] font-semibold text-emerald-300">
                                  + Recommended Safe Counter-Clause
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(f.id, f.counterClause);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 transition"
                                >
                                  {copiedId === f.id ? (
                                    <>
                                      <Check className="w-3 h-3" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" /> Copy Redline
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-emerald-400 select-none">+</span>
                                <span className="leading-relaxed">&ldquo;{f.counterClause}&rdquo;</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Negotiation Copilot */}
              {rightTab === "negotiate" && (
                <div className="space-y-4 pb-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-white">Ready-to-Send Email</h3>
                        <p className="text-xs text-slate-400">
                          Tone: {analysis.negotiation.tone} • Subject: {analysis.negotiation.subject}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            "email",
                            `Subject: ${analysis.negotiation.subject}\n\n${analysis.negotiation.emailBody}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 transition"
                      >
                        {copiedId === "email" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === "email" ? "Copied Email" : "Copy Email"}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-sans text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {analysis.negotiation.emailBody}
                    </pre>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-white">Crisp WhatsApp Message</h3>
                        <p className="text-xs text-slate-400">
                          Fast, non-confrontational message for landlords, HR, or clients
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy("whatsapp", analysis.negotiation.whatsappShort)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition"
                      >
                        {copiedId === "whatsapp" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === "whatsapp" ? "Copied" : "Copy WhatsApp"}</span>
                      </button>
                    </div>
                    <p className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 leading-relaxed">
                      {analysis.negotiation.whatsappShort}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Ask ClauseGuard Q&A */}
              {rightTab === "qa" && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-4 flex flex-col gap-3 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      "What is the biggest financial trap here?",
                      "Is the non-compete / bond legally enforceable in India?",
                      "Can I keep my personal hackathon/side projects?",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQaQuestion(preset)}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {qaHistory.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        Ask any question about this contract—risks, exit options, or negotiation leverage.
                      </p>
                    ) : (
                      qaHistory.map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="text-xs font-semibold text-amber-300">
                            You: {item.q}
                          </div>
                          <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 leading-relaxed">
                            {item.a}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAskQuestion} className="flex gap-2">
                    <input
                      type="text"
                      value={qaQuestion}
                      onChange={(e) => setQaQuestion(e.target.value)}
                      placeholder="Ask anything about this contract..."
                      className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      type="submit"
                      disabled={isAsking || !qaQuestion.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-semibold transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAsking ? "..." : "Ask"}</span>
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <PromptInspectorModal
        open={showPromptModal}
        onClose={() => setShowPromptModal(false)}
      />

      <CommandPalette
        open={showCmdPalette}
        onClose={() => setShowCmdPalette(false)}
        onSelectSample={handleSelectSample}
        onRunAudit={handleRunAudit}
        onOpenPrompts={() => setShowPromptModal(true)}
        onExportReport={handleExportReport}
      />
    </div>
  );
}
