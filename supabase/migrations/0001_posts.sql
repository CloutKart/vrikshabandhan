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
