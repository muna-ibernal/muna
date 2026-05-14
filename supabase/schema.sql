-- ============================================================
-- Muna — Esquema de base de datos
-- ============================================================
-- Ejecutar en el SQL editor de Supabase (Project → SQL editor → New query).
-- Orden de ejecución:
--   1) schema.sql      ← este archivo
--   2) policies.sql    ← Row Level Security
--   3) storage.sql     ← buckets de imágenes
--   4) seed.sql        ← datos iniciales (opcional)
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES (perfil público vinculado a auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  first_name text,
  paternal_surname text,
  maternal_surname text,
  email text,
  phone text,
  country text,
  city text,
  deleg text,
  zone text,
  relacion_maternidad text,
  baby_date date,            -- privado, nunca se muestra públicamente
  num_children int,
  topics text[] default '{}',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger para crear perfil al registrarse vía Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, first_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'usuaria_' || substr(new.id::text,1,8)),
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. DIRECTORY (servicios, profesionales, lugares, cursos…)
-- ============================================================
create table if not exists public.directory_items (
  id text primary key,
  cat text not null,
  title text not null,
  short_desc text,
  full_desc text,
  rating numeric(3,1) default 0,
  votes int default 0,
  country text,
  city text,
  deleg text,
  zone text,
  mode_kind text,
  stage text,
  phone text,
  whatsapp text,
  email text,
  site text,
  social text,
  hours text,
  address text,
  owner_text text,
  submitted_by text,
  extra text,
  img text,
  owner_user_id uuid references public.profiles(id) on delete set null,
  claimed_by_user_id uuid references public.profiles(id) on delete set null,
  status text default 'activa' check (status in ('activa','pendiente','con_sugerencias','archivada')),
  verified boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
create table if not exists public.products (
  id text primary key,
  cat text not null,
  title text not null,
  brand text,
  model text,
  short_desc text,
  full_desc text,
  rating numeric(3,1) default 0,
  votes int default 0,
  price text,
  approx text,
  where_buy text,
  link text,
  mx text,
  tech text,
  country text,
  city text,
  deleg text,
  zone text,
  img text,
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================================
-- 4. COMMUNITY ITEMS
-- ============================================================
create table if not exists public.community_items (
  id text primary key,
  cat text not null,
  type text not null,
  title text not null,
  short_desc text,
  full_desc text,
  user_alias text,
  country text,
  city text,
  deleg text,
  zone text,
  img text,
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. EVENTS
-- ============================================================
create table if not exists public.events (
  id text primary key,
  cat text not null,
  title text not null,
  short_desc text,
  full_desc text,
  event_date date,
  event_time time,
  mode_kind text,
  country text,
  city text,
  deleg text,
  zone text,
  address text,
  cost text,
  price text,
  organizer text,
  contact text,
  stage text,
  extra text,
  img text,
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================================
-- 6. SECONDHAND
-- ============================================================
create table if not exists public.secondhand_items (
  id text primary key,
  cat text not null,
  title text not null,
  brand text,
  model text,
  short_desc text,
  full_desc text,
  price text,
  state text,
  country text,
  city text,
  deleg text,
  zone text,
  available text default 'Disponible',
  extra text,
  user_alias text,
  img text,
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================================
-- 7. REVIEWS (polimórficas: directory + products)
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('directory','products')),
  target_id text not null,
  reviewer_user_id uuid references public.profiles(id) on delete cascade,
  r int not null check (r between 1 and 5),
  t text not null,
  price text,
  pros text,
  cons text,
  created_at timestamptz default now()
);

create index if not exists reviews_target_idx on public.reviews (target_type, target_id);

-- Trigger para actualizar rating y votes en la tabla destino
create or replace function public.update_target_rating()
returns trigger
language plpgsql
as $$
declare
  v_avg numeric;
  v_count int;
begin
  select coalesce(avg(r),0), count(*) into v_avg, v_count
  from public.reviews
  where target_type = coalesce(new.target_type, old.target_type)
    and target_id = coalesce(new.target_id, old.target_id);

  if coalesce(new.target_type, old.target_type) = 'directory' then
    update public.directory_items
       set rating = round(v_avg,1), votes = v_count
     where id = coalesce(new.target_id, old.target_id);
  else
    update public.products
       set rating = round(v_avg,1), votes = v_count
     where id = coalesce(new.target_id, old.target_id);
  end if;
  return null;
end;
$$;

drop trigger if exists reviews_rating_trg on public.reviews;
create trigger reviews_rating_trg
  after insert or update or delete on public.reviews
  for each row execute function public.update_target_rating();

-- ============================================================
-- 8. FAVORITES
-- ============================================================
create table if not exists public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  target_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, target_id)
);

create index if not exists favorites_target_idx on public.favorites (target_id);

-- ============================================================
-- 9. COMMENTS (community + secondhand)
-- ============================================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('community','secondhand')),
  target_id text not null,
  author_user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists comments_target_idx on public.comments (target_type, target_id);

-- ============================================================
-- 10. CONVERSATIONS + MESSAGES
-- ============================================================
create table if not exists public.conversations (
  id text primary key,
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  title text,
  context_id text,
  context_type text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

-- ============================================================
-- 11. SUGERENCIAS y REPORTES (admin)
-- ============================================================
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,        -- 'directory' | 'products' | ...
  target_id text,
  kind text not null check (kind in ('suggest','report','claim','contact')),
  reporter_user_id uuid references public.profiles(id) on delete set null,
  name text,
  email text,
  phone text,
  reason text,
  message text,
  status text default 'pendiente' check (status in ('pendiente','resuelta','desestimada')),
  created_at timestamptz default now()
);

-- ============================================================
-- 12. GRANTS (re-aplicados al final por si el schema fue dropeado y
--     se perdieron los defaults automáticos de Supabase)
-- ============================================================
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon;
grant all on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Refrescar el cache de PostgREST para que aplique de inmediato
notify pgrst, 'reload schema';
