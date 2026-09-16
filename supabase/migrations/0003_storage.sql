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
  for update to authenticated using (bucket_id = 'media' and public.is_editor());

drop policy if exists "editors delete media" on storage.objects;
create policy "editors delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_editor());
