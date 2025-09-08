// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = (body?.messages ?? []) as Msg[];

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ ok: false, error: "Missing OPENROUTER_API_KEY" }, { status: 500 });
    }

    const client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": process.env.SITE_NAME || "LID Chat",
      },
    });

    const model = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3.1:free";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content:
            "You are DeepSeek assisting with childcare energy & sustainability (energy, water, waste, NQS 3 & 7). Be concise, practical, and precise.",
        },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const message = completion.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ ok: true, message, model });
  } catch (err: any) {
    console.error("Chat route error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
