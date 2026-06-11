-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Events table
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '',
  status text not null default 'planning',
  purpose text not null default 'satisfaction',
  grade_targets jsonb not null default '[]',
  audience_type text not null default 'internal',
  event_date timestamptz,
  event_end_date timestamptz,
  location text not null default '',
  capacity integer,
  required_tools jsonb not null default '[]',
  goal text not null default '',
  before_state text not null default '',
  after_state text not null default '',
  ideal_feedback text not null default '',
  behavior_change text not null default '',
  timeline jsonb not null default '[]',
  prep_tasks jsonb not null default '[]',
  applicants integer,
  participants integer,
  friend_participants integer,
  trial_count integer,
  enrollment_count integer,
  good_points text not null default '',
  improvement_points text not null default '',
  child_reactions text not null default '',
  parent_reactions text not null default '',
  survey_data text not null default '',
  ai_analysis text,
  rating jsonb,
  ai_review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS policies
alter table events enable row level security;

create policy "Users can manage their own events"
  on events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Updated at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger events_updated_at
  before update on events
  for each row execute function update_updated_at();
