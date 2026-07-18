-- Deep Work Board v2 — proje todoları + pause destekli oturumlar
-- Uygulama DB'sine bir kez çalıştırın.

alter table public.projects add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.projects add column if not exists is_archived boolean default false;

create table if not exists public.project_todos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  is_completed boolean default false,
  sort_order integer not null default 0,
  color text check (color is null or color in ('blue','amber','rose')),
  is_archived boolean default false,
  is_later boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  planned_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.project_todos add column if not exists planned_date date;
alter table public.project_todos add column if not exists completed_at timestamptz;
alter table public.project_todos add column if not exists board_sort_order integer not null default 0;

create index if not exists idx_project_todos_planned_date on public.project_todos(planned_date);
create index if not exists idx_project_todos_planned_board_sort
  on public.project_todos(planned_date, board_sort_order)
  where is_deleted = false and planned_date is not null;

create table if not exists public.deep_work_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null default 'todo' check (status in ('todo', 'doing', 'done', 'archive')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  estimated_minutes integer not null default 0,
  worked_minutes integer not null default 0,
  sort_order integer not null default 0,
  project_id uuid references public.projects(id) on delete set null,
  source_todo_id uuid references public.project_todos(id) on delete set null,
  planned_date date,
  is_today_plan boolean not null default false,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deep_work_tasks add column if not exists source_todo_id uuid references public.project_todos(id) on delete set null;

create table if not exists public.deep_work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.deep_work_tasks(id) on delete set null,
  project_todo_id uuid references public.project_todos(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  paused_at timestamptz,
  last_resumed_at timestamptz,
  accumulated_seconds integer not null default 0,
  duration_minutes integer not null default 0,
  status text not null default 'running' check (status in ('running', 'paused', 'ended')),
  session_type text not null default 'focus' check (session_type in ('focus', 'break'))
);

alter table public.deep_work_sessions add column if not exists project_todo_id uuid references public.project_todos(id) on delete set null;
alter table public.deep_work_sessions add column if not exists paused_at timestamptz;
alter table public.deep_work_sessions add column if not exists last_resumed_at timestamptz;
alter table public.deep_work_sessions add column if not exists accumulated_seconds integer not null default 0;
alter table public.deep_work_sessions add column if not exists status text not null default 'running';

do $$
begin
  alter table public.deep_work_sessions alter column task_id drop not null;
exception when others then null;
end $$;

create index if not exists idx_deep_work_sessions_active on public.deep_work_sessions(user_id) where ended_at is null;

create table if not exists public.deep_work_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_goal_minutes integer not null default 120,
  pomodoro_work_minutes integer not null default 25,
  pomodoro_break_minutes integer not null default 5,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_date date not null,
  today_summary text default '',
  tomorrow_first_task text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  unique (user_id, review_date)
);
