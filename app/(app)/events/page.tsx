import { createClient } from "@/lib/supabase/server";
import { Event } from "@/lib/types";
import { OWNER_ID } from "@/lib/user";
import { STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { EventListClient } from "./event-list-client";

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
        <EventListClient initialEvents={allEvents} />
      )}
    </div>
  );
}
