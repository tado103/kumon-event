import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Event } from "@/lib/types";
import { PURPOSE_LABELS, AUDIENCE_LABELS, GRADE_LABELS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { event }: { event: Event } = await req.json();

  const grades = (event.grade_targets ?? []).map((g) => GRADE_LABELS[g]).join("、");

  const prompt = `あなたは公文式教室の運営コンサルタントです。
以下のイベント情報をもとに、ゴール設計の草案を作成してください。

イベント名: ${event.title || "未設定"}
目的: ${PURPOSE_LABELS[event.purpose] || "未設定"}
対象: ${AUDIENCE_LABELS[event.audience_type] || "未設定"}
学年: ${grades || "未設定"}
概要ゴール: ${event.goal || "未設定"}

以下のJSON形式で返してください:
{
  "before_state": "参加前の生徒・保護者の状態・課題（2〜3文）",
  "after_state": "参加後に実現したい理想の変化（2〜3文）",
  "ideal_feedback": "終了後にこんな声が出たら成功という具体的な感想（1〜2文、セリフ形式）",
  "behavior_change": "終了後にこんな行動が起こってほしい（具体的な行動を2〜3つ）"
}

必ずJSONのみ返してください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content ?? "{}");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
