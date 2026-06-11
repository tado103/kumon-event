import { createClient } from "@/lib/supabase/server";
import { Event } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS, PURPOSE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays, Clock, CheckCircle2, Plus, TrendingUp } from "lucide-react";

function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`}>
      <Card hoverable className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-stone-900 text-sm leading-tight line-clamp-2">
              {event.title || "タイトル未設定"}
            </h3>
            <Badge className={`${STATUS_COLORS[event.status]} shrink-0 text-[11px]`}>
              {STATUS_LABELS[event.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-stone-500">{PURPOSE_LABELS[event.purpose]}</span>
            {event.event_date && (
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {format(new Date(event.event_date), "M月d日(EEE)", { locale: ja })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-stone-400" />
      <h2 className="text-sm font-semibold text-stone-700">{title}</h2>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const allEvents = (events ?? []) as Event[];

  const upcoming = allEvents.filter(
    (e) => e.status === "ready" && e.event_date && new Date(e.event_date) >= new Date()
  );
  const preparing = allEvents.filter((e) => e.status === "preparing");
  const needsReview = allEvents.filter(
    (e) => e.status === "done" && !e.good_points
  );
  const recentSuccess = allEvents
    .filter((e) => e.status === "done" && e.rating)
    .sort((a, b) => {
      const scoreA = a.rating ? Object.values(a.rating).reduce((s, v) => s + v, 0) : 0;
      const scoreB = b.rating ? Object.values(b.rating).reduce((s, v) => s + v, 0) : 0;
      return scoreB - scoreA;
    })
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">ダッシュボード</h1>
          <p className="text-sm text-stone-500 mt-1">
            {format(new Date(), "yyyy年M月d日 (EEE)", { locale: ja })}
          </p>
        </div>
        <Link
          href="/events/new"
          className="flex items-center gap-2 bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">新規イベント</span>
        </Link>
      </div>

      {/* Stats row */}
      {allEvents.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "総イベント数", value: allEvents.length },
            { label: "実施済み", value: allEvents.filter(e => e.status === "done").length },
            { label: "準備中", value: preparing.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-stone-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-semibold text-stone-900">{value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {allEvents.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <CalendarDays className="w-10 h-10 text-stone-300 mx-auto mb-4" />
          <h3 className="font-semibold text-stone-700 mb-2">まだイベントがありません</h3>
          <p className="text-sm text-stone-500 mb-6">最初のイベントを作成して教室運営を強化しましょう</p>
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 bg-teal-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-teal-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            イベントを作成する
          </Link>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <SectionTitle icon={CalendarDays} title="今後のイベント" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* Preparing */}
      {preparing.length > 0 && (
        <section className="mb-8">
          <SectionTitle icon={Clock} title="準備中のイベント" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {preparing.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* Needs review */}
      {needsReview.length > 0 && (
        <section className="mb-8">
          <SectionTitle icon={CheckCircle2} title="振り返り待ち" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {needsReview.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* Recent success */}
      {recentSuccess.length > 0 && (
        <section className="mb-8">
          <SectionTitle icon={TrendingUp} title="高評価イベント" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentSuccess.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}
    </div>
  );
}
