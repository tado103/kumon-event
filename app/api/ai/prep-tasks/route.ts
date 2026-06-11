import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Event } from "@/lib/types";
import { PURPOSE_LABELS, AUDIENCE_LABELS } from "@/lib/constants";
import { PrepTask } from "@/lib/types";



export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { event }: { event: Event } = await req.json();

  const isExternal = event.audience_type === "external";
  const eventDate = event.event_date ? new Date(event.event_date) : null;

  const prompt = `あなたは公文式教室の運営コンサルタントです。
以下のイベントの準備タスクリストを生成してください。

イベント名: ${event.title}
目的: ${PURPOSE_LABELS[event.purpose]}
ターゲット: ${AUDIENCE_LABELS[event.audience_type]}
開催日: ${eventDate ? eventDate.toLocaleDateString("ja-JP") : "未定"}
必要ツール: ${(event.required_tools ?? []).join(", ") || "なし"}

${isExternal ? "外部向けイベントのため、チラシ・SNS告知・ポスティングも含めてください。" : "内部向けイベントです。"}

以下のJSON形式で準備タスクを15〜20件返してください:
{
  "tasks": [
    {
      "id": "uuid形式でランダムな文字列",
      "title": "タスク名",
      "deadline": "YYYY-MM-DD形式（イベント日からの逆算で設定）",
      "assignee": "担当者（基本は空文字）",
      "completed": false,
      "category": "カテゴリ（内容確認/備品/告知/当日準備 など）"
    }
  ]
}

必ずJSONのみ返してください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content ?? "{}");
    // Ensure each task has a proper id
    const tasks: PrepTask[] = (data.tasks ?? []).map((t: PrepTask) => ({
      ...t,
      id: crypto.randomUUID(),
    }));
    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ tasks: [] }, { status: 500 });
  }
}
