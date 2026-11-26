"use client";

import React, { useEffect, useState } from "react";
import { SAMPLE_CONTRACTS } from "@/lib/samples";
import { Command, Cpu, Download, FileText, Scale, Search, X } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectSample: (id: string) => void;
  onRunAudit: () => void;
  onOpenPrompts: () => void;
  onExportReport: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onSelectSample,
  onRunAudit,
  onOpenPrompts,
  onExportReport,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
      } else if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const actions = [
    {
      id: "run-audit",
      label: "Run 3-Stage Live AI Audit",
      hint: "Analyze current contract",
      icon: Scale,
      run: () => {
        onRunAudit();
        onClose();
      },
    },
    {
      id: "prompts",
      label: "Inspect 3-Stage Prompt Pipeline",
      hint: "View system prompts",
      icon: Cpu,
      run: () => {
        onOpenPrompts();
        onClose();
      },
    },
    {
      id: "export",
      label: "Export Audit Report (.md)",
      hint: "Download Markdown summary",
      icon: Download,
      run: () => {
        onExportReport();
        onClose();
      },
    },
    ...SAMPLE_CONTRACTS.map((s) => ({
      id: `sample-${s.id}`,
      label: `Load Sample: ${s.label}`,
      hint: s.category,
      icon: FileText,
      run: () => {
        onSelectSample(s.id);
        onClose();
      },
    })),
  ].filter(
    (a) =>
      !query.trim() ||
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.hint.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#090E1A]/95 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or sample contract..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {actions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No matching commands.</p>
          ) : (
            actions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={a.run}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/10 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span className="text-xs sm:text-sm font-medium text-slate-100">
                      {a.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 group-hover:text-slate-300">
                    {a.hint}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/10 bg-black/30 flex items-center justify-between text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Command className="w-3 h-3" />K to toggle
          </span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
