-- ============================================================
--  Águas Tranquilas — schema do Supabase
--  Cole TODO este arquivo no Supabase > SQL Editor e rode (Run).
--  Pode rodar de novo com segurança (usa IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ---------- Tabelas ----------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  is_admin    boolean not null default false,
  reminder    text not null default '06:30',
  created_at  timestamptz not null default now()
);

create table if not exists public.progress (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  streak        integer not null default 0,
  longest       integer not null default 0,
  total         integer not null default 0,
  last_prayed   date,
  candle_lit_at timestamptz,
  updated_at    timestamptz not null default now()
);

create table if not exists public.prayed_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  primary key (user_id, day)
);

create table if not exists public.reflections (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  body    text not null default '',
  primary key (user_id, day)
);

create table if not exists public.prayer_requests (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  answered    boolean not null default false,
  answered_at timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.community_posts (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,
  name       text not null default 'Anônimo',
  body       text not null,
  status     text not null default 'pending' check (status in ('pending','approved','rejected')),
  amens      integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.community_amens (
  post_id bigint not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);

-- Acesso por assinatura. É escrito pelo webhook da Greenn (service_role).
create table if not exists public.access (
  email      text primary key,
  active     boolean not null default false,
  source     text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_status on public.community_posts(status, created_at desc);

-- ---------- Funções ----------

-- true se o usuário logado é admin (você)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin);
$$;

-- Ao criar um usuário novo (signup), cria profile + progress + access(inativo)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
    values (new.id, coalesce(new.raw_user_meta_data->>'name',''))
    on conflict (id) do nothing;
  insert into public.progress (user_id) values (new.id)
    on conflict (user_id) do nothing;
  insert into public.access (email, active, source)
    values (lower(new.email), false, 'signup')
    on conflict (email) do nothing;  -- se o webhook já criou (compra antes do cadastro), mantém o status
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impede usuário comum de se tornar admin sozinho
create or replace function public.guard_profile_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_admin on public.profiles;
create trigger trg_guard_admin
  before update on public.profiles
  for each row execute function public.guard_profile_admin();

-- Mantém a contagem de améns sincronizada
create or replace function public.sync_amens()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid bigint;
begin
  pid := coalesce(new.post_id, old.post_id);
  update public.community_posts
     set amens = (select count(*) from public.community_amens where post_id = pid)
   where id = pid;
  return null;
end;
$$;

drop trigger if exists trg_amens on public.community_amens;
create trigger trg_amens
  after insert or delete on public.community_amens
  for each row execute function public.sync_amens();

-- Dar / tirar "Amém" num post. Retorna a nova contagem e o estado.
create or replace function public.toggle_amen(p_post_id bigint)
returns table (amens integer, amened boolean)
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from public.community_amens where post_id = p_post_id and user_id = uid) then
    delete from public.community_amens where post_id = p_post_id and user_id = uid;
    return query select cp.amens, false from public.community_posts cp where cp.id = p_post_id;
  else
    insert into public.community_amens (post_id, user_id) values (p_post_id, uid);
    return query select cp.amens, true from public.community_posts cp where cp.id = p_post_id;
  end if;
end;
$$;

grant execute on function public.toggle_amen(bigint) to authenticated;

-- ---------- RLS (Row Level Security) ----------

alter table public.profiles         enable row level security;
alter table public.progress         enable row level security;
alter table public.prayed_days      enable row level security;
alter table public.reflections      enable row level security;
alter table public.prayer_requests  enable row level security;
alter table public.community_posts  enable row level security;
alter table public.community_amens  enable row level security;
alter table public.access           enable row level security;

-- profiles
drop policy if exists profiles_sel on public.profiles;
create policy profiles_sel on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_ins on public.profiles;
create policy profiles_ins on public.profiles for insert with check (id = auth.uid());
drop policy if exists profiles_upd on public.profiles;
create policy profiles_upd on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- progress
drop policy if exists progress_all on public.progress;
create policy progress_all on public.progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- prayed_days
drop policy if exists prayed_all on public.prayed_days;
create policy prayed_all on public.prayed_days for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reflections
drop policy if exists refl_all on public.reflections;
create policy refl_all on public.reflections for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- prayer_requests
drop policy if exists req_all on public.prayer_requests;
create policy req_all on public.prayer_requests for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- community_posts
drop policy if exists posts_sel on public.community_posts;
create policy posts_sel on public.community_posts for select
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());
drop policy if exists posts_ins on public.community_posts;
create policy posts_ins on public.community_posts for insert
  with check (user_id = auth.uid() and status = 'pending');
drop policy if exists posts_upd on public.community_posts;
create policy posts_upd on public.community_posts for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists posts_del on public.community_posts;
create policy posts_del on public.community_posts for delete using (user_id = auth.uid() or public.is_admin());

-- community_amens (o toggle_amen já cuida; estas permitem ler o próprio estado)
drop policy if exists amens_sel on public.community_amens;
create policy amens_sel on public.community_amens for select using (user_id = auth.uid());
drop policy if exists amens_ins on public.community_amens;
create policy amens_ins on public.community_amens for insert with check (user_id = auth.uid());
drop policy if exists amens_del on public.community_amens;
create policy amens_del on public.community_amens for delete using (user_id = auth.uid());

-- access: o usuário só enxerga o próprio acesso; escrita é só via service_role (webhook)
drop policy if exists access_sel on public.access;
create policy access_sel on public.access for select using (lower(email) = lower(auth.jwt() ->> 'email'));

-- ---------- Seed opcional do mural (apague quando quiser) ----------
insert into public.community_posts (user_id, name, body, status, amens) values
  (null, 'Maria', 'Orem pela saúde da minha mãe, ela faz uma cirurgia amanhã.', 'approved', 34),
  (null, 'James', 'Gratidão — consegui um emprego depois de meses tentando. Deus é fiel.', 'approved', 58),
  (null, 'Lúcia', 'Paz na minha família. Estamos passando por um momento difícil.', 'approved', 27)
on conflict do nothing;

-- ============================================================
--  DEPOIS de fazer seu primeiro login no app, rode UMA VEZ,
--  trocando pelo seu e-mail, para virar admin e liberar seu acesso:
--
--  update public.profiles set is_admin = true
--    where id = (select id from auth.users where email = 'SEU-EMAIL@exemplo.com');
--  insert into public.access (email, active, source)
--    values ('SEU-EMAIL@exemplo.com', true, 'manual')
--    on conflict (email) do update set active = true;
-- ============================================================
