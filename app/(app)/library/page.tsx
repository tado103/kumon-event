import { createClient } from "@/lib/supabase/server";
import { Event } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABELS, PURPOSE_LABELS, GRADE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Library, Star, TrendingUp } from "lucide-react";
import { OWNER_ID } from "@/lib/user";
import { cn } from "@/lib/utils";

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 w-4 rounded-full",
            i < value ? "bg-amber-400" : "bg-stone-200"
          )}
        />
      ))}
    </div>
  );
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ purpose?: string; grade?: string; sort?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", OWNER_ID)
    .eq("status", "done")
    .order("event_date", { ascending: false });

  let allEvents = (events ?? []) as Event[];

  if (params.purpose) allEvents = allEvents.filter(e => e.purpose === params.purpose);
  if (params.grade) allEvents = allEvents.filter(e => (e.grade_targets as string[]).includes(params.grade!));

  // Sort
  if (params.sort === "score") {
    allEvents.sort((a, b) => {
      const scoreA = a.rating ? Object.values(a.rating).reduce((s, v) => s + v, 0) : 0;
      const scoreB = b.rating ? Object.values(b.rating).reduce((s, v) => s + v, 0) : 0;
      return scoreB - scoreA;
    });
  }

  const purposeOptions = Object.entries(PURPOSE_LABELS);
  const gradeOptions = Object.entries(GRADE_LABELS);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8">
      <div className="flex items-center gap-2 mb-6">
        <Library className="w-5 h-5 text-stone-400" />
        <h1 className="text-2xl font-semibold text-stone-900">ライブラリ</h1>
      </div>
      <p className="text-sm text-stone-500 mb-8">実施済みのイベントを資産として蓄積。成功パターンを学習します。</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/library"
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            !params.purpose && !params.sort
              ? "bg-stone-900 text-white border-stone-900"
              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
          )}
        >
          すべて
        </Link>
        <Link
          href="/library?sort=score"
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1",
            params.sort === "score"
              ? "bg-amber-100 text-amber-800 border-amber-200"
              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
          )}
        >
          <TrendingUp className="w-3 h-3" />
          高評価順
        </Link>
        {purposeOptions.map(([v, l]) => (
          <Link
            key={v}
            href={`/library?purpose=${v}`}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              params.purpose === v
                ? "bg-teal-100 text-teal-800 border-teal-200"
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
            )}
          >
            {l}
          </Link>
        ))}
      </div>

      {allEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <Library className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="font-semibold text-stone-700 mb-2">まだ実施済みイベントがありません</h3>
          <p className="text-sm text-stone-500">イベントを実施・振り返り後にここに蓄積されます</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {allEvents.map((event) => {
            const totalScore = event.rating
              ? Object.values(event.rating).reduce((s, v) => s + v, 0)
              : 0;
            const avgScore = event.rating ? totalScore / 5 : 0;

            return (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="bg-white border border-stone-200 rounded-xl p-4 hover:shadow-md hover:border-stone-300 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-stone-900">{event.title || "タイトル未設定"}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-stone-500">{PURPOSE_LABELS[event.purpose]}</span>
                        {event.event_date && (
                          <span className="text-xs text-stone-400">
                            {format(new Date(event.event_date), "yyyy年M月", { locale: ja })}
                          </span>
                        )}
                        {(event.grade_targets as string[])?.map((g) => (
                          <span key={g} className="text-xs text-stone-400">
                            {GRADE_LABELS[g as keyof typeof GRADE_LABELS]}
                          </span>
                        ))}
                      </div>
                    </div>
                    {avgScore > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold text-amber-700">
                          {avgScore.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {event.rating && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-stone-100">
                      {[
                        { key: "attraction", label: "集客" },
                        { key: "satisfaction", label: "満足度" },
                        { key: "enrollment_effect", label: "入会" },
                        { key: "prep_load", label: "準備負荷" },
                        { key: "cost_performance", label: "コスパ" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <p className="text-[10px] text-stone-400 mb-1">{label}</p>
                          <ScoreBar value={event.rating![key as keyof typeof event.rating]} />
                        </div>
                      ))}
                    </div>
                  )}

                  {event.good_points && (
                    <p className="text-xs text-stone-500 mt-2 line-clamp-2">
                      ✓ {event.good_points}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
