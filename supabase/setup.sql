-- One-shot setup for a fresh Supabase project: the three migrations in order, then the editor list.
-- Idempotent: safe to run again. Paste into the SQL editor or run: psql "$SUPABASE_DB_URL" -f supabase/setup.sql

-- ---- supabase/migrations/0001_posts.sql
-- Stories. Bodies keep the editor's mini-markup ("## " heading, "> " quote, one paragraph per line).
create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_hi text not null default '',
  summary_en text not null default '',
  summary_hi text not null default '',
  body_en text not null default '',
  body_hi text not null default '',
  date date not null,
  place text not null default '',
  tags text[] not null default '{}',
  yt text not null default '',
  media jsonb not null default '[]'::jsonb,
  live boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_live_date_idx on public.posts (date desc) where live and deleted_at is null;
create index if not exists posts_tags_idx on public.posts using gin (tags);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

-- ---- supabase/migrations/0002_editors_rls.sql
-- Who may edit: a list of e-mail addresses. Anyone may read live, undeleted posts.
create table if not exists public.editors (
  email text primary key,
  added_at timestamptz not null default now()
);

create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.editors e
    where lower(e.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.posts enable row level security;
alter table public.editors enable row level security;

drop policy if exists "public reads live posts" on public.posts;
create policy "public reads live posts" on public.posts
  for select using (live and deleted_at is null);

drop policy if exists "editors manage posts" on public.posts;
create policy "editors manage posts" on public.posts
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists "editors see the editor list" on public.editors;
create policy "editors see the editor list" on public.editors
  for select to authenticated using (public.is_editor());

-- ---- supabase/migrations/0003_storage.sql
-- Photos and videos. Public read; editors write. Nothing is hard-deleted by the site.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public reads media" on storage.objects;
create policy "public reads media" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "editors upload media" on storage.objects;
create policy "editors upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_editor());

drop policy if exists "editors update media" on storage.objects;
create policy "editors update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_editor())
  with check (bucket_id = 'media' and public.is_editor());

drop policy if exists "editors delete media" on storage.objects;
create policy "editors delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_editor());

-- ---- editors (stored lower-case; the site compares addresses without regard to case)
insert into public.editors (email) values
  ('ukrajyanirmansenanisangh@gmail.com'),
  ('vrikshabandhanabhiyan@gmail.com'),
  ('shivam@clout-kart.com')
on conflict (email) do nothing;
