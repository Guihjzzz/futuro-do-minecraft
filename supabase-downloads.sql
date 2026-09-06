-- Execute uma vez no SQL Editor do Supabase.
begin;

alter table public.items
  add column if not exists downloads bigint not null default 0;

alter table public.items
  drop constraint if exists items_downloads_nonnegative;

alter table public.items
  add constraint items_downloads_nonnegative check (downloads >= 0);

create index if not exists items_published_downloads_idx
  on public.items (is_published, downloads desc, created_at desc);

drop function if exists public.increment_item_download(uuid);

create function public.increment_item_download(p_item_id uuid)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  updated_downloads bigint;
begin
  update public.items
  set downloads = coalesce(downloads, 0) + 1
  where id = p_item_id
    and is_published = true
  returning downloads into updated_downloads;

  if updated_downloads is null then
    raise exception 'Item publicado nao encontrado';
  end if;

  return updated_downloads;
end;
$$;

revoke all on function public.increment_item_download(uuid) from public;
grant execute on function public.increment_item_download(uuid) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
