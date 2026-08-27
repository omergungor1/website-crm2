-- Roadmap revision history (son 20 + günlük ilk yedek)
create table if not exists public.roadmap_revisions (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  canvas_data jsonb not null,
  node_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_roadmap_revisions_user_created
  on public.roadmap_revisions(user_id, created_at desc)
  where project_id is null;

create index if not exists idx_roadmap_revisions_project_created
  on public.roadmap_revisions(project_id, created_at desc)
  where project_id is not null;

create table if not exists public.roadmap_daily_backups (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  backup_date date not null,
  canvas_data jsonb not null,
  node_count integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_roadmap_daily_backups_user_date
  on public.roadmap_daily_backups(user_id, backup_date)
  where project_id is null;

create unique index if not exists idx_roadmap_daily_backups_project_date
  on public.roadmap_daily_backups(project_id, backup_date)
  where project_id is not null;
