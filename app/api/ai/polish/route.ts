import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PURPOSE_LABELS } from "@/lib/constants";



export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { purpose, target, content } = await req.json();
  const purposeLabel = PURPOSE_LABELS[purpose as keyof typeof PURPOSE_LABELS];

  const prompt = `あなたは公文式教室のイベント設計専門家です。
以下のイベントを分析し、改善提案をしてください。

目的: ${purposeLabel}
ターゲット: ${target}
イベント内容: ${content}

以下の観点で具体的な改善提案をしてください:
1. ゴール設計の改善
2. コンテンツの改善
3. 集客方法の改善
4. 準備負荷の軽減
5. 想定される懸念事項と対策

日本語で、具体的かつ実践的な提案を行ってください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch {
    return NextResponse.json({ result: "分析に失敗しました" }, { status: 500 });
  }
}
