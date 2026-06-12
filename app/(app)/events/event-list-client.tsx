"use client";
import { useState, useRef } from "react";
import { Event, EventStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS, PURPOSE_LABELS, GRADE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NEXT_STATUS: Record<EventStatus, EventStatus> = {
  planning: "preparing",
  preparing: "ready",
  ready: "done",
  done: "done",
};

const STATUS_NEXT_LABEL: Record<EventStatus, string> = {
  planning: "準備中へ",
  preparing: "実施待ちへ",
  ready: "実施済みへ",
  done: "完了済み",
};

function SwipeableEvent({ event, onDelete, onStatusChange }: {
  event: Event;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: EventStatus) => void;
}) {
  const touchStartX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiped, setSwiped] = useState(false);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchMove(e: React.TouchEvent) {
    const diff = e.touches[0].clientX - touchStartX.current;
    if (diff < 0) {
      setOffset(Math.max(diff, -140));
    } else if (swiped) {
      setOffset(Math.min(diff - 140, 0));
    }
  }

  function onTouchEnd() {
    if (offset < -70) {
      setOffset(-140);
      setSwiped(true);
    } else {
      setOffset(0);
      setSwiped(false);
    }
  }

  function close() {
    setOffset(0);
    setSwiped(false);
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Action buttons behind */}
      <div className="absolute right-0 top-0 bottom-0 flex">
        {event.status !== "done" && (
          <button
            onClick={() => { onStatusChange(event.id, NEXT_STATUS[event.status]); close(); }}
            className="w-[70px] bg-teal-600 text-white text-xs font-medium flex flex-col items-center justify-center gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            {STATUS_NEXT_LABEL[event.status]}
          </button>
        )}
        <button
          onClick={() => { if (confirm("削除しますか？")) onDelete(event.id); }}
          className="w-[70px] bg-red-500 text-white text-xs font-medium flex flex-col items-center justify-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          削除
        </button>
      </div>

      {/* Card */}
      <div
        style={{ transform: `translateX(${offset}px)`, transition: offset === 0 || offset === -140 ? "transform 0.2s ease" : "none" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Link href={`/events/${event.id}`} onClick={swiped ? (e) => { e.preventDefault(); close(); } : undefined}>
          <div className="bg-white border border-stone-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-stone-900 text-sm mb-1">
                  {event.title || "タイトル未設定"}
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-stone-500">{PURPOSE_LABELS[event.purpose]}</span>
                  {(event.grade_targets as string[])?.length > 0 && (
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
          </div>
        </Link>
      </div>
    </div>
  );
}

export function EventListClient({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState(initialEvents);
  const router = useRouter();

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleStatusChange(id: string, status: EventStatus) {
    const supabase = createClient();
    await supabase.from("events").update({ status }).eq("id", id);
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
        <CalendarDays className="w-10 h-10 text-stone-300 mx-auto mb-4" />
        <h3 className="font-semibold text-stone-700 mb-2">イベントがありません</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-stone-400 text-right">← 左にスワイプで操作</p>
      <div className="flex flex-col gap-0.5 rounded-xl overflow-hidden border border-stone-200">
        {events.map((event) => (
          <SwipeableEvent
            key={event.id}
            event={event}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
