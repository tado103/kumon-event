"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { PURPOSE_LABELS, GRADE_LABELS, AUDIENCE_LABELS } from "@/lib/constants";
import { EventPurpose, GradeTarget, AudienceType, Event } from "@/lib/types";
import { OWNER_ID } from "@/lib/user";
import { Sparkles, ArrowRight, Wand2, Edit3, Lightbulb, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "choose" | "ai_propose" | "ai_propose_result" | "polish" | "idea";

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

  // AI propose
  const [purpose, setPurpose] = useState<EventPurpose>("satisfaction");
  const [grade, setGrade] = useState<GradeTarget>("grade1_2");
  const [audience, setAudience] = useState<AudienceType>("internal");
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<EventProposal[]>([]);

  // Polish
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [selectedPastId, setSelectedPastId] = useState("");
  const [polishNote, setPolishNote] = useState("");
  const [polishResult, setPolishResult] = useState("");

  // Idea memo
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaPurposes, setIdeaPurposes] = useState<EventPurpose[]>([]);
  const [ideaGrades, setIdeaGrades] = useState<GradeTarget[]>([]);
  const [ideaAudiences, setIdeaAudiences] = useState<AudienceType[]>([]);
  const [ideaMemo, setIdeaMemo] = useState("");

  useEffect(() => {
    if (mode === "polish") {
      fetchPastEvents();
    }
  }, [mode]);

  async function fetchPastEvents() {
    const supabase = createClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", OWNER_ID)
      .order("created_at", { ascending: false });
    setPastEvents((data ?? []) as Event[]);
  }

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
    const { data, error } = await supabase
      .from("events")
      .insert({
        user_id: OWNER_ID,
        title: proposal.title,
        purpose,
        grade_targets: [grade],
        audience_type: audience,
        goal: proposal.effect,
        status: "planning",
      })
      .select()
      .single();
    if (error || !data) return alert("作成に失敗しました: " + error?.message);
    router.push(`/events/${data.id}`);
  }

  async function handlePolish() {
    setLoading(true);
    try {
      const selectedEvent = pastEvents.find(e => e.id === selectedPastId);
      const res = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: selectedEvent?.purpose ?? "satisfaction",
          target: selectedEvent ? `${selectedEvent.title}（過去のイベント）` : "",
          content: selectedEvent
            ? `タイトル: ${selectedEvent.title}\nゴール: ${selectedEvent.goal}\n良かった点: ${selectedEvent.good_points}\n改善点: ${selectedEvent.improvement_points}\n\n追加の改善希望: ${polishNote}`
            : polishNote,
        }),
      });
      const data = await res.json();
      setPolishResult(data.result ?? "");
    } catch {
      alert("分析に失敗しました");
    }
    setLoading(false);
  }

  async function handleCreateFromPolish() {
    const selectedEvent = pastEvents.find(e => e.id === selectedPastId);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .insert({
        user_id: OWNER_ID,
        title: selectedEvent ? `${selectedEvent.title}（改善版）` : "",
        purpose: selectedEvent?.purpose ?? "satisfaction",
        grade_targets: selectedEvent?.grade_targets ?? [],
        audience_type: selectedEvent?.audience_type ?? "internal",
        status: "planning",
      })
      .select()
      .single();
    if (error || !data) return alert("作成に失敗しました: " + error?.message);
    router.push(`/events/${data.id}`);
  }

  async function handleCreateBlank() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .insert({ user_id: OWNER_ID, status: "planning" })
      .select()
      .single();
    if (error || !data) return alert("作成に失敗しました: " + error?.message);
    router.push(`/events/${data.id}`);
  }

  async function handleCreateIdea() {
    if (!ideaTitle.trim()) return alert("タイトルを入力してください");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .insert({
        user_id: OWNER_ID,
        title: ideaTitle,
        status: "planning",
        purpose: ideaPurposes[0] ?? "satisfaction",
        grade_targets: ideaGrades,
        audience_type: ideaAudiences[0] ?? "internal",
        goal: ideaMemo,
      })
      .select()
      .single();
    if (error || !data) return alert("作成に失敗しました: " + error?.message);
    router.push(`/events/${data.id}`);
  }

  function togglePurpose(p: EventPurpose) {
    setIdeaPurposes(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }
  function toggleGrade(g: GradeTarget) {
    setIdeaGrades(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  }
  function toggleAudience(a: AudienceType) {
    setIdeaAudiences(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  }

  // ---- Choose mode ----
  if (mode === "choose") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
        <h1 className="text-2xl font-semibold text-stone-900 mb-2">新規イベント</h1>
        <p className="text-sm text-stone-500 mb-8">作成方法を選んでください</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Card hoverable onClick={() => setMode("ai_propose")} className="p-5 cursor-pointer">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">AIイベント提案</h3>
                <p className="text-xs text-stone-500">目的・ターゲットを入力するとAIが10件提案</p>
              </div>
            </div>
          </Card>

          <Card hoverable onClick={() => setMode("polish")} className="p-5 cursor-pointer">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">過去イベントの改善</h3>
                <p className="text-xs text-stone-500">過去のイベントをAIがブラッシュアップ</p>
              </div>
            </div>
          </Card>

          <Card hoverable onClick={() => setMode("idea")} className="p-5 cursor-pointer">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">アイデアをメモ</h3>
                <p className="text-xs text-stone-500">まだやっていないやりたいイベントを記録</p>
              </div>
            </div>
          </Card>

          <Card hoverable onClick={handleCreateBlank} className="p-5 cursor-pointer">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-stone-600" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">ゼロから作成</h3>
                <p className="text-xs text-stone-500">白紙から手動でイベントを設計</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ---- AI Propose ----
  if (mode === "ai_propose") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
        <button onClick={() => setMode("choose")} className="text-sm text-stone-500 hover:text-stone-700 mb-6">← 戻る</button>
        <h1 className="text-xl font-semibold text-stone-900 mb-6">AIイベント提案</h1>
        <div className="flex flex-col gap-5">
          <Select label="目的" options={purposeOptions} value={purpose} onChange={(e) => setPurpose(e.target.value as EventPurpose)} />
          <Select label="メインターゲット（学年）" options={gradeOptions} value={grade} onChange={(e) => setGrade(e.target.value as GradeTarget)} />
          <Select label="ターゲット属性" options={audienceOptions} value={audience} onChange={(e) => setAudience(e.target.value as AudienceType)} />
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

  // ---- AI Propose Result ----
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
                  採用 <ArrowRight className="w-3.5 h-3.5" />
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

  // ---- Polish (past event improvement) ----
  if (mode === "polish") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
        <button onClick={() => setMode("choose")} className="text-sm text-stone-500 hover:text-stone-700 mb-6">← 戻る</button>
        <h1 className="text-xl font-semibold text-stone-900 mb-6">過去イベントの改善</h1>

        {!polishResult ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-stone-700">改善したい過去のイベント</label>
              {pastEvents.length === 0 ? (
                <p className="text-sm text-stone-400 bg-stone-50 rounded-lg p-3">
                  まだイベントがありません。過去のイベントを作成・実施後に使えます。
                </p>
              ) : (
                <div className="relative">
                  <select
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    value={selectedPastId}
                    onChange={(e) => setSelectedPastId(e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {pastEvents.map(e => (
                      <option key={e.id} value={e.id}>{e.title || "タイトル未設定"}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              )}
            </div>

            <Textarea
              label="どう改善したいか・追加のメモ"
              value={polishNote}
              onChange={(e) => setPolishNote(e.target.value)}
              placeholder="例：集客をもっと増やしたい、準備をもう少し楽にしたい、子どもの反応がイマイチだったので内容を変えたい"
              className="min-h-[100px]"
            />

            <Button variant="primary" loading={loading} onClick={handlePolish} className="w-full"
              disabled={pastEvents.length > 0 && !selectedPastId && !polishNote}>
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
              <Button variant="secondary" onClick={() => setPolishResult("")}>やり直す</Button>
              <Button variant="primary" onClick={handleCreateFromPolish}>
                この内容でイベントを作成
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Idea Memo ----
  if (mode === "idea") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
        <button onClick={() => setMode("choose")} className="text-sm text-stone-500 hover:text-stone-700 mb-6">← 戻る</button>
        <h1 className="text-xl font-semibold text-stone-900 mb-2">アイデアをメモ</h1>
        <p className="text-sm text-stone-500 mb-6">まだやっていないけどやりたいイベントを記録しておきましょう</p>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-700">イベント名・タイトル</label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              value={ideaTitle}
              onChange={(e) => setIdeaTitle(e.target.value)}
              placeholder="例：うちわデコイベント、夏休み自由研究サポート"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 block mb-2">目的（複数選択可）</label>
            <div className="flex flex-wrap gap-2">
              {purposeOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => togglePurpose(value as EventPurpose)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    ideaPurposes.includes(value as EventPurpose)
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 block mb-2">対象学年（複数選択可）</label>
            <div className="flex flex-wrap gap-2">
              {gradeOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleGrade(value as GradeTarget)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    ideaGrades.includes(value as GradeTarget)
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 block mb-2">ターゲット属性（複数選択可）</label>
            <div className="flex flex-wrap gap-2">
              {audienceOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleAudience(value as AudienceType)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    ideaAudiences.includes(value as AudienceType)
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="メモ・アイデア詳細"
            value={ideaMemo}
            onChange={(e) => setIdeaMemo(e.target.value)}
            placeholder="思いついたことを自由にメモしてください"
            className="min-h-[100px]"
          />

          <Button variant="primary" onClick={handleCreateIdea} disabled={!ideaTitle.trim()} className="w-full">
            メモとして保存
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
