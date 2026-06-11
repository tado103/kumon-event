import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Event } from "@/lib/types";
import { PURPOSE_LABELS } from "@/lib/constants";



export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { event }: { event: Event } = await req.json();

  const prompt = `あなたは公文式教室のイベント設計専門家です。
以下のイベント設計をレビューしてください。

イベント名: ${event.title}
目的: ${PURPOSE_LABELS[event.purpose]}
ゴール: ${event.goal}
Before（参加前の状態）: ${event.before_state}
After（参加後の理想）: ${event.after_state}
理想の感想: ${event.ideal_feedback}
行動変容目標: ${event.behavior_change}
タイムライン項目数: ${event.timeline?.length ?? 0}件

以下の観点で評価・フィードバックしてください:
✓ 一番伝えたいメッセージに沿った設計か
✓ ワーク難易度は適切か
✓ インプットとアウトプットのバランス
✓ 参加者の行動が具体的か
✓ アウトプット方法が設計されているか
✓ 双方向性があるか
✓ 飽きさせない工夫があるか
✓ 必要ツールは揃っているか
✓ 懸念事項を想定できているか

不足している点は具体的に指摘し、改善案も提示してください。
全体評価（5段階）も最後に示してください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return NextResponse.json({ review: completion.choices[0].message.content });
  } catch {
    return NextResponse.json({ review: "レビューに失敗しました" }, { status: 500 });
  }
}
