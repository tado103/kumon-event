"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  PURPOSE_LABELS,
  GRADE_LABELS,
  AUDIENCE_LABELS,
} from "@/lib/constants";
import { EventPurpose, GradeTarget, AudienceType } from "@/lib/types";
import { Sparkles, ArrowRight, Wand2, Edit3 } from "lucide-react";

type Mode = "choose" | "ai_propose" | "ai_propose_result" | "polish";

interface EventProposal {
  title: string;
  summary: string;
  effect: string;
  attraction: string;
  prepLoad: string;
  cost: string;
  duration: string;
}

const purposeOptions = Object.entries(PURPOSE_LABELS).map(([v, l]) => ({ value: v, label: l }));
const gradeOptions = Object.entries(GRADE_LABELS).map(([v, l]) => ({ value: v, label: l }));
const audienceOptions = Object.entries(AUDIENCE_LABELS).map(([v, l]) => ({ value: v, label: l }));

export default function NewEventPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [purpose, setPurpose] = useState<EventPurpose>("satisfaction");
  const [grade, setGrade] = useState<GradeTarget>("grade1_2");
  const [audience, setAudience] = useState<AudienceType>("internal");
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<EventProposal[]>([]);

  // Polish mode
  const [polishPurpose, setPolishPurpose] = useState<EventPurpose>("satisfaction");
  const [polishTarget, setPolishTarget] = useState("");
  const [polishContent, setPolishContent] = useState("");
  const [polishResult, setPolishResult] = useState("");

  async function handlePropose() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, grade, audience }),
      });
      const data = await res.json();
      setProposals(data.proposals ?? []);
      setMode("ai_propose_result");
    } catch {
      alert("提案の取得に失敗しました");
    }
    setLoading(false);
  }

  async function handleAdopt(proposal: EventProposal) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("events")
      .insert({
        user_id: user!.id,
        title: proposal.title,
        purpose,
        grade_targets: [grade],
        audience_type: audience,
        goal: proposal.effect,
        status: "planning",
      })
      .select()
      .single();
    if (error || !data) return alert("作成に失敗しました");
    router.push(`/events/${data.id}`);
  }

  async function handlePolish() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: polishPurpose, target: polishTarget, content: polishContent }),
      });
      const data = await res.json();
      setPolishResult(data.result ?? "");
      setMode("polish");
    } catch {
      alert("分析に失敗しました");
    }
    setLoading(false);
  }

  async function handleCreateBlank() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("events")
      .insert({ user_id: user!.id, status: "planning" })
      .select()
      .single();
    if (error || !data) return alert("作成に失敗しました");
    router.push(`/events/${data.id}`);
  }

  if (mode === "choose") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
        <h1 className="text-2xl font-semibold text-stone-900 mb-2">新規イベント</h1>
        <p className="text-sm text-stone-500 mb-8">作成方法を選んでください</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card
            hoverable
            onClick={() => setMode("ai_propose")}
            className="p-5 cursor-pointer"
          >
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">AIイベント提案</h3>
                <p className="text-xs text-stone-500">目的・ターゲットを入力すると、AIが10件のイベント案を提案します</p>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => setMode("polish")}
            className="p-5 cursor-pointer"
          >
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">既存イベントの改善</h3>
                <p className="text-xs text-stone-500">既存のイベント内容をAIがブラッシュアップします</p>
              </div>
            </div>
          </Card>
        </div>

        <button
          onClick={handleCreateBlank}
          className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          ゼロから手動で作成
        </button>
      </div>
    );
  }

  if (mode === "ai_propose") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
        <button onClick={() => setMode("choose")} className="text-sm text-stone-500 hover:text-stone-700 mb-6">← 戻る</button>
        <h1 className="text-xl font-semibold text-stone-900 mb-6">AIイベント提案</h1>

        <div className="flex flex-col gap-5">
          <Select
            label="目的"
            options={purposeOptions}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as EventPurpose)}
          />
          <Select
            label="メインターゲット（学年）"
            options={gradeOptions}
            value={grade}
            onChange={(e) => setGrade(e.target.value as GradeTarget)}
          />
          <Select
            label="ターゲット属性"
            options={audienceOptions}
            value={audience}
            onChange={(e) => setAudience(e.target.value as AudienceType)}
          />

          <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-600 border border-stone-200">
            <p className="font-medium text-stone-700 mb-1">教室条件（固定）</p>
            <ul className="flex flex-col gap-0.5 text-xs text-stone-500">
              <li>• 定員30席</li>
              <li>• 飲食基本不可</li>
              <li>• 準備負荷は低め優先</li>
            </ul>
          </div>

          <Button variant="primary" loading={loading} onClick={handlePropose} className="w-full">
            <Sparkles className="w-4 h-4" />
            10件のイベント案を提案する
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "ai_propose_result") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
        <button onClick={() => setMode("ai_propose")} className="text-sm text-stone-500 hover:text-stone-700 mb-6">← 条件を変更</button>
        <h1 className="text-xl font-semibold text-stone-900 mb-2">イベント提案</h1>
        <p className="text-sm text-stone-500 mb-6">採用したいイベントを選択してください</p>

        <div className="flex flex-col gap-4">
          {proposals.map((p, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-stone-900">{p.title}</h3>
                <Button size="sm" variant="primary" onClick={() => handleAdopt(p)}>
                  採用
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-sm text-stone-600 mb-3">{p.summary}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "想定効果", value: p.effect },
                  { label: "集客力", value: p.attraction },
                  { label: "準備負荷", value: p.prepLoad },
                  { label: "コスト", value: p.cost },
                  { label: "所要時間", value: p.duration },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-stone-50 rounded-lg p-2">
                    <p className="text-[10px] text-stone-400 mb-0.5">{label}</p>
                    <p className="text-xs text-stone-700">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Polish mode
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
      <button onClick={() => setMode("choose")} className="text-sm text-stone-500 hover:text-stone-700 mb-6">← 戻る</button>
      <h1 className="text-xl font-semibold text-stone-900 mb-6">既存イベントの改善</h1>

      {!polishResult ? (
        <div className="flex flex-col gap-5">
          <Select
            label="目的"
            options={purposeOptions}
            value={polishPurpose}
            onChange={(e) => setPolishPurpose(e.target.value as EventPurpose)}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-700">ターゲット</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              value={polishTarget}
              onChange={(e) => setPolishTarget(e.target.value)}
              placeholder="例：小1〜2年生の内部生"
            />
          </div>
          <Textarea
            label="イベント内容"
            value={polishContent}
            onChange={(e) => setPolishContent(e.target.value)}
            placeholder="既存のイベント概要を入力してください"
            className="min-h-[120px]"
          />
          <Button variant="primary" loading={loading} onClick={handlePolish} className="w-full">
            <Wand2 className="w-4 h-4" />
            AIで改善提案を取得
          </Button>
        </div>
      ) : (
        <div>
          <div className="bg-white border border-stone-200 rounded-xl p-5 whitespace-pre-wrap text-sm text-stone-700 leading-relaxed mb-6">
            {polishResult}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setPolishResult("")}>
              やり直す
            </Button>
            <Button variant="primary" onClick={handleCreateBlank}>
              この内容でイベントを作成
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
