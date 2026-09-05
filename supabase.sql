-- GUIZZ STRUCTURES
-- Execute este arquivo inteiro no SQL Editor do Supabase.
-- O bloco de compatibilidade tambem atualiza a versao anterior deste schema.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'user_role'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.user_role as enum ('user', 'admin');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text check (username is null or char_length(username) between 2 and 60),
  avatar_url text,
  language text not null default 'pt-BR' check (language in ('pt-BR', 'en', 'es')),
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 500),
  category text not null default 'Houses'
    check (category in ('Houses', 'Decorations', 'Farms', 'Hologram Pack')),
  image_url text not null check (image_url ~ '^https://'),
  download_url text not null check (download_url ~ '^https://'),
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibilidade com a primeira versao: normaliza tudo para as quatro categorias.
alter table public.items add column if not exists category text;
update public.items
set category = 'Houses'
where category is null
   or category not in ('Houses', 'Decorations', 'Farms', 'Hologram Pack');
alter table public.items alter column category set default 'Houses';
alter table public.items alter column category set not null;
alter table public.items drop constraint if exists items_category_check;
alter table public.items add constraint items_category_check
  check (category in ('Houses', 'Decorations', 'Farms', 'Hologram Pack'));
alter table public.items drop column if exists formats;

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Tabela adicional para o painel de historico do perfil.
create table if not exists public.download_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  format text not null default 'unified' check (format = 'unified'),
  created_at timestamptz not null default now()
);

alter table public.download_history drop constraint if exists download_history_format_check;
update public.download_history set format = 'unified' where format <> 'unified';
alter table public.download_history alter column format set default 'unified';
alter table public.download_history add constraint download_history_format_check
  check (format = 'unified');

create index if not exists favorites_user_created_idx
  on public.favorites (user_id, created_at desc);

create index if not exists download_history_user_created_idx
  on public.download_history (user_id, created_at desc);

create index if not exists items_published_created_idx
  on public.items (is_published, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
before update on public.items
for each row execute function public.set_updated_at();

-- Cria automaticamente um perfil sem privilegios para todo novo usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, language, role)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    'pt-BR',
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Helper central: exige role admin E o e-mail exato dentro do JWT autenticado.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and lower(coalesce(auth.jwt() ->> 'email', '')) = 'junindacosta00241@gmail.com'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.favorites enable row level security;
alter table public.download_history enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "items_public_read" on public.items;
create policy "items_public_read"
on public.items
for select
to anon, authenticated
using (is_published = true or public.is_admin());

drop policy if exists "items_admin_insert" on public.items;
create policy "items_admin_insert"
on public.items
for insert
to authenticated
with check (public.is_admin() and created_by = auth.uid());

drop policy if exists "items_admin_update" on public.items;
create policy "items_admin_update"
on public.items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "items_admin_delete" on public.items;
create policy "items_admin_delete"
on public.items
for delete
to authenticated
using (public.is_admin());

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "downloads_select_own" on public.download_history;
create policy "downloads_select_own"
on public.download_history
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "downloads_insert_own" on public.download_history;
create policy "downloads_insert_own"
on public.download_history
for insert
to authenticated
with check (user_id = auth.uid());

-- Permissoes de tabela. RLS continua sendo a barreira de acesso por linha.
grant usage on schema public to anon, authenticated;

grant select on public.items to anon, authenticated;
grant insert, update, delete on public.items to authenticated;

grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (username, avatar_url, language) on public.profiles to authenticated;

grant select, insert, delete on public.favorites to authenticated;
grant select, insert on public.download_history to authenticated;
grant usage, select on sequence public.download_history_id_seq to authenticated;

-- Bucket publico somente para thumbnails. Escrita e exclusao exigem role admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "item_images_public_read" on storage.objects;
create policy "item_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'item-images');

drop policy if exists "item_images_admin_insert" on storage.objects;
create policy "item_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'item-images' and public.is_admin());

drop policy if exists "item_images_admin_update" on storage.objects;
create policy "item_images_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'item-images' and public.is_admin())
with check (bucket_id = 'item-images' and public.is_admin());

drop policy if exists "item_images_admin_delete" on storage.objects;
create policy "item_images_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'item-images' and public.is_admin());

-- Depois de criar o usuario admin em Authentication > Users, execute apenas:
-- update public.profiles
-- set role = 'admin'
-- where id = (
--   select id from auth.users where email = 'junindacosta00241@gmail.com'
-- );
