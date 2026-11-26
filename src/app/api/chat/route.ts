import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ContractAnalysis } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    const contractText = typeof body?.contractText === "string" ? body.contractText : "";
    const analysis = body?.analysis as ContractAnalysis | undefined;
    const userApiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY?.trim() || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Please provide a valid Gemini API key." },
        { status: 401 }
      );
    }

    const client = new GoogleGenAI({ apiKey });
    const LIVE_MODELS = ["gemini-3.5-flash-lite", "gemini-4-hydrogen", "gemini-4-argon"] as const;
    let interaction: Awaited<ReturnType<typeof client.interactions.create>> | null = null;
    let lastError: unknown = null;

    for (const modelName of LIVE_MODELS) {
      try {
        interaction = await client.interactions.create(
          {
            model: modelName,
            system_instruction:
              "You are ClauseGuard AI Copilot. Answer the user's question about their contract concisely (3-5 sentences max), citing specific clauses and practical Indian legal/market norms. Frame as educational contract risk guidance, not formal attorney-client representation.",
            input: `CONTRACT:\n${contractText.slice(0, 12000)}\n\nAUDIT SUMMARY:\n${analysis?.executiveSummary || ""}\n\nUSER QUESTION: ${question}`,
            store: false,
          },
          { signal: AbortSignal.timeout(20000) }
        );
        break;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (!/503|429|high demand|timed out|timeout|aborted/i.test(msg)) {
          throw err;
        }
      }
    }

    if (!interaction) {
      throw lastError ?? new Error("All live Gemini models failed.");
    }

    const answer = interaction.output_text?.trim();
    if (!answer) {
      return NextResponse.json(
        { error: "Gemini returned an empty answer." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      answer,
      mode: "gemini-4-hydrogen",
    });
  } catch (err) {
    console.error("Gemini Chat error:", err);
    const message = err instanceof Error ? err.message : "Gemini API request failed.";
    return NextResponse.json(
      { error: `Live Gemini Q&A failed: ${message}` },
      { status: 500 }
    );
  }
}
