import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ContractAnalysis } from "@/lib/types";
import { runGeminiInteraction, safeReadJsonBody } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const bodyResult = await safeReadJsonBody(req);
    if (!bodyResult.ok) {
      return bodyResult.response;
    }
    const body = bodyResult.data;

    const question = typeof body.question === "string" ? body.question.trim() : "";
    const contractText = typeof body.contractText === "string" ? body.contractText : "";
    const analysis = body.analysis as ContractAnalysis | undefined;
    const userApiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

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
    const { outputText: answer } = await runGeminiInteraction(client, {
      system_instruction:
        "You are ClauseGuard AI Copilot. Answer the user's question about their contract concisely (3-5 sentences max), citing specific clauses and practical Indian legal/market norms. Frame as educational contract risk guidance, not formal attorney-client representation.",
      input: `CONTRACT:\n${contractText.slice(0, 12000)}\n\nAUDIT SUMMARY:\n${analysis?.executiveSummary || ""}\n\nUSER QUESTION: ${question}`,
    });

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
    return NextResponse.json(
      { error: "Live Gemini Q&A failed. Please verify your API key and try again." },
      { status: 500 }
    );
  }
}
