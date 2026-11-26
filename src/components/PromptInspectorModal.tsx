"use client";

import React from "react";
import { PROMPT_PIPELINE_STAGES } from "@/lib/prompts";
import { Cpu, X } from "lucide-react";

interface PromptInspectorModalProps {
  open: boolean;
  onClose: () => void;
}

export function PromptInspectorModal({ open, onClose }: PromptInspectorModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-pipeline-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-700/80 bg-[#0B1120] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
              <Cpu className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="prompt-pipeline-title" className="text-base font-bold text-white">
                3-Stage Adversarial Prompt Pipeline
              </h2>
              <p className="text-xs text-slate-400">
                PromptWars Architecture • Powered by Gemini 4 Hydrogen (@google/genai)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {PROMPT_PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.stage}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-amber-300">
                  Stage {stage.stage}: {stage.agentName}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {stage.model}
                </span>
              </div>
              <p className="text-xs text-slate-400">{stage.role}</p>
              <pre className="mt-2 p-3 rounded-lg bg-slate-950/90 border border-slate-800/80 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {stage.systemPrompt}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
