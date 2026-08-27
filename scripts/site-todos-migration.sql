-- Site geneli todolar (projeden bağımsız)
create table if not exists public.site_todos (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  is_completed boolean default false,
  sort_order integer not null default 0,

  color text check (color is null or color in ('blue','amber','rose')),
  is_archived boolean default false,
  is_later boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz,

  completed_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_site_todos_user_id on public.site_todos(user_id);
create index if not exists idx_site_todos_user_sort on public.site_todos(user_id, sort_order);
create index if not exists idx_site_todos_active on public.site_todos(user_id) where is_deleted = false;
