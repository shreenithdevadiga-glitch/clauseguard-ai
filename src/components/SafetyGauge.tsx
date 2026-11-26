"use client";

import React from "react";
import { ClauseFinding, RiskVectors } from "@/lib/types";

interface SafetyGaugeProps {
  score: number;
  verdict: string;
  riskVectors: RiskVectors;
  findings: ClauseFinding[];
}

export function SafetyGauge({ score, verdict, riskVectors, findings }: SafetyGaugeProps) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const scoreColor =
    clamped < 45 ? "#f43f5e" : clamped < 75 ? "#f59e0b" : "#10b981";
  const glowColor =
    clamped < 45
      ? "bg-rose-500/20"
      : clamped < 75
      ? "bg-amber-500/20"
      : "bg-emerald-500/20";
  const badgeClasses =
    clamped < 45
      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
      : clamped < 75
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";

  const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  const mediumCount = findings.filter((f) => f.severity === "MEDIUM" || f.severity === "LOW").length;

  const vectors = [
    { label: "Financial Trap", value: riskVectors.financialTrap },
    { label: "IP & Rights Grab", value: riskVectors.ipRightsGrab },
    { label: "Lock-in & Exit", value: riskVectors.lockInPenalty },
    { label: "Unilateral Power", value: riskVectors.unilateralPower },
  ];

  return (
    <div className="relative rounded-2xl border border-white/10 bg-slate-900/65 backdrop-blur-md p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 shadow-xl shadow-black/30">
      {/* Radial Gauge with subtle ambient aura */}
      <div className="relative flex-shrink-0 w-28 h-28 flex items-center justify-center">
        <div className={`absolute inset-2 rounded-full blur-xl ${glowColor} animate-pulse-glow`} />
        <svg
          className="relative w-28 h-28 -rotate-90"
          viewBox="0 0 100 100"
          aria-label={`Safety score ${clamped} out of 100`}
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="8.5"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight tabular-nums text-white">
            {clamped}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            Safety / 100
          </span>
        </div>
      </div>

      {/* Verdict, Severity Pills & Risk Vector Bars */}
      <div className="flex-1 w-full space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClasses}`}
          >
            {verdict}
          </span>

          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">
                {criticalCount} Critical
              </span>
            )}
            {highCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {highCount} High
              </span>
            )}
            {mediumCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30">
                {mediumCount} Med/Low
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5">
          {vectors.map((v) => {
            const barColor =
              v.value >= 75
                ? "bg-gradient-to-r from-rose-500 to-pink-500"
                : v.value >= 45
                ? "bg-gradient-to-r from-amber-500 to-orange-400"
                : "bg-gradient-to-r from-emerald-500 to-teal-400";
            return (
              <div key={v.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{v.label}</span>
                  <span className="font-mono tabular-nums text-slate-400">{v.value}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${Math.max(4, Math.min(100, v.value))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
