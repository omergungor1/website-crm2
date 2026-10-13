-- Media Studio
alter table projects add column if not exists logo_url text;

create table if not exists media_brand_kits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete cascade,
  display_name text,
  colors jsonb not null default '{}'::jsonb,
  tone text,
  personality text,
  visual_style text,
  typography jsonb not null default '{}'::jsonb,
  logo_rules jsonb not null default '{}'::jsonb,
  slogan text,
  keywords text[] default array[]::text[],
  prohibited_terms text[] default array[]::text[],
  guidelines text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media_content_ideas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null default '',
  content_type text not null
    check (content_type in ('free','post','story','carousel','video','ad')),
  creative_brief text not null default '',
  settings jsonb not null default '{}'::jsonb,
  brand_snapshot jsonb,
  plan jsonb,
  status text not null default 'draft'
    check (status in ('draft','plan_ready','ready','in_progress','completed','archived')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_media_content_ideas_project_status
  on media_content_ideas(project_id, status, created_at desc);

create table if not exists media_prompts (
  id uuid primary key default gen_random_uuid(),
  content_idea_id uuid not null references media_content_ideas(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  sequence_number integer not null default 1,
  title text not null default '',
  target_platform text not null default 'chatgpt'
    check (target_platform in ('chatgpt','google_flow','gemini','other')),
  media_type text not null default 'image'
    check (media_type in ('image','video')),
  prompt_text text not null default '',
  negative_prompt text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending','in_progress','completed','skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_idea_id, sequence_number, target_platform)
);

create index if not exists idx_media_prompts_project_status
  on media_prompts(project_id, status, updated_at desc);
create index if not exists idx_media_prompts_idea
  on media_prompts(content_idea_id, sequence_number);

create table if not exists media_prompt_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  content_idea_id uuid references media_content_ideas(id) on delete cascade,
  prompt_id uuid references media_prompts(id) on delete cascade,
  storage_path text not null,
  public_url text,
  asset_type text not null default 'reference'
    check (asset_type in ('reference','logo','preview')),
  original_filename text,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_prompt_assets_idea
  on media_prompt_assets(content_idea_id);

create table if not exists media_prompt_events (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references media_prompts(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  previous_status text,
  new_status text,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_prompt_events_prompt
  on media_prompt_events(prompt_id, created_at desc);

-- Erişim kontrolü uygulama API katmanında (getProjectAccess) yapılır.
-- İsterseniz sonra RLS policy ekleyebilirsiniz.
