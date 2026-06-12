export type EventStatus = "planning" | "preparing" | "ready" | "done";

export type EventPurpose =
  | "referral"
  | "trial"
  | "enrollment"
  | "satisfaction"
  | "motivation"
  | "kc"
  | "parent_understanding"
  | "branding"
  | "other";

export type GradeTarget =
  | "preschool"
  | "grade1_2"
  | "grade3_4"
  | "grade5_6"
  | "junior_high";

export type AudienceType = "internal" | "internal_friends" | "external" | "parents";

export interface TimelineItem {
  id: string;
  start_time: string;
  end_time: string;
  content: string;
  detail: string;
  todos: string[];
  tools: string[];
  concerns: string;
  assignee: string;
}

export interface PrepTask {
  id: string;
  title: string;
  deadline: string;
  work_start: string;
  work_end: string;
  assignee: string;
  completed: boolean;
  category: string;
}

export interface EventRating {
  attraction: number;
  satisfaction: number;
  enrollment_effect: number;
  prep_load: number;
  cost_performance: number;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  status: EventStatus;
  purpose: EventPurpose;
  grade_targets: GradeTarget[];
  audience_type: AudienceType;
  event_date: string | null;
  event_end_date: string | null;
  location: string;
  capacity: number | null;
  required_tools: string[];
  goal: string;
  before_state: string;
  after_state: string;
  ideal_feedback: string;
  behavior_change: string;
  timeline: TimelineItem[];
  prep_tasks: PrepTask[];
  applicants: number | null;
  participants: number | null;
  friend_participants: number | null;
  trial_count: number | null;
  enrollment_count: number | null;
  good_points: string;
  improvement_points: string;
  child_reactions: string;
  parent_reactions: string;
  survey_data: string;
  ai_analysis: string | null;
  rating: EventRating | null;
  ai_review: string | null;
  created_at: string;
  updated_at: string;
}
