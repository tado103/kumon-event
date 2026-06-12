"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Event, TimelineItem, PrepTask, EventRating } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { createClient } from "@/lib/supabase/client";
import {
  PURPOSE_LABELS,
  GRADE_LABELS,
  AUDIENCE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/constants";
import { EventPurpose, GradeTarget, AudienceType, EventStatus } from "@/lib/types";
import {
  Save, Trash2, Plus, Sparkles, ChevronDown, ChevronUp,
  GripVertical, X, CheckSquare, ClipboardList, BarChart3, Brain
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

type TabId = "overview" | "design" | "timeline" | "prep" | "review" | "analysis";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "design", label: "ゴール設計" },
  { id: "timeline", label: "当日の流れ" },
  { id: "prep", label: "準備" },
  { id: "review", label: "振り返り" },
  { id: "analysis", label: "AI分析" },
];

const purposeOptions = Object.entries(PURPOSE_LABELS).map(([v, l]) => ({ value: v, label: l }));
const gradeOptions = Object.entries(GRADE_LABELS).map(([v, l]) => ({ value: v, label: l }));
const audienceOptions = Object.entries(AUDIENCE_LABELS).map(([v, l]) => ({ value: v, label: l }));
const statusOptions = Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));

export function EventEditor({ event: initial }: { event: Event }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event>(initial);
  const [tab, setTab] = useState<TabId>("overview");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);

  const update = useCallback(<K extends keyof Event>(key: K, value: Event[K]) => {
    setEvent((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({
        title: event.title,
        status: event.status,
        purpose: event.purpose,
        grade_targets: event.grade_targets,
        audience_type: event.audience_type,
        event_date: event.event_date,
        event_end_date: event.event_end_date,
        location: event.location,
        capacity: event.capacity,
        required_tools: event.required_tools,
        goal: event.goal,
        before_state: event.before_state,
        after_state: event.after_state,
        ideal_feedback: event.ideal_feedback,
        behavior_change: event.behavior_change,
        timeline: event.timeline,
        prep_tasks: event.prep_tasks,
        applicants: event.applicants,
        participants: event.participants,
        friend_participants: event.friend_participants,
        trial_count: event.trial_count,
        enrollment_count: event.enrollment_count,
        good_points: event.good_points,
        improvement_points: event.improvement_points,
        child_reactions: event.child_reactions,
        parent_reactions: event.parent_reactions,
        survey_data: event.survey_data,
        ai_analysis: event.ai_analysis,
        rating: event.rating,
        ai_review: event.ai_review,
      })
      .eq("id", event.id);
    if (!error) setSavedAt(new Date());
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("このイベントを削除しますか？")) return;
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", event.id);
    router.push("/events");
  }

  async function runAIReview() {
    setAiLoading(true);
    setAiReviewOpen(true);
    const res = await fetch("/api/ai/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
    });
    const data = await res.json();
    update("ai_review", data.review ?? "");
    setAiLoading(false);
    await save();
  }

  async function runAIAnalysis() {
    setAiLoading(true);
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
    });
    const data = await res.json();
    update("ai_analysis", data.analysis ?? "");
    setAiLoading(false);
    setTab("analysis");
  }

  async function generateGoalDesign() {
    setAiLoading(true);
    const res = await fetch("/api/ai/goal-design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
    });
    const data = await res.json();
    if (data.before_state) update("before_state", data.before_state);
    if (data.after_state) update("after_state", data.after_state);
    if (data.ideal_feedback) update("ideal_feedback", data.ideal_feedback);
    if (data.behavior_change) update("behavior_change", data.behavior_change);
    setAiLoading(false);
  }

  async function generatePrepTasks() {
    setAiLoading(true);
    const res = await fetch("/api/ai/prep-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, hint: prepHint }),
    });
    const data = await res.json();
    if (data.tasks) update("prep_tasks", data.tasks);
    setAiLoading(false);
  }

  function addTimelineItem() {
    const newItem: TimelineItem = {
      id: crypto.randomUUID(),
      start_time: "",
      end_time: "",
      content: "",
      detail: "",
      todos: [],
      tools: [],
      concerns: "",
      assignee: "",
    };
    update("timeline", [...(event.timeline ?? []), newItem]);
  }

  function updateTimelineItem(id: string, field: keyof TimelineItem, value: unknown) {
    const newTimeline = (event.timeline ?? []).map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    update("timeline", newTimeline);
    if (field === "tools") {
      const allTools = Array.from(new Set(
        newTimeline.flatMap((item) => item.tools ?? []).filter(Boolean)
      ));
      const existing = event.required_tools ?? [];
      const merged = Array.from(new Set([...existing, ...allTools]));
      update("required_tools", merged);
    }
  }

  function removeTimelineItem(id: string) {
    update("timeline", (event.timeline ?? []).filter((item) => item.id !== id));
  }

  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const [prepHint, setPrepHint] = useState("");

  function addPrepTask() {
    const id = crypto.randomUUID();
    const task: PrepTask = {
      id,
      title: "",
      deadline: "",
      assignee: "",
      completed: false,
      category: "",
    };
    update("prep_tasks", [...(event.prep_tasks ?? []), task]);
    setNewTaskId(id);
  }

  function updatePrepTask(id: string, field: keyof PrepTask, value: unknown) {
    update(
      "prep_tasks",
      (event.prep_tasks ?? []).map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      )
    );
  }

  function removePrepTask(id: string) {
    update("prep_tasks", (event.prep_tasks ?? []).filter((t) => t.id !== id));
  }

  function updateRating(key: keyof EventRating, value: number) {
    update("rating", { ...(event.rating ?? { attraction: 0, satisfaction: 0, enrollment_effect: 0, prep_load: 0, cost_performance: 0 }), [key]: value });
  }

  const gradeSet = new Set(event.grade_targets ?? []);
  function toggleGrade(g: GradeTarget) {
    if (gradeSet.has(g)) {
      gradeSet.delete(g);
    } else {
      gradeSet.add(g);
    }
    update("grade_targets", Array.from(gradeSet) as GradeTarget[]);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <input
            className="w-full text-2xl font-semibold text-stone-900 bg-transparent border-none outline-none placeholder:text-stone-300 leading-tight"
            value={event.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="イベントタイトル"
          />
          <div className="flex items-center gap-2 mt-2">
            <Badge className={`${STATUS_COLORS[event.status]} text-xs`}>
              {STATUS_LABELS[event.status]}
            </Badge>
            {savedAt && (
              <span className="text-xs text-stone-400">
                {format(savedAt, "HH:mm")} 保存済み
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="secondary" onClick={save} loading={saving}>
            <Save className="w-3.5 h-3.5" />
            保存
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5 text-stone-400" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 border-b border-stone-200">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
              tab === id
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-stone-500 hover:text-stone-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="ステータス"
              options={statusOptions}
              value={event.status}
              onChange={(e) => update("status", e.target.value as EventStatus)}
            />
            <Select
              label="目的"
              options={purposeOptions}
              value={event.purpose}
              onChange={(e) => update("purpose", e.target.value as EventPurpose)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 block mb-2">対象学年（複数可）</label>
            <div className="flex flex-wrap gap-2">
              {gradeOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleGrade(value as GradeTarget)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    gradeSet.has(value as GradeTarget)
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Select
            label="ターゲット属性"
            options={audienceOptions}
            value={event.audience_type}
            onChange={(e) => update("audience_type", e.target.value as AudienceType)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="開始日時"
              type="datetime-local"
              value={event.event_date ? event.event_date.slice(0, 16) : ""}
              onChange={(e) => update("event_date", e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
            <Input
              label="終了日時"
              type="datetime-local"
              value={event.event_end_date ? event.event_end_date.slice(0, 16) : ""}
              onChange={(e) => update("event_end_date", e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="場所"
              value={event.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="例：教室内"
            />
            <Input
              label="定員"
              type="number"
              value={event.capacity ?? ""}
              onChange={(e) => update("capacity", e.target.value ? parseInt(e.target.value) : null)}
              placeholder="30"
            />
          </div>

          <Textarea
            label="ゴール（一言）"
            value={event.goal}
            onChange={(e) => update("goal", e.target.value)}
            placeholder="このイベントで実現したいことを一言で"
            className="min-h-[70px]"
          />

          <div>
            <label className="text-sm font-medium text-stone-700 block mb-2">必要ツール・備品</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(event.required_tools ?? []).map((tool, i) => (
                <span key={i} className="flex items-center gap-1 bg-stone-100 text-stone-700 text-xs px-2 py-1 rounded-full">
                  {tool}
                  <button onClick={() => update("required_tools", (event.required_tools ?? []).filter((_, j) => j !== i))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              placeholder="ツールを入力してEnter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    update("required_tools", [...(event.required_tools ?? []), val]);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Tab: Design */}
      {tab === "design" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">参加前後の変化を設計します</p>
            <Button size="sm" variant="secondary" onClick={generateGoalDesign} loading={aiLoading}>
              <Sparkles className="w-3.5 h-3.5" />
              AIで草案を生成
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1.5">
                <span className="text-base">Before</span>
              </h3>
              <p className="text-xs text-red-600 mb-2">参加前の状態・課題</p>
              <Textarea
                value={event.before_state}
                onChange={(e) => update("before_state", e.target.value)}
                placeholder="参加前の生徒・保護者の状態"
                className="bg-white/80 min-h-[100px]"
              />
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-teal-700 mb-1">
                <span className="text-base">After</span>
              </h3>
              <p className="text-xs text-teal-600 mb-2">参加後の理想の状態</p>
              <Textarea
                value={event.after_state}
                onChange={(e) => update("after_state", e.target.value)}
                placeholder="参加後に実現したい変化"
                className="bg-white/80 min-h-[100px]"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-1">理想の感想</h3>
            <p className="text-xs text-amber-600 mb-2">終了後にこんな声が出たら成功</p>
            <Textarea
              value={event.ideal_feedback}
              onChange={(e) => update("ideal_feedback", e.target.value)}
              placeholder='例：「子どもが明日もやりたいって言ってました！」'
              className="bg-white/80 min-h-[80px]"
            />
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-purple-700 mb-1">行動変容</h3>
            <p className="text-xs text-purple-600 mb-2">終了後にこんな行動が起これば成功</p>
            <Textarea
              value={event.behavior_change}
              onChange={(e) => update("behavior_change", e.target.value)}
              placeholder='例：「体験申込みが来る」「兄弟の入会相談が来る」'
              className="bg-white/80 min-h-[80px]"
            />
          </div>

          {/* AI Review button */}
          <div className="border-t border-stone-200 pt-4">
            <Button variant="secondary" onClick={runAIReview} loading={aiLoading} className="w-full sm:w-auto">
              <Brain className="w-4 h-4" />
              AIでイベント設計をレビュー
            </Button>
          </div>

          {aiReviewOpen && event.ai_review && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                AIレビュー
              </h3>
              <div className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                {event.ai_review}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Timeline */}
      {tab === "timeline" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-stone-500">タイムラインを追加して当日の流れを設計しましょう</p>

          {(event.timeline ?? []).map((item, idx) => (
            <div key={item.id} className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <GripVertical className="w-4 h-4 text-stone-300 shrink-0" />
                <span className="text-xs font-semibold text-stone-400 w-5">{idx + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    className="text-sm px-2 py-1 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    value={item.start_time}
                    onChange={(e) => updateTimelineItem(item.id, "start_time", e.target.value)}
                  />
                  <input
                    type="time"
                    className="text-sm px-2 py-1 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    value={item.end_time}
                    onChange={(e) => updateTimelineItem(item.id, "end_time", e.target.value)}
                  />
                </div>
                <button onClick={() => removeTimelineItem(item.id)}>
                  <X className="w-4 h-4 text-stone-300 hover:text-stone-500" />
                </button>
              </div>

              <div className="ml-7 flex flex-col gap-2">
                <input
                  className="w-full text-sm font-medium px-2 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-teal-400"
                  placeholder="内容"
                  value={item.content}
                  onChange={(e) => updateTimelineItem(item.id, "content", e.target.value)}
                />
                <textarea
                  className="w-full text-sm px-2 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                  placeholder="詳細・メモ"
                  rows={2}
                  value={item.detail}
                  onChange={(e) => updateTimelineItem(item.id, "detail", e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    className="text-sm px-2 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    placeholder="必要ツール"
                    value={item.tools?.join(", ") ?? ""}
                    onChange={(e) => updateTimelineItem(item.id, "tools", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  />
                  <input
                    className="text-sm px-2 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    placeholder="懸念事項"
                    value={item.concerns}
                    onChange={(e) => updateTimelineItem(item.id, "concerns", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button variant="secondary" onClick={addTimelineItem}>
            <Plus className="w-4 h-4" />
            項目を追加
          </Button>
        </div>
      )}

      {/* Tab: Prep */}
      {tab === "prep" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const tasks = event.prep_tasks ?? [];
                const done = tasks.filter((t) => t.completed).length;
                const total = tasks.length;
                if (total === 0) return <p className="text-sm text-stone-500">準備タスクを管理します</p>;
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-700">{done} / {total} 完了</span>
                    <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
            <Button size="sm" variant="secondary" onClick={generatePrepTasks} loading={aiLoading}>
              <Sparkles className="w-3.5 h-3.5" />
              AIで生成
            </Button>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
            <p className="text-xs text-stone-500 mb-1.5">やりたいこと・締切（任意）</p>
            <textarea
              className="w-full text-sm bg-white border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
              rows={2}
              placeholder="例：7/15にポスティングを開始したい　例：8/1までにチラシを完成させたい"
              value={prepHint}
              onChange={(e) => setPrepHint(e.target.value)}
            />
            <p className="text-[11px] text-stone-400 mt-1">入力するとAIが逆算してタスクを生成します</p>
          </div>

          {[...(event.prep_tasks ?? [])].sort((a, b) => {
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return a.deadline.localeCompare(b.deadline);
          }).map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                task.completed ? "bg-stone-50 border-stone-100" : "bg-white border-stone-200"
              )}
            >
              <button
                onClick={() => updatePrepTask(task.id, "completed", !task.completed)}
                className="mt-0.5 shrink-0"
              >
                <CheckSquare
                  className={cn(
                    "w-4 h-4",
                    task.completed ? "text-teal-600" : "text-stone-300"
                  )}
                />
              </button>
              <div className="flex-1 min-w-0">
                <input
                  autoFocus={task.id === newTaskId}
                  className={cn(
                    "w-full text-sm font-medium bg-transparent border-none outline-none",
                    task.completed && "line-through text-stone-400"
                  )}
                  value={task.title}
                  onChange={(e) => updatePrepTask(task.id, "title", e.target.value)}
                  onFocus={() => { if (task.id === newTaskId) setNewTaskId(null); }}
                  placeholder="タスク名"
                />
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    className="text-xs text-stone-500 bg-transparent border-none outline-none"
                    value={task.deadline}
                    onChange={(e) => updatePrepTask(task.id, "deadline", e.target.value)}
                  />
                </div>
              </div>
              <button onClick={() => removePrepTask(task.id)}>
                <X className="w-3.5 h-3.5 text-stone-300 hover:text-stone-500" />
              </button>
            </div>
          ))}

          <Button variant="secondary" onClick={addPrepTask}>
            <Plus className="w-4 h-4" />
            タスクを追加
          </Button>
        </div>
      )}

      {/* Tab: Review */}
      {tab === "review" && (
        <div className="flex flex-col gap-6">
          {/* Results */}
          <section>
            <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-stone-400" />
              実績
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: "applicants", label: "申込人数" },
                { key: "participants", label: "参加人数" },
                { key: "friend_participants", label: "友達参加" },
                { key: "trial_count", label: "体験人数" },
                { key: "enrollment_count", label: "入会人数" },
              ].map(({ key, label }) => (
                <div key={key} className="bg-white border border-stone-200 rounded-xl p-3">
                  <p className="text-xs text-stone-500 mb-1">{label}</p>
                  <input
                    type="number"
                    className="w-full text-xl font-semibold text-stone-900 bg-transparent border-none outline-none"
                    value={(event[key as keyof Event] as number | null) ?? ""}
                    onChange={(e) => update(key as keyof Event, e.target.value ? parseInt(e.target.value) : null as never)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Qualitative */}
          <section>
            <h3 className="text-sm font-semibold text-stone-700 mb-3">定性振り返り</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea
                label="良かった点"
                value={event.good_points}
                onChange={(e) => update("good_points", e.target.value)}
                className="min-h-[100px]"
              />
              <Textarea
                label="改善点"
                value={event.improvement_points}
                onChange={(e) => update("improvement_points", e.target.value)}
                className="min-h-[100px]"
              />
              <Textarea
                label="子どもの反応"
                value={event.child_reactions}
                onChange={(e) => update("child_reactions", e.target.value)}
                className="min-h-[80px]"
              />
              <Textarea
                label="保護者の反応"
                value={event.parent_reactions}
                onChange={(e) => update("parent_reactions", e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </section>

          {/* Survey */}
          <section>
            <Textarea
              label="アンケート内容"
              value={event.survey_data}
              onChange={(e) => update("survey_data", e.target.value)}
              hint="アンケート結果や自由記述を記録"
              className="min-h-[100px]"
            />
          </section>

          {/* Rating */}
          <section>
            <h3 className="text-sm font-semibold text-stone-700 mb-3">イベント評価</h3>
            <div className="bg-white border border-stone-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "attraction" as const, label: "集客効果" },
                { key: "satisfaction" as const, label: "満足度" },
                { key: "enrollment_effect" as const, label: "入会効果" },
                { key: "prep_load" as const, label: "準備負荷（低いほど◎）" },
                { key: "cost_performance" as const, label: "費用対効果" },
              ].map(({ key, label }) => (
                <StarRating
                  key={key}
                  label={label}
                  value={event.rating?.[key] ?? 0}
                  onChange={(v) => updateRating(key, v)}
                />
              ))}
            </div>
          </section>

          <div className="border-t border-stone-200 pt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={save} loading={saving}>
              <Save className="w-4 h-4" />
              保存
            </Button>
            <Button variant="primary" onClick={runAIAnalysis} loading={aiLoading}>
              <Brain className="w-4 h-4" />
              AI分析を実行
            </Button>
          </div>
        </div>
      )}

      {/* Tab: Analysis */}
      {tab === "analysis" && (
        <div className="flex flex-col gap-5">
          {event.ai_analysis ? (
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-stone-800">AI分析レポート</h3>
              </div>
              <div className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                {event.ai_analysis}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500 mb-4">振り返りを入力後、AI分析を実行してください</p>
              <Button variant="secondary" onClick={() => setTab("review")}>
                振り返りタブへ
              </Button>
            </div>
          )}

          {event.ai_analysis && (
            <Button variant="secondary" onClick={runAIAnalysis} loading={aiLoading}>
              <Sparkles className="w-4 h-4" />
              再分析
            </Button>
          )}
        </div>
      )}

      {/* Bottom save */}
      <div className="mt-8 pt-4 border-t border-stone-100 flex justify-end">
        <Button variant="primary" onClick={save} loading={saving}>
          <Save className="w-4 h-4" />
          保存する
        </Button>
      </div>
    </div>
  );
}
