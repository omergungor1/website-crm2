-- =============================================================================
-- Roadmap Kit — tek migration
-- Hedef: Supabase (auth.users + isteğe bağlı projects tablosu)
-- Not: Proje bazlı roadmap kullanmayacaksanız project_id FK'lerini yorum satırı
--      yapabilir veya projects tablosu olmadan sadece user_roadmaps kullanın.
-- =============================================================================

create extension if not exists "uuid-ossp" with schema extensions;

-- -----------------------------------------------------------------------------
-- 1) Kullanıcı RoadMap canvas (admin / kişisel)
-- -----------------------------------------------------------------------------
create table if not exists public.user_roadmaps (
  user_id uuid primary key references auth.users(id) on delete cascade,
  canvas_data jsonb not null default '{"viewport":{"scrollX":0,"scrollY":0},"nodes":[],"edges":[],"annotations":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2) Proje RoadMap canvas (opsiyonel — public.projects tablosu gerekir)
-- -----------------------------------------------------------------------------
create table if not exists public.project_roadmaps (
  project_id uuid primary key references public.projects(id) on delete cascade,
  canvas_data jsonb not null default '{"viewport":{"scrollX":0,"scrollY":0},"nodes":[],"edges":[],"annotations":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_roadmaps_updated_at
  on public.project_roadmaps(updated_at desc);

-- -----------------------------------------------------------------------------
-- 3) Snapshots (PNG kayıt + metadata)
-- -----------------------------------------------------------------------------
create table if not exists public.roadmap_snapshots (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text,
  storage_path text not null,
  image_url text not null,
  width integer,
  height integer,
  zoom numeric(4,2),
  scroll_x integer,
  scroll_y integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_roadmap_snapshots_user
  on public.roadmap_snapshots(user_id, created_at desc);

create index if not exists idx_roadmap_snapshots_project
  on public.roadmap_snapshots(project_id, created_at desc)
  where project_id is not null;

-- -----------------------------------------------------------------------------
-- 4) Revision history (son N kayıt; API tarafında prune edilir)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 5) Günlük ilk backup (süresiz)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 6) Storage bucket: crm-roadmap-snapshots
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-roadmap-snapshots',
  'crm-roadmap-snapshots',
  true,
  20971520,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "roadmap_snapshots_storage_select" on storage.objects;
drop policy if exists "roadmap_snapshots_storage_insert" on storage.objects;
drop policy if exists "roadmap_snapshots_storage_update" on storage.objects;
drop policy if exists "roadmap_snapshots_storage_delete" on storage.objects;

create policy "roadmap_snapshots_storage_select"
  on storage.objects for select
  using (bucket_id = 'crm-roadmap-snapshots');

create policy "roadmap_snapshots_storage_insert"
  on storage.objects for insert
  with check (bucket_id = 'crm-roadmap-snapshots');

create policy "roadmap_snapshots_storage_update"
  on storage.objects for update
  using (bucket_id = 'crm-roadmap-snapshots')
  with check (bucket_id = 'crm-roadmap-snapshots');

create policy "roadmap_snapshots_storage_delete"
  on storage.objects for delete
  using (bucket_id = 'crm-roadmap-snapshots');

-- -----------------------------------------------------------------------------
-- 7) Görsel upload (Roadmap Image komponenti) — crm-uploads bucket
--    Host projede zaten varsa bu blok atlanabilir.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-uploads',
  'crm-uploads',
  true,
  3145728,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS örnekleri (ihtiyaca göre sıkılaştırın)
alter table public.user_roadmaps enable row level security;
alter table public.project_roadmaps enable row level security;
alter table public.roadmap_snapshots enable row level security;
alter table public.roadmap_revisions enable row level security;
alter table public.roadmap_daily_backups enable row level security;

drop policy if exists "user_roadmaps_own" on public.user_roadmaps;
create policy "user_roadmaps_own" on public.user_roadmaps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "roadmap_snapshots_own" on public.roadmap_snapshots;
create policy "roadmap_snapshots_own" on public.roadmap_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "roadmap_revisions_own" on public.roadmap_revisions;
create policy "roadmap_revisions_own" on public.roadmap_revisions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "roadmap_daily_backups_own" on public.roadmap_daily_backups;
create policy "roadmap_daily_backups_own" on public.roadmap_daily_backups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- project_roadmaps RLS: host uygulamanın proje sahipliği modeline göre yazılmalı.
-- Örnek (projects.user_id varsa):
-- drop policy if exists "project_roadmaps_owner" on public.project_roadmaps;
-- create policy "project_roadmaps_owner" on public.project_roadmaps
--   for all using (
--     exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
--   ) with check (
--     exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
--   );
