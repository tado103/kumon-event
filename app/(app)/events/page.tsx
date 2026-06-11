import { createClient } from "@/lib/supabase/server";
import { Event } from "@/lib/types";
import { OWNER_ID } from "@/lib/user";
import { STATUS_LABELS, STATUS_COLORS, PURPOSE_LABELS, GRADE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Plus, CalendarDays } from "lucide-react";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; purpose?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from("events")
    .select("*")
    .eq("user_id", OWNER_ID)
    .order("created_at", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.purpose) query = query.eq("purpose", params.purpose);

  const { data: events } = await query;
  const allEvents = (events ?? []) as Event[];

  const statuses = ["planning", "preparing", "ready", "done"] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">イベント</h1>
        <Link
          href="/events/new"
          className="flex items-center gap-2 bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新規作成
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <Link
          href="/events"
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !params.status
              ? "bg-stone-900 text-white"
              : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
          }`}
        >
          すべて
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/events?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              params.status === s
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {allEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <CalendarDays className="w-10 h-10 text-stone-300 mx-auto mb-4" />
          <h3 className="font-semibold text-stone-700 mb-2">イベントがありません</h3>
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 bg-teal-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-teal-800 transition-colors mt-2"
          >
            <Plus className="w-4 h-4" />
            作成する
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {allEvents.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card hoverable className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium text-stone-900 text-sm">
                        {event.title || "タイトル未設定"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-stone-500">{PURPOSE_LABELS[event.purpose]}</span>
                      {event.grade_targets?.length > 0 && (
                        <span className="text-xs text-stone-400">
                          {(event.grade_targets as string[]).map((g) => GRADE_LABELS[g as keyof typeof GRADE_LABELS]).join("・")}
                        </span>
                      )}
                      {event.event_date && (
                        <span className="text-xs text-stone-400 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {format(new Date(event.event_date), "M月d日", { locale: ja })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={`${STATUS_COLORS[event.status]} text-[11px] shrink-0`}>
                    {STATUS_LABELS[event.status]}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
