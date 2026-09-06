-- Guizz HOLOLAB
begin;
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
  id text primary key,
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
  download_url text check (download_url ~ '^https://'),
  texture_url text not null check (texture_url ~ '^https://'),
  mcstructure_url text not null check (mcstructure_url ~ '^https://'),
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- Preserve legacy URLs while introducing independent downloads.
alter table public.items add column if not exists description text;
alter table public.items add column if not exists image_url text;
alter table public.items add column if not exists texture_url text;
alter table public.items add column if not exists mcstructure_url text;
alter table public.items add column if not exists download_url text;
update public.items set texture_url = download_url where texture_url is null and download_url is not null;
update public.items set mcstructure_url = download_url where mcstructure_url is null and download_url is not null;
alter table public.items alter column download_url drop not null;
alter table public.items alter column texture_url set not null;
alter table public.items alter column mcstructure_url set not null;
alter table public.items drop constraint if exists items_texture_url_check;
alter table public.items add constraint items_texture_url_check check (texture_url ~ '^https://');
alter table public.items drop constraint if exists items_mcstructure_url_check;
alter table public.items add constraint items_mcstructure_url_check check (mcstructure_url ~ '^https://');

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
  user_id text not null,
  item_id uuid not null references public.items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Tabela adicional para o painel de historico do perfil.
create table if not exists public.download_history (
  id bigint generated always as identity primary key,
  user_id text not null,
  item_id uuid not null references public.items(id) on delete cascade,
  format text not null default 'texture' check (format in ('unified', 'texture', 'mcstructure')),
  created_at timestamptz not null default now()
);

-- Compatibilidade hibrida: Supabase usa UUID; Firebase usa UID textual.
-- Remove dependencias da versao UUID antes de converter as colunas.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_firebase_own" on public.profiles;
drop policy if exists "profiles_trusted_issuer" on public.profiles;
drop policy if exists "favorites_select_own" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;
drop policy if exists "favorites_trusted_issuer" on public.favorites;
drop policy if exists "downloads_select_own" on public.download_history;
drop policy if exists "downloads_insert_own" on public.download_history;
drop policy if exists "downloads_trusted_issuer" on public.download_history;
drop policy if exists "items_public_read" on public.items;
drop policy if exists "items_admin_insert" on public.items;
drop policy if exists "items_admin_update" on public.items;
drop policy if exists "items_admin_delete" on public.items;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();
alter table public.favorites drop constraint if exists favorites_user_id_fkey;
alter table public.download_history drop constraint if exists download_history_user_id_fkey;
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.favorites alter column user_id type text using user_id::text;
alter table public.download_history alter column user_id type text using user_id::text;
alter table public.profiles alter column id type text using id::text;

alter table public.download_history drop constraint if exists download_history_format_check;
-- Preserve historical downloads; map only the previous texture label.
update public.download_history set format = 'texture' where format = 'holoprint';
alter table public.download_history alter column format set default 'texture';
alter table public.download_history add constraint download_history_format_check
  check (format in ('unified', 'texture', 'mcstructure'));

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
    new.id::text,
    case when length(trim(new.raw_user_meta_data ->> 'username')) >= 2
      then left(trim(new.raw_user_meta_data ->> 'username'), 60) else null end,
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

-- Substitui o cascade perdido ao aceitar IDs textuais de dois provedores.
create or replace function public.handle_deleted_supabase_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.download_history where user_id = old.id::text;
  delete from public.favorites where user_id = old.id::text;
  delete from public.profiles where id = old.id::text;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted_hololab on auth.users;
create trigger on_auth_user_deleted_hololab
after delete on auth.users
for each row execute function public.handle_deleted_supabase_user();

-- Aceita somente JWTs do Supabase deste projeto ou do Firebase configurado.
create or replace function public.is_hololab_jwt()
returns boolean
language sql
stable
set search_path = ''
as $$
  select
    (auth.jwt() ->> 'iss' = 'https://mygycewxyepjpuyikump.supabase.co/auth/v1')
    or (
      auth.jwt() ->> 'iss' = 'https://securetoken.google.com/ghuizz-hololab'
      and auth.jwt() ->> 'aud' = 'ghuizz-hololab'
    );
$$;

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
    from public.profiles p
    join auth.users u on u.id::text = p.id
    where auth.jwt() ->> 'iss' = 'https://mygycewxyepjpuyikump.supabase.co/auth/v1'
      and p.id = auth.jwt() ->> 'sub'
      and p.role = 'admin'
      and lower(u.email) = 'junindacosta00241@gmail.com'
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.favorites enable row level security;
alter table public.download_history enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.jwt() ->> 'sub');

drop policy if exists "profiles_insert_firebase_own" on public.profiles;
create policy "profiles_insert_firebase_own"
on public.profiles
for insert
to authenticated
with check (id = auth.jwt() ->> 'sub' and role = 'user');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.jwt() ->> 'sub')
with check (id = auth.jwt() ->> 'sub');

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
using (user_id = auth.jwt() ->> 'sub');

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites
for insert
to authenticated
with check (user_id = auth.jwt() ->> 'sub');

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites
for delete
to authenticated
using (user_id = auth.jwt() ->> 'sub');

drop policy if exists "downloads_select_own" on public.download_history;
create policy "downloads_select_own"
on public.download_history
for select
to authenticated
using (user_id = auth.jwt() ->> 'sub');

drop policy if exists "downloads_insert_own" on public.download_history;
create policy "downloads_insert_own"
on public.download_history
for insert
to authenticated
with check (user_id = auth.jwt() ->> 'sub');

-- Camada restritiva adicional para os JWTs externos aceitos pelo projeto.
drop policy if exists "items_trusted_issuer" on public.items;
create policy "items_trusted_issuer"
on public.items as restrictive for all to authenticated
using (public.is_hololab_jwt())
with check (public.is_hololab_jwt());

drop policy if exists "profiles_trusted_issuer" on public.profiles;
create policy "profiles_trusted_issuer"
on public.profiles as restrictive for all to authenticated
using (public.is_hololab_jwt())
with check (public.is_hololab_jwt());

drop policy if exists "favorites_trusted_issuer" on public.favorites;
create policy "favorites_trusted_issuer"
on public.favorites as restrictive for all to authenticated
using (public.is_hololab_jwt())
with check (public.is_hololab_jwt());

drop policy if exists "downloads_trusted_issuer" on public.download_history;
create policy "downloads_trusted_issuer"
on public.download_history as restrictive for all to authenticated
using (public.is_hololab_jwt())
with check (public.is_hololab_jwt());

-- Permissoes de tabela. RLS continua sendo a barreira de acesso por linha.
grant usage on schema public to anon, authenticated;

grant select on public.items to anon, authenticated;
grant insert, update, delete on public.items to authenticated;

grant select on public.profiles to authenticated;
grant insert (id, username, language) on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (username, avatar_url, language) on public.profiles to authenticated;

grant select, insert, delete on public.favorites to authenticated;
grant select, insert on public.download_history to authenticated;
grant usage, select on sequence public.download_history_id_seq to authenticated;

-- Depois de criar o usuario admin em Authentication > Users, execute apenas:
-- update public.profiles
-- set role = 'admin'
-- where id = (
--   select id::text from auth.users where email = 'junindacosta00241@gmail.com'
-- );


commit;
