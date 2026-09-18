-- Newsletter: subscribers, who got which story, and the mark that makes a story mailable exactly once.
-- The public path (subscribe, confirm, unsubscribe) runs through security-definer functions gated by a shared
-- secret only the server knows, so the anon key alone can neither read nor write a subscriber, and no
-- service-role key is needed anywhere. Idempotent: safe to run again.

-- 1. Posts: when the story was mailed (the idempotency key) and whether that was a test-mode send.
alter table public.posts add column if not exists newsletter_sent_at timestamptz;
alter table public.posts add column if not exists newsletter_test boolean not null default false;
-- Stories already live before the newsletter existed count as announced; nothing old is ever mailed.
update public.posts set newsletter_sent_at = created_at where live and newsletter_sent_at is null;

-- 2. A private schema the API never exposes (Project settings, API: exposed schemas must stay public, graphql_public).
create schema if not exists private;
revoke usage on schema private from anon, authenticated;

create table if not exists private.newsletter_config (
  key text primary key,
  value text not null
);
create table if not exists private.newsletter_attempts (
  ip_hash bytea not null,
  email_hash bytea not null,
  created_at timestamptz not null default now()
);
create index if not exists newsletter_attempts_created_idx on private.newsletter_attempts (created_at);

create or replace function private.newsletter_check(p_secret text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_secret is null or p_secret = ''
     or p_secret is distinct from (select value from private.newsletter_config where key = 'secret') then
    raise exception 'newsletter: not allowed' using errcode = '42501';
  end if;
end $$;

-- 64 hex characters from two random UUIDs: 256 bits, no extension needed.
create or replace function private.newsletter_token() returns text
language sql volatile set search_path = '' as $$
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
$$;

-- 3. Subscribers. Editors may read and update (the Abhiyan owns its list); nobody writes through the API.
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  locale text not null default 'en' check (locale in ('en', 'hi')),
  unsubscribe_token text not null unique default private.newsletter_token(),
  confirm_token_hash bytea,
  confirm_expires_at timestamptz,
  confirm_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscribers_active_idx on public.subscribers (locale, id)
  where confirmed_at is not null and unsubscribed_at is null;
drop trigger if exists subscribers_set_updated_at on public.subscribers;
create trigger subscribers_set_updated_at before update on public.subscribers
  for each row execute function public.set_updated_at();
alter table public.subscribers enable row level security;
drop policy if exists "editors read subscribers" on public.subscribers;
create policy "editors read subscribers" on public.subscribers
  for select to authenticated using (public.is_editor());
drop policy if exists "editors update subscribers" on public.subscribers;
create policy "editors update subscribers" on public.subscribers
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

-- 4. Who got which story. Written by the send action under the editor's session; never by anon.
create table if not exists public.newsletter_deliveries (
  post_id uuid not null references public.posts (id) on delete cascade,
  subscriber_id uuid not null references public.subscribers (id) on delete cascade,
  batch_no int not null,
  locale text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  attempts int not null default 0,
  provider_id text,
  error text,
  updated_at timestamptz not null default now(),
  primary key (post_id, subscriber_id)
);
create index if not exists newsletter_deliveries_post_idx on public.newsletter_deliveries (post_id, status);
alter table public.newsletter_deliveries enable row level security;
drop policy if exists "editors manage deliveries" on public.newsletter_deliveries;
create policy "editors manage deliveries" on public.newsletter_deliveries
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- 5. The public path. Three functions, each checking the secret first.
-- subscribe: 'rate_limited' (over 5 tries from one address in an hour, or 3 for one e-mail in a day),
--            'already' (confirmed and not unsubscribed; returns the unsubscribe token for the reminder mail),
--            'throttled' (a confirmation went out under 10 minutes ago), or 'confirm' with a raw token returned
--            once (its sha256 is stored, valid 48 hours).
create or replace function public.newsletter_subscribe(p_secret text, p_email text, p_locale text, p_ip text)
returns table (outcome text, subscriber_id uuid, confirm_token text, unsub_token text)
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_locale text := case when p_locale in ('en', 'hi') then p_locale else 'en' end;
  v_ip bytea;
  v_em bytea;
  v_raw text;
  v_row public.subscribers%rowtype;
begin
  perform private.newsletter_check(p_secret);
  delete from private.newsletter_attempts a where a.created_at < now() - interval '1 day';
  v_ip := sha256(convert_to(coalesce(p_ip, '') || p_secret, 'utf8'));
  v_em := sha256(convert_to(v_email || p_secret, 'utf8'));
  if (select count(*) from private.newsletter_attempts a where a.ip_hash = v_ip and a.created_at > now() - interval '1 hour') >= 5
     or (select count(*) from private.newsletter_attempts a where a.email_hash = v_em) >= 3 then
    return query select 'rate_limited'::text, null::uuid, null::text, null::text;
    return;
  end if;
  insert into private.newsletter_attempts (ip_hash, email_hash) values (v_ip, v_em);

  select * into v_row from public.subscribers s where s.email = v_email;
  if found and v_row.confirmed_at is not null and v_row.unsubscribed_at is null then
    return query select 'already'::text, v_row.id, null::text, v_row.unsubscribe_token;
    return;
  end if;
  if found and v_row.confirm_sent_at is not null and v_row.confirm_sent_at > now() - interval '10 minutes'
     and (v_row.confirmed_at is null or v_row.unsubscribed_at is not null) then
    return query select 'throttled'::text, v_row.id, null::text, null::text;
    return;
  end if;

  v_raw := private.newsletter_token();
  insert into public.subscribers (email, locale, confirm_token_hash, confirm_expires_at, confirm_sent_at)
  values (v_email, v_locale, sha256(convert_to(v_raw, 'utf8')), now() + interval '48 hours', now())
  on conflict (email) do update
    set locale = excluded.locale,
        confirm_token_hash = excluded.confirm_token_hash,
        confirm_expires_at = excluded.confirm_expires_at,
        confirm_sent_at = excluded.confirm_sent_at
  returning * into v_row;
  return query select 'confirm'::text, v_row.id, v_raw, v_row.unsubscribe_token;
end $$;

-- confirm: 'confirmed' once (the hash is cleared, so a second visit finds nothing), else 'expired'.
create or replace function public.newsletter_confirm(p_secret text, p_token text)
returns table (outcome text, sub_email text, sub_locale text)
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.subscribers%rowtype;
begin
  perform private.newsletter_check(p_secret);
  update public.subscribers s
    set confirmed_at = coalesce(s.confirmed_at, now()),
        unsubscribed_at = null,
        confirm_token_hash = null,
        confirm_expires_at = null
  where s.confirm_token_hash = sha256(convert_to(coalesce(p_token, ''), 'utf8'))
    and s.confirm_expires_at > now()
  returning * into v_row;
  if found then
    return query select 'confirmed'::text, v_row.email, v_row.locale;
  else
    return query select 'expired'::text, null::text, null::text;
  end if;
end $$;

-- unsubscribe: 'unsubscribed' (idempotent) or 'invalid'.
create or replace function public.newsletter_unsubscribe(p_secret text, p_token text)
returns table (outcome text, sub_email text, sub_locale text)
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.subscribers%rowtype;
begin
  perform private.newsletter_check(p_secret);
  update public.subscribers s
    set unsubscribed_at = coalesce(s.unsubscribed_at, now())
  where s.unsubscribe_token = coalesce(p_token, '') and p_token <> ''
  returning * into v_row;
  if found then
    return query select 'unsubscribed'::text, v_row.email, v_row.locale;
  else
    return query select 'invalid'::text, null::text, null::text;
  end if;
end $$;

revoke execute on function private.newsletter_check(text) from public, anon, authenticated;
revoke execute on function private.newsletter_token() from public, anon, authenticated;
grant execute on function public.newsletter_subscribe(text, text, text, text) to anon, authenticated;
grant execute on function public.newsletter_confirm(text, text) to anon, authenticated;
grant execute on function public.newsletter_unsubscribe(text, text) to anon, authenticated;

-- 6. Operator step (docs/deploy.md): store the same secret the server holds as NEWSLETTER_SECRET.
-- insert into private.newsletter_config (key, value) values ('secret', '<NEWSLETTER_SECRET>')
--   on conflict (key) do update set value = excluded.value;
