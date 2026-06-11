import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Event } from "@/lib/types";
import { PURPOSE_LABELS } from "@/lib/constants";



export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { event }: { event: Event } = await req.json();

  const prompt = `あなたは公文式教室の運営分析専門家です。
以下のイベントの振り返りデータを分析し、レポートを作成してください。

【基本情報】
イベント名: ${event.title}
目的: ${PURPOSE_LABELS[event.purpose]}
開催日: ${event.event_date ? new Date(event.event_date).toLocaleDateString("ja-JP") : "不明"}

【実績データ】
申込: ${event.applicants ?? "-"}名
参加: ${event.participants ?? "-"}名
友達参加: ${event.friend_participants ?? "-"}名
体験: ${event.trial_count ?? "-"}名
入会: ${event.enrollment_count ?? "-"}名

【定性データ】
良かった点: ${event.good_points}
改善点: ${event.improvement_points}
子どもの反応: ${event.child_reactions}
保護者の反応: ${event.parent_reactions}

【評価】
${event.rating ? JSON.stringify(event.rating) : "評価なし"}

以下の構成でレポートを作成してください:
## 成功要因
（具体的に3〜5点）

## 改善ポイント
（具体的に2〜3点）

## 次回の提案
（このイベントをさらに良くするための具体的なアイデア）

## 他イベントへの応用
（今回学んだことを他のイベントに活かすには）`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return NextResponse.json({ analysis: completion.choices[0].message.content });
  } catch {
    return NextResponse.json({ analysis: "分析に失敗しました" }, { status: 500 });
  }
}
