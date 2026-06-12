"use client";
import { useState } from "react";
import { Event, PrepTask } from "@/lib/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CalendarEvent {
  date: Date;
  title: string;
  eventTitle: string;
  type: "event" | "task";
  label: string;
  eventId: string;
  color: string;
}

interface Props {
  events: Event[];
}

export function DashboardCalendar({ events }: Props) {
  const [current, setCurrent] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Gather all calendar items
  const items: CalendarEvent[] = [];

  events.forEach((event) => {
    if (event.event_date) {
      items.push({
        date: new Date(event.event_date),
        title: event.title || "タイトル未設定",
        eventTitle: event.title || "タイトル未設定",
        type: "event",
        label: "本番",
        eventId: event.id,
        color: "bg-teal-500",
      });
    }
    (event.prep_tasks ?? []).forEach((task: PrepTask) => {
      if (task.completed) return;
      if (task.work_start) {
        // 実行期間の各日にドットを表示
        const start = new Date(task.work_start);
        const end = task.work_end ? new Date(task.work_end) : start;
        eachDayOfInterval({ start, end }).forEach((day) => {
          items.push({
            date: day,
            title: task.title,
            eventTitle: event.title || "タイトル未設定",
            type: "task",
            label: "実行日",
            eventId: event.id,
            color: "bg-blue-400",
          });
        });
      } else if (task.deadline) {
        items.push({
          date: new Date(task.deadline),
          title: task.title,
          eventTitle: event.title || "タイトル未設定",
          type: "task",
          label: "締切",
          eventId: event.id,
          color: "bg-amber-400",
        });
      }
    });
  });

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start
  const startDay = monthStart.getDay();
  const paddedDays: (Date | null)[] = [...Array(startDay).fill(null), ...days];

  function getItemsForDay(date: Date) {
    return items.filter((item) => isSameDay(item.date, date));
  }

  const selectedItems = selectedDate ? getItemsForDay(selectedDate) : [];

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <button onClick={() => setCurrent(subMonths(current, 1))} className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-stone-500" />
        </button>
        <h3 className="text-sm font-semibold text-stone-800">
          {format(current, "yyyy年M月", { locale: ja })}
        </h3>
        <button onClick={() => setCurrent(addMonths(current, 1))} className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-stone-500" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-stone-100">
        {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
          <div key={d} className={cn(
            "text-center text-[10px] font-medium py-2",
            i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-stone-400"
          )}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {paddedDays.map((date, idx) => {
          if (!date) return <div key={`pad-${idx}`} className="h-12 border-b border-r border-stone-50" />;

          const dayItems = getItemsForDay(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const today = isToday(date);
          const dayOfWeek = date.getDay();

          return (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(isSelected ? null : date)}
              className={cn(
                "h-12 border-b border-r border-stone-50 flex flex-col items-center pt-1 gap-0.5 transition-colors",
                isSelected ? "bg-teal-50" : "hover:bg-stone-50",
                !isSameMonth(date, current) && "opacity-30"
              )}
            >
              <span className={cn(
                "text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium",
                today ? "bg-teal-600 text-white" : dayOfWeek === 0 ? "text-red-400" : dayOfWeek === 6 ? "text-blue-400" : "text-stone-700"
              )}>
                {format(date, "d")}
              </span>
              <div className="flex gap-0.5 flex-wrap justify-center px-0.5">
                {dayItems.slice(0, 3).map((item, i) => (
                  <div key={i} className={cn("w-1.5 h-1.5 rounded-full", item.color)} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-stone-100">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-[10px] text-stone-500">イベント本番</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[10px] text-stone-500">実行日</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[10px] text-stone-500">締切</span>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && selectedItems.length > 0 && (
        <div className="border-t border-stone-100 px-4 py-3">
          <p className="text-xs font-semibold text-stone-600 mb-2">
            {format(selectedDate, "M月d日(EEE)", { locale: ja })}
          </p>
          <div className="flex flex-col gap-1.5">
            {selectedItems.map((item, i) => (
              <Link key={i} href={`/events/${item.eventId}`}>
                <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-stone-50 transition-colors">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", item.color)} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-stone-700 line-clamp-1">{item.title}</span>
                    {item.type === "task" && (
                      <span className="text-[10px] text-stone-400 block line-clamp-1">{item.eventTitle}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 ml-auto shrink-0">
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedItems.length === 0 && (
        <div className="border-t border-stone-100 px-4 py-3">
          <p className="text-xs text-stone-400">
            {format(selectedDate, "M月d日(EEE)", { locale: ja })} の予定はありません
          </p>
        </div>
      )}
    </div>
  );
}
