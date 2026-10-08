-- =============================================================
-- theodesmond.com — self-hosted Postgres schema
-- Applied automatically by the API server on boot (server/db.js)
-- or manually: psql $DATABASE_URL -f server/schema.sql
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- POSTS ----------
create table if not exists posts (
  slug text primary key,
  title text not null,
  seo_title text,
  topic text not null default 'General',
  date text not null,
  date_published text,
  date_modified text,
  read_time text not null default '5 min read',
  excerpt text,
  seo_description text,
  keywords text[] not null default '{}',
  og_image text,
  status text not null default 'Published',
  blocks jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table if not exists products (
  slug text primary key,
  idx text not null default '',
  name text not null,
  tagline text not null default '',
  category text not null default '',
  industry text not null default '',
  tags text[] not null default '{}',
  status text not null default 'BUILDING',
  accent text not null default 'indigo',
  visual text not null default '',
  image text not null default '',
  link text not null default '',
  details text not null default '',
  seo_desc text not null default '',
  overview text not null default '',
  features text[] not null default '{}',
  functions text[] not null default '{}',
  architecture text not null default '',
  framework text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_sort_idx on products (sort_order);

-- ---------- SITE CONTENT (key/value) ----------
create table if not exists site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- COMMENTS ----------
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references posts(slug) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  author text not null,
  email text,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on comments (post_slug);
create index if not exists comments_parent_idx on comments (parent_id);

-- ---------- REACTIONS ----------
create table if not exists post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references posts(slug) on delete cascade,
  emoji text not null,
  user_key text not null,
  created_at timestamptz not null default now(),
  unique (post_slug, emoji, user_key)
);
create index if not exists post_reactions_slug_idx on post_reactions (post_slug);

create table if not exists comment_reactions (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references posts(slug) on delete cascade,
  comment_id uuid not null references comments(id) on delete cascade,
  emoji text not null,
  user_key text not null,
  created_at timestamptz not null default now(),
  unique (comment_id, emoji, user_key)
);
create index if not exists comment_reactions_slug_idx on comment_reactions (post_slug);

-- ---------- CONTACTS ----------
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  category text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------- SUBSCRIBERS ----------
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text not null default 'website',
  created_at timestamptz not null default now()
);
create index if not exists subscribers_email_idx on subscribers (email);

-- ---------- POST VIEWS ----------
create table if not exists post_views (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references posts(slug) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  unique (post_slug, ip_hash)
);
create index if not exists post_views_slug_idx on post_views (post_slug);

-- ---------- VISITS ----------
create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  path text not null default '/',
  referrer text,
  ip text,
  city text,
  region text,
  country text,
  country_code text,
  org text,
  user_agent text,
  device text,
  os text,
  browser text,
  screen text,
  language text,
  created_at timestamptz not null default now()
);
create index if not exists visits_created_idx on visits (created_at desc);
create index if not exists visits_ip_idx on visits (ip);
create index if not exists visits_path_idx on visits (path);

-- Geo upgrades (safe on existing tables).
alter table visits add column if not exists lat double precision;
alter table visits add column if not exists lon double precision;
alter table visits add column if not exists timezone text;

-- ---------- ADMIN USERS ----------
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- ---------- AUREX PROJECTS ----------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status text not null default 'active',
  path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);-- ---------- PUSH SUBSCRIPTIONS (desktop alerts) ----------
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  label text not null default '',
  visitor_key text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_visitor_idx on push_subscriptions (visitor_key);

-- ---------- LIVE CHAT ----------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null default '',
  visitor_email text not null default '',
  visitor_key text not null default '',
  status text not null default 'open',
  unread_admin integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_updated_idx on conversations (updated_at desc);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender text not null default 'visitor',
  name text not null default '',
  text text not null default '',
  attachment_url text,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_conv_idx on chat_messages (conversation_id, created_at);

-- Delivery receipts (sent → delivered → read).
alter table chat_messages add column if not exists status text not null default 'sent';
