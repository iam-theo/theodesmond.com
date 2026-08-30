-- =============================================================
-- theodesmond.com — Supabase schema
-- Run this file once in: Supabase Dashboard > SQL Editor
-- =============================================================

-- ---------- POSTS (managed in the Studio "portal") ----------
create table if not exists public.posts (
  slug text primary key,
  title text not null,
  topic text not null default 'General',
  date text not null,
  read_time text not null default '5 min read',
  excerpt text,
  status text not null default 'Published',
  blocks jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- COMMENTS (threaded via parent_id) ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references public.posts(slug) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author text not null,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_slug);
create index if not exists comments_parent_idx on public.comments (parent_id);

-- ---------- POST REACTIONS ----------
create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references public.posts(slug) on delete cascade,
  emoji text not null,
  user_key text not null,
  created_at timestamptz not null default now(),
  unique (post_slug, emoji, user_key)
);
create index if not exists post_reactions_slug_idx on public.post_reactions (post_slug);

-- ---------- COMMENT REACTIONS ----------
create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references public.posts(slug) on delete cascade,
  comment_id uuid not null references public.comments(id) on delete cascade,
  emoji text not null,
  user_key text not null,
  created_at timestamptz not null default now(),
  unique (comment_id, emoji, user_key)
);
create index if not exists comment_reactions_slug_idx on public.comment_reactions (post_slug);

-- ---------- CONTACT FORM SUBMISSIONS ----------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  category text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.contacts enable row level security;

-- Posts: public read; editing happens in Studio (service role bypasses RLS).
drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts for select using (true);

-- Comments: public read + insert.
drop policy if exists "comments public read" on public.comments;
create policy "comments public read" on public.comments for select using (true);
drop policy if exists "comments public insert" on public.comments;
create policy "comments public insert" on public.comments for insert with check (true);

-- Post reactions: public read + insert/delete (toggling needs both).
drop policy if exists "post_reactions public read" on public.post_reactions;
create policy "post_reactions public read" on public.post_reactions for select using (true);
drop policy if exists "post_reactions public insert" on public.post_reactions;
create policy "post_reactions public insert" on public.post_reactions for insert with check (true);
drop policy if exists "post_reactions public delete" on public.post_reactions;
create policy "post_reactions public delete" on public.post_reactions for delete using (true);

-- Comment reactions: public read + insert/delete.
drop policy if exists "comment_reactions public read" on public.comment_reactions;
create policy "comment_reactions public read" on public.comment_reactions for select using (true);
drop policy if exists "comment_reactions public insert" on public.comment_reactions;
create policy "comment_reactions public insert" on public.comment_reactions for insert with check (true);
drop policy if exists "comment_reactions public delete" on public.comment_reactions;
create policy "comment_reactions public delete" on public.comment_reactions for delete using (true);

-- Contacts: public insert (form), only staff can read.
drop policy if exists "contacts public insert" on public.contacts;
create policy "contacts public insert" on public.contacts for insert with check (true);
drop policy if exists "contacts staff read" on public.contacts;
create policy "contacts staff read" on public.contacts for select using (auth.role() = 'authenticated');

-- ---------- REALTIME (enable streaming for live updates) ----------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments') then
    alter publication supabase_realtime add table public.comments;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comment_reactions') then
    alter publication supabase_realtime add table public.comment_reactions;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'post_reactions') then
    alter publication supabase_realtime add table public.post_reactions;
  end if;
end $$;
