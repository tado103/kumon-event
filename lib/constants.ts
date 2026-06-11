import { EventPurpose, GradeTarget, AudienceType, EventStatus } from "./types";

export const PURPOSE_LABELS: Record<EventPurpose, string> = {
  referral: "紹介促進",
  trial: "新規体験獲得",
  enrollment: "入会促進",
  satisfaction: "在籍満足度向上",
  motivation: "学習意欲向上",
  kc: "KC利用促進",
  parent_understanding: "保護者理解促進",
  branding: "教室ブランディング",
  other: "その他",
};

export const GRADE_LABELS: Record<GradeTarget, string> = {
  preschool: "未就学児",
  grade1_2: "小1〜2",
  grade3_4: "小3〜4",
  grade5_6: "小5〜6",
  junior_high: "中学生",
};

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  internal: "内部生",
  internal_friends: "内部生＋友達",
  external: "外部生",
  parents: "保護者",
};

export const STATUS_LABELS: Record<EventStatus, string> = {
  planning: "企画中",
  preparing: "準備中",
  ready: "実施待ち",
  done: "実施済み",
};

export const STATUS_COLORS: Record<EventStatus, string> = {
  planning: "bg-amber-50 text-amber-700 border-amber-200",
  preparing: "bg-blue-50 text-blue-700 border-blue-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  done: "bg-stone-100 text-stone-600 border-stone-200",
};
