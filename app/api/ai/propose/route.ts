import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PURPOSE_LABELS, GRADE_LABELS, AUDIENCE_LABELS } from "@/lib/constants";



export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { purpose, grade, audience } = await req.json();

  const purposeLabel = PURPOSE_LABELS[purpose as keyof typeof PURPOSE_LABELS];
  const gradeLabel = GRADE_LABELS[grade as keyof typeof GRADE_LABELS];
  const audienceLabel = AUDIENCE_LABELS[audience as keyof typeof AUDIENCE_LABELS];

  const prompt = `あなたは公文式教室の運営コンサルタントです。
以下の条件に合ったイベント案を10件提案してください。

目的: ${purposeLabel}
メインターゲット: ${gradeLabel}
ターゲット属性: ${audienceLabel}

教室条件:
- 定員30席
- 飲食基本不可
- 準備負荷は低め優先
- 会場は教室内

各提案を以下のJSON形式で返してください:
{
  "proposals": [
    {
      "title": "イベント名",
      "summary": "内容の概要（2〜3文）",
      "effect": "想定効果",
      "attraction": "集客力（高/中/低 + 理由）",
      "prepLoad": "準備負荷（高/中/低 + 理由）",
      "cost": "コスト感（目安金額）",
      "duration": "所要時間"
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
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ proposals: [] }, { status: 500 });
  }
}
