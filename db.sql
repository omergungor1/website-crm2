create extension if not exists "uuid-ossp";

create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,

  name text not null,
  description text,

  payment_status text default 'pending' check (payment_status in ('pending','paid')),

  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table domains (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,

  domain text not null,

  is_primary boolean default false,

  availability_status text default 'checking'
    check (availability_status in ('available','unavailable','invalid','checking')),

  purchase_status text default 'not_purchased'
    check (purchase_status in ('not_purchased','pending','purchased')),

  vercel_status text default 'pending'
    check (vercel_status in ('pending','connected','failed')),

  created_at timestamp default now()
);
create index idx_domains_project_id on domains(project_id);


create table installation_forms (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid unique references projects(id) on delete cascade,

  public_token text unique not null,

  -- BASIC
  business_name text,
  contact_name text,
  contact_phone text,
  contact_phone_has_whatsapp boolean default false,
  landline_phone text,

  email text,
  address text,
  google_maps_link text,
  working_hours text,

  sector text,

  -- MEDIA
  logo_url text,
  logo_generate boolean default false,

  gallery_images text[],

  -- CONTENT
  services jsonb,
  service_regions jsonb,
  menu_items jsonb,

  -- SOCIAL
  social_links jsonb,

  -- DOMAIN (birden fazla aday domain)
  requested_domains text[] default array[]::text[],

  -- BRAND
  color_palette jsonb,
  brand_tone text check (brand_tone in ('formal','friendly','young','premium')),

  -- COMPETITOR
  competitor_website text,
  similarity_level text check (similarity_level in ('low','medium','high')),

  -- GOAL
  main_goal text check (main_goal in ('search','whatsapp','reservation','order')),

  -- AI CONTENT
  about_text text,
  about_generate boolean default false,
  slogan text,

  -- LEGAL
  kvkk_required boolean default false,
  privacy_required boolean default false,

  -- PAGES
  pages jsonb,
  -- authorized_person_name -> deleted
  -- INTERNAL CONTACT (CRM iç iletişim)
  authorized_person_phone text,

  is_completed boolean default false,

  created_at timestamp default now(),
  updated_at timestamp default now()
);


create table update_requests (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,

  status text default 'pending'
    check (status in ('pending','in_progress','completed')),

  pages text[],
  custom_page text,

  description text,

  created_by uuid references auth.users(id),

  created_at timestamp default now(),
  updated_at timestamp default now()
);


create table update_request_images (
  id uuid primary key default uuid_generate_v4(),
  update_request_id uuid references update_requests(id) on delete cascade,

  image_url text,

  created_at timestamp default now()
);


create table site_settings (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid unique references projects(id) on delete cascade,

  google_analytics_id text,
  google_search_console text,

  created_at timestamp default now(),
  updated_at timestamp default now()
);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;



create trigger set_updated_at_projects
before update on projects
for each row execute function update_updated_at_column();

create trigger set_updated_at_installation_forms
before update on installation_forms
for each row execute function update_updated_at_column();

create trigger set_updated_at_update_requests
before update on update_requests
for each row execute function update_updated_at_column();

create trigger set_updated_at_site_settings
before update on site_settings
for each row execute function update_updated_at_column();



