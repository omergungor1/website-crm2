create extension if not exists "uuid-ossp";

create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  update_public_token text unique,

  name text not null,
  description text,

  payment_status text default 'pending' check (payment_status in ('pending','paid')),
  status text default 'created'
    check (status in ('created','preparing','coding','completed')),

  admin_note text,

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


-- Sitede yer alan sayfalar (kurulum formundaki pages listesi ile senkron)
create table site_pages (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,

  title text not null,
  sort_order int not null default 0,

  created_at timestamptz default now()
);
create index idx_site_pages_project_id on site_pages(project_id);
create index idx_site_pages_project_sort on site_pages(project_id, sort_order);


create table installation_forms (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid unique references projects(id) on delete cascade,

  public_token text unique not null,

  -- İş akışı (proje yönetimi / kurulum); UI ile uyumlu İngilizce değerler
  status text default 'pending'
    check (status in ('pending','in_review','in_progress','completed')),

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
  logo_ai_urls text[] default array[]::text[],

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
  color_palette_mode text default 'preset'
    check (color_palette_mode in ('ai','preset','manual')),
  color_generate boolean default false,
  color_ai_palettes jsonb default '[]'::jsonb,
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

  -- Sayfa listesi: site_pages tablosunda (project_id ile)
  -- authorized_person_name -> deleted
  -- INTERNAL CONTACT (CRM iç iletişim)
  authorized_person_phone text,

  -- Site hakkında genel istek/not alanı (admin + ekip kullanımı)
  site_requests text,

  is_completed boolean default false,

  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Eski veritabanlarında installation_forms.pages kaldırmak için (bir kez):
-- alter table installation_forms drop column if exists pages;


create table update_requests (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,

  status text default 'pending'
    check (status in ('pending','in_progress','completed','cancelled')),

  title text not null,
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






CREATE TABLE crm_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);


CREATE TABLE crm_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  group_id uuid REFERENCES crm_groups(id) ON DELETE CASCADE,

  -- CSV’den gelen alanlar
  business_name text,
  maps_url text,
  phone_number text,
  province text,
  district text,
  rating numeric,
  review_count integer,

  -- CRM alanları
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'callback', 'positive', 'negative')),

  note text DEFAULT '',

  callback_date timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status_changed_at timestamptz
);

CREATE INDEX idx_crm_customers_group_status 
ON crm_customers(group_id, status);

-- crm_customers otomatik zaman alanları
CREATE OR REPLACE FUNCTION set_crm_customers_timestamps()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_crm_customers_timestamps ON crm_customers;
CREATE TRIGGER trg_set_crm_customers_timestamps
BEFORE UPDATE ON crm_customers
FOR EACH ROW
EXECUTE FUNCTION set_crm_customers_timestamps();


-- =========================
-- AI Logo Generator
-- =========================

create table if not exists logo_generations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete cascade,

  title text not null,

  fixed_prompt text not null,
  user_prompt text not null,
  full_prompt text not null,

  -- public storage url
  logo_url text not null,
  -- bucket içi yol (debug/yeniden kullanım için)
  storage_path text not null,

  created_at timestamptz not null default now()
);

create index if not exists idx_logo_generations_created_by_created_at
  on logo_generations(created_by, created_at desc);

create index if not exists idx_logo_generations_created_at
  on logo_generations(created_at desc);
