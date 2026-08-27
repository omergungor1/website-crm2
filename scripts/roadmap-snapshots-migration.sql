-- Roadmap snapshot kayıtları ve storage bucket
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

create index if not exists idx_roadmap_snapshots_user on public.roadmap_snapshots(user_id, created_at desc);
create index if not exists idx_roadmap_snapshots_project on public.roadmap_snapshots(project_id, created_at desc) where project_id is not null;

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
