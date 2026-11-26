"use client";

import React, { useMemo, useState } from "react";
import { ClauseFinding } from "@/lib/types";
import { Edit3, Eye, FileText, Film, Image as ImageIcon, Music, Upload, X } from "lucide-react";

export interface UploadedFileMeta {
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
}

interface AnnotatedContractProps {
  text: string;
  onChangeText: (val: string) => void;
  onUploadFile: (file: File) => void;
  uploadedFile: UploadedFileMeta | null;
  onClearFile: () => void;
  findings: ClauseFinding[];
  activeFindingId: string | null;
  onSelectFinding: (id: string) => void;
  viewMode: "edit" | "xray";
  onChangeViewMode: (mode: "edit" | "xray") => void;
}

interface TextSegment {
  text: string;
  finding?: ClauseFinding;
}

export function AnnotatedContract({
  text,
  onChangeText,
  onUploadFile,
  uploadedFile,
  onClearFile,
  findings,
  activeFindingId,
  onSelectFinding,
  viewMode,
  onChangeViewMode,
}: AnnotatedContractProps) {
  const [isDragging, setIsDragging] = useState(false);

  const segments = useMemo<TextSegment[]>(() => {
    if (!findings.length || !text) return [{ text }];

    const matches: { start: number; end: number; finding: ClauseFinding }[] = [];
    for (const f of findings) {
      if (!f.exactQuote) continue;
      const idx = text.indexOf(f.exactQuote);
      if (idx !== -1) {
        matches.push({ start: idx, end: idx + f.exactQuote.length, finding: f });
      }
    }

    matches.sort((a, b) => a.start - b.start);

    const cleanMatches: typeof matches = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.start >= cursor) {
        cleanMatches.push(m);
        cursor = m.end;
      }
    }

    const result: TextSegment[] = [];
    let pos = 0;
    for (const m of cleanMatches) {
      if (m.start > pos) {
        result.push({ text: text.slice(pos, m.start) });
      }
      result.push({ text: text.slice(m.start, m.end), finding: m.finding });
      pos = m.end;
    }
    if (pos < text.length) {
      result.push({ text: text.slice(pos) });
    }
    return result;
  }, [text, findings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUploadFile(file);
  };

  const renderFileIcon = (type: string, name: string) => {
    const lower = name.toLowerCase();
    if (type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(lower)) {
      return <ImageIcon className="w-4 h-4 text-amber-400" />;
    }
    if (type.startsWith("video/") || /\.(mp4|webm|mov|avi)$/.test(lower)) {
      return <Film className="w-4 h-4 text-indigo-400" />;
    }
    if (type.startsWith("audio/") || /\.(mp3|wav|m4a)$/.test(lower)) {
      return <Music className="w-4 h-4 text-emerald-400" />;
    }
    return <FileText className="w-4 h-4 text-sky-400" />;
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col h-full rounded-2xl border transition overflow-hidden shadow-xl shadow-black/30 backdrop-blur-md ${
        isDragging
          ? "border-amber-400 bg-amber-500/10"
          : "border-white/10 bg-slate-900/65"
      }`}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm border-2 border-dashed border-amber-400 rounded-2xl pointer-events-none">
          <Upload className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
          <p className="text-sm font-bold text-white">Drop any contract file to audit live</p>
          <p className="text-xs text-slate-400">PDF, Word (.docx), CSV, Photo, Video, Audio, TXT</p>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-white/10 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Contract X-Ray
          </span>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
            {text.length.toLocaleString()} chars
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label
            title="Supports PDF, Word (.docx/.doc), CSV, Photos, Videos, Audio, TXT, MD"
            className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload / Drop File</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.csv,.txt,.md,.json,.xml,.html,image/*,video/*,audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {findings.length > 0 && (
            <div className="inline-flex rounded-lg bg-white/5 p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => onChangeViewMode("xray")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  viewMode === "xray"
                    ? "bg-amber-500/25 text-amber-200"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                X-Ray
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode("edit")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  viewMode === "edit"
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Supported Formats Strip / Uploaded Multimodal Preview */}
      {uploadedFile ? (
        <div className="px-4 py-2.5 border-b border-white/10 bg-slate-950/70 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {renderFileIcon(uploadedFile.type, uploadedFile.name)}
              <span className="text-xs font-medium text-slate-200 truncate">
                {uploadedFile.name}
              </span>
              <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">
                ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={onClearFile}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Clear uploaded file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {uploadedFile.previewUrl && uploadedFile.type.startsWith("image/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={uploadedFile.previewUrl}
              alt={uploadedFile.name}
              className="max-h-36 rounded-lg border border-white/10 object-contain bg-black/40"
            />
          )}
          {uploadedFile.previewUrl && uploadedFile.type.startsWith("video/") && (
            <video
              src={uploadedFile.previewUrl}
              controls
              className="max-h-40 w-full rounded-lg border border-white/10 bg-black"
            />
          )}
        </div>
      ) : (
        <div className="px-4 py-1.5 border-b border-white/5 bg-slate-950/40 text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500">Drop or upload:</span>
          {["PDF", "Word (.docx)", "CSV", "Photo", "Video", "Audio", "TXT"].map((fmt) => (
            <span
              key={fmt}
              className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10"
            >
              {fmt}
            </span>
          ))}
        </div>
      )}

      {/* Body */}
      {viewMode === "xray" && findings.length > 0 ? (
        <div className="flex-1 p-4 overflow-y-auto whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-slate-300">
          {segments.map((seg, i) => {
            if (!seg.finding) {
              return <span key={i}>{seg.text}</span>;
            }
            const isActive = seg.finding.id === activeFindingId;
            const sevStyles =
              seg.finding.severity === "CRITICAL"
                ? "bg-rose-500/20 border-b-2 border-rose-500 text-rose-100 hover:bg-rose-500/30"
                : seg.finding.severity === "HIGH"
                ? "bg-amber-500/20 border-b-2 border-amber-500 text-amber-100 hover:bg-amber-500/30"
                : "bg-sky-500/20 border-b-2 border-sky-400 text-sky-100 hover:bg-sky-500/30";

            return (
              <mark
                key={i}
                onClick={() => onSelectFinding(seg.finding!.id)}
                title={`${seg.finding.severity}: ${seg.finding.title} (Click to inspect)`}
                className={`cursor-pointer rounded px-1 py-0.5 transition ${sevStyles} ${
                  isActive ? "ring-2 ring-white/80" : ""
                }`}
              >
                {seg.text}
                <span className="ml-1.5 inline-block text-[10px] font-sans font-bold uppercase px-1.5 py-0.2 rounded bg-slate-950/90 text-white align-middle">
                  {seg.finding.severity}
                </span>
              </mark>
            );
          })}
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Paste any contract text, or drag & drop PDF, Word (.docx), CSV, Photo, Video, or Audio here..."
          className="flex-1 w-full p-4 bg-transparent resize-none focus:outline-none font-mono text-[13px] leading-relaxed text-slate-200 placeholder:text-slate-500"
          spellCheck={false}
        />
      )}
    </div>
  );
}
