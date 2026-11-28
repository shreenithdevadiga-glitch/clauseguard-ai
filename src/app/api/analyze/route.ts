import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";
import { UNIFIED_AUDIT_SYSTEM_PROMPT } from "@/lib/prompts";
import { ContractAnalysis } from "@/lib/types";
import { buildContractCacheKey, getCachedAudit, setCachedAudit } from "@/lib/cache";
import {
  clampScore,
  InvalidAuditResponseError,
  parseAndValidateAuditResponse,
  runGeminiInteraction,
  safeReadJsonBody,
} from "@/lib/gemini";

export async function GET() {
  return NextResponse.json({
    liveConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    model: "gemini-4-hydrogen",
  });
}

function resolveMimeType(fileName: string, rawType: string): string {
  const lower = fileName.toLowerCase();
  if (rawType && rawType !== "application/octet-stream") return rawType;
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/mov";
  if (lower.endsWith(".avi")) return "video/avi";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".csv")) return "text/csv";
  return "text/plain";
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const contentType = req.headers.get("content-type") || "";
    let contractText = "";
    let userApiKey = "";
    let uploadedFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const fileEntry = formData.get("file");
      if (fileEntry instanceof File) {
        uploadedFile = fileEntry;
      }
      const textEntry = formData.get("contractText");
      if (typeof textEntry === "string") {
        contractText = textEntry.trim();
      }
      const keyEntry = formData.get("apiKey");
      if (typeof keyEntry === "string") {
        userApiKey = keyEntry.trim();
      }
    } else {
      const bodyResult = await safeReadJsonBody(req);
      if (!bodyResult.ok) {
        return bodyResult.response;
      }
      contractText =
        typeof bodyResult.data.contractText === "string"
          ? bodyResult.data.contractText.trim()
          : "";
      userApiKey =
        typeof bodyResult.data.apiKey === "string"
          ? bodyResult.data.apiKey.trim()
          : "";
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY?.trim() || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Please provide a valid Gemini API key." },
        { status: 401 }
      );
    }

    const client = new GoogleGenAI({ apiKey });
    let extractedText = contractText;

    type MultimodalInput =
      | string
      | Array<
          | { type: "text"; text: string }
          | { type: "document"; data: string; mime_type: string }
          | { type: "image"; data: string; mime_type: string }
          | { type: "video"; data: string; mime_type: string }
          | { type: "audio"; data: string; mime_type: string }
        >;

    let modelInput: MultimodalInput = "";

    if (uploadedFile) {
      if (uploadedFile.size > 20 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File exceeds 20 MB limit. Please upload a smaller file." },
          { status: 413 }
        );
      }
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = resolveMimeType(uploadedFile.name, uploadedFile.type);
      const lowerName = uploadedFile.name.toLowerCase();

      if (
        lowerName.endsWith(".docx") ||
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const docResult = await mammoth.extractRawText({ buffer });
        extractedText = docResult.value.trim();
        if (!extractedText) {
          return NextResponse.json(
            { error: "Could not extract readable text from this DOCX file." },
            { status: 400 }
          );
        }
        modelInput = `Audit this Word document (${uploadedFile.name}) and return ONLY valid JSON:\n\n---\n${extractedText.slice(0, 24000)}\n---`;
      } else if (
        mimeType.startsWith("text/") ||
        lowerName.endsWith(".txt") ||
        lowerName.endsWith(".md") ||
        lowerName.endsWith(".csv") ||
        lowerName.endsWith(".json") ||
        lowerName.endsWith(".xml") ||
        lowerName.endsWith(".html") ||
        lowerName.endsWith(".doc")
      ) {
        extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\r\n\t\u00A0-\uFFFF]/g, " ").trim();
        if (!extractedText || extractedText.length < 20) {
          return NextResponse.json(
            { error: `Could not read enough text from ${uploadedFile.name}. For legacy .doc binary files, please save as .docx or .pdf.` },
            { status: 400 }
          );
        }
        modelInput = `Audit this uploaded file (${uploadedFile.name}) and return ONLY valid JSON:\n\n---\n${extractedText.slice(0, 24000)}\n---`;
      } else if (mimeType === "application/pdf") {
        const base64 = buffer.toString("base64");
        modelInput = [
          {
            type: "text",
            text: `Audit this PDF agreement (${uploadedFile.name}). Also populate "extractedText" with the full readable contract text so exactQuote highlights match it. Return ONLY valid JSON.`,
          },
          { type: "document", data: base64, mime_type: "application/pdf" },
        ];
      } else if (mimeType.startsWith("image/")) {
        const base64 = buffer.toString("base64");
        modelInput = [
          {
            type: "text",
            text: `Perform OCR on this contract/terms photo (${uploadedFile.name}) and audit every clause. Populate "extractedText" with the full transcribed text from the image so exactQuote highlights match it. Return ONLY valid JSON.`,
          },
          { type: "image", data: base64, mime_type: mimeType },
        ];
      } else if (mimeType.startsWith("video/")) {
        const base64 = buffer.toString("base64");
        modelInput = [
          {
            type: "text",
            text: `Analyze this video (${uploadedFile.name})—read any on-screen contract/terms text and transcribe any spoken terms or verbal promises. Audit all risks and dark patterns, and populate "extractedText" with the transcribed/extracted text. Return ONLY valid JSON.`,
          },
          { type: "video", data: base64, mime_type: mimeType },
        ];
      } else if (mimeType.startsWith("audio/")) {
        const base64 = buffer.toString("base64");
        modelInput = [
          {
            type: "text",
            text: `Transcribe this audio recording (${uploadedFile.name}) of an agreement/verbal offer and audit all risks, hidden conditions, or traps. Populate "extractedText" with the transcript. Return ONLY valid JSON.`,
          },
          { type: "audio", data: base64, mime_type: mimeType },
        ];
      } else {
        return NextResponse.json(
          { error: `Unsupported file type: ${uploadedFile.name} (${mimeType}).` },
          { status: 400 }
        );
      }
    } else {
      if (!contractText || contractText.length < 30) {
        return NextResponse.json(
          { error: "Please provide at least 30 characters of contract text or upload a file." },
          { status: 400 }
        );
      }
      const cacheKey = buildContractCacheKey(contractText);
      const cached = getCachedAudit(cacheKey);
      if (cached) {
        return NextResponse.json(
          { ...cached, pipelineMs: Date.now() - startedAt },
          { headers: { "X-Cache": "HIT" } }
        );
      }
      modelInput = `Audit this agreement and return ONLY valid JSON:\n\n---\n${contractText.slice(0, 24000)}\n---`;
    }

    const { outputText: rawText } = await runGeminiInteraction(client, {
      system_instruction: UNIFIED_AUDIT_SYSTEM_PROMPT,
      input: modelInput,
    });

    if (!rawText) {
      return NextResponse.json(
        { error: "Gemini returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    const validated = parseAndValidateAuditResponse(rawText, extractedText);

    const result: ContractAnalysis = {
      ...validated,
      safetyScore: clampScore(validated.safetyScore, 50),
      analysisMode: "gemini-4-hydrogen",
      pipelineMs: Date.now() - startedAt,
      analyzedAt: new Date().toISOString(),
    };

    if (!uploadedFile && contractText) {
      setCachedAudit(buildContractCacheKey(contractText), result);
    }

    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    if (err instanceof InvalidAuditResponseError) {
      return NextResponse.json(
        { error: "Gemini returned an invalid audit payload. Please try again." },
        { status: 502 }
      );
    }
    console.error("Gemini Analyze error:", err);
    return NextResponse.json(
      { error: "Live Gemini audit failed. Please verify your API key and try again." },
      { status: 500 }
    );
  }
}
