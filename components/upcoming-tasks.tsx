"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PrepTask } from "@/lib/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CheckSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TaskItem {
  task: PrepTask;
  eventId: string;
  eventTitle: string;
  daysLeft: number;
  isWorkDate: boolean;
  allTasks: PrepTask[];
}

export function UpcomingTasks({ items }: { items: TaskItem[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  async function toggle(item: TaskItem) {
    const taskId = item.task.id;
    const nowDone = !checked.has(taskId);
    setChecked((prev) => {
      const next = new Set(prev);
      nowDone ? next.add(taskId) : next.delete(taskId);
      return next;
    });

    const supabase = createClient();
    const updatedTasks = item.allTasks.map((t) =>
      t.id === taskId ? { ...t, completed: nowDone } : t
    );
    await supabase
      .from("events")
      .update({ prep_tasks: updatedTasks })
      .eq("id", item.eventId);
  }

  const visible = items.filter((i) => !checked.has(i.task.id));

  if (visible.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
      {visible.map((item) => {
        const { task, eventId, eventTitle, daysLeft, isWorkDate } = item;
        const refDate = isWorkDate ? task.work_start! : task.deadline;
        const endDate = isWorkDate && task.work_end ? task.work_end : null;
        return (
          <div key={task.id} className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => toggle(item)} className="shrink-0">
              <CheckSquare className={cn("w-4 h-4", checked.has(task.id) ? "text-teal-600" : "text-stone-300")} />
            </button>
            <Link href={`/events/${eventId}?tab=prep`} className="flex-1 min-w-0">
              <p className="text-sm text-stone-800 line-clamp-1">{task.title}</p>
              <p className="text-xs text-stone-400 line-clamp-1">{eventTitle}</p>
            </Link>
            <div className="shrink-0 text-right">
              <p className={cn(
                "text-xs font-medium",
                daysLeft < 0 ? "text-red-500" : daysLeft <= 3 ? "text-orange-500" : "text-stone-400"
              )}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}日超過` : daysLeft === 0 ? "今日" : `あと${daysLeft}日`}
              </p>
              <p className="text-[10px] text-stone-400">
                {isWorkDate ? "実行日 " : "締切 "}
                {format(new Date(refDate), "M/d", { locale: ja })}
                {endDate ? `〜${format(new Date(endDate), "M/d", { locale: ja })}` : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
