-- Who may edit: a list of e-mail addresses. Anyone may read live, undeleted posts.
create table if not exists public.editors (
  email text primary key,
  added_at timestamptz not null default now()
);

create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
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
