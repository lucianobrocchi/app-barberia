-- ════════════════════════════════════════════════════════════════
-- ADDA App — SETUP COMPLETO en una Supabase NUEVA (de cero)
-- Correr TODO de una vez en: Dashboard → SQL Editor → New query → Run.
--
-- Incluye: esquema + índices + RLS + PIN por barbero + login del local +
-- Fase 2 multi-tenant (RPCs v2) + la barbería Bacano con credenciales +
-- servicios por defecto. NO crea los usuarios (eso lo hace el seed por
-- service-role: ver paso siguiente en HANDOFF / abajo).
--
-- Después de correr esto:
--   1) Crear .env.local con VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (del
--      proyecto nuevo) y correr:  npx tsx scripts/seed-demo-users.ts
--      (crea los usuarios auth + perfiles: dueño Juani + 6 barberos).
--   2) Apuntar la app: .env (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY) y las
--      env vars de Vercel al proyecto nuevo. Redeploy.
--   3) Cargar datos de demo desde Administración (quedan con fechas de hoy).
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── ENUMS ──
create type user_role as enum ('owner', 'barber');
create type payment_method as enum ('cash', 'mercadopago', 'transfer', 'other');
create type reservation_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- ── BARBERSHOPS (incluye login del local + clave interna + logo) ──
create table barbershops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  address text,
  phone text,
  timezone text default 'America/Argentina/Buenos_Aires',
  currency text default 'ARS',
  usuario text unique,
  password_hash text,
  app_password text,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── PROFILES (incluye pin_hash) ──
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  barbershop_id uuid references barbershops(id) on delete cascade not null,
  full_name text not null,
  role user_role not null,
  avatar_url text,
  phone text,
  is_active boolean default true,
  pin_hash text,
  created_at timestamptz default now()
);
create index idx_profiles_barbershop on profiles(barbershop_id);

-- ── SERVICES ──
create table services (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references barbershops(id) on delete cascade not null,
  name text not null,
  price numeric(10,2) not null,
  duration_minutes integer not null default 30,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);
create index idx_services_barbershop on services(barbershop_id) where is_active = true;

-- ── CLIENTS ──
create table clients (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references barbershops(id) on delete cascade not null,
  full_name text,
  phone text,
  notes text,
  created_at timestamptz default now(),
  unique (barbershop_id, phone)
);
create index idx_clients_barbershop on clients(barbershop_id);
create index idx_clients_phone on clients(phone) where phone is not null;

-- ── CUTS ──
create table cuts (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references barbershops(id) on delete cascade not null,
  barber_id uuid references profiles(id) not null,
  service_id uuid references services(id) not null,
  client_id uuid references clients(id) on delete set null,
  price numeric(10,2) not null,
  payment_method payment_method not null,
  notes text,
  performed_at timestamptz default now() not null,
  created_at timestamptz default now()
);
create index idx_cuts_barbershop_date on cuts(barbershop_id, performed_at desc);
create index idx_cuts_barber_date on cuts(barber_id, performed_at desc);

-- ── RESERVATIONS ──
create table reservations (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references barbershops(id) on delete cascade not null,
  barber_id uuid references profiles(id),
  service_id uuid references services(id) not null,
  client_id uuid references clients(id) on delete cascade not null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null,
  status reservation_status default 'pending',
  cut_id uuid references cuts(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);
create index idx_reservations_barbershop_date on reservations(barbershop_id, scheduled_at);
create index idx_reservations_barber_date on reservations(barber_id, scheduled_at) where barber_id is not null;

-- ── CASH REGISTER SESSIONS ──
create table cash_register_sessions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references barbershops(id) on delete cascade not null,
  opened_at timestamptz default now(),
  closed_at timestamptz,
  opened_by uuid references profiles(id),
  closed_by uuid references profiles(id),
  notes text
);

-- ── RLS ON ──
alter table barbershops enable row level security;
alter table profiles enable row level security;
alter table services enable row level security;
alter table clients enable row level security;
alter table cuts enable row level security;
alter table reservations enable row level security;
alter table cash_register_sessions enable row level security;

-- ── HELPER FUNCTIONS ──
create or replace function public.user_barbershop_id() returns uuid as $$
  select barbershop_id from public.profiles where id = auth.uid()
$$ language sql security definer stable;

create or replace function public.user_role() returns user_role as $$
  select role from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- ── RLS POLICIES — barbershops ──
create policy "owners_read_own_barbershop" on barbershops
  for select using (id = public.user_barbershop_id());

-- ── RLS POLICIES — profiles ──
create policy "users_read_own_barbershop_profiles" on profiles
  for select using (barbershop_id = public.user_barbershop_id());
create policy "users_update_own_profile" on profiles
  for update using (id = auth.uid());
create policy "owners_update_barbershop_profiles" on profiles
  for update using (
    barbershop_id = public.user_barbershop_id() and public.user_role() = 'owner'
  );

-- ── RLS POLICIES — services ──
create policy "tenants_isolation_select" on services
  for select using (barbershop_id = public.user_barbershop_id());
create policy "owners_manage_services" on services
  for all using (
    barbershop_id = public.user_barbershop_id() and public.user_role() = 'owner'
  );

-- ── RLS POLICIES — clients ──
create policy "tenants_isolation_select" on clients
  for select using (barbershop_id = public.user_barbershop_id());
create policy "barbers_manage_clients" on clients
  for insert with check (barbershop_id = public.user_barbershop_id());
create policy "owners_manage_clients" on clients
  for all using (
    barbershop_id = public.user_barbershop_id() and public.user_role() = 'owner'
  );

-- ── RLS POLICIES — cuts ──
create policy "tenants_isolation_select" on cuts
  for select using (barbershop_id = public.user_barbershop_id());
create policy "barbers_insert_own_cuts" on cuts
  for insert with check (
    barbershop_id = public.user_barbershop_id() and barber_id = auth.uid()
  );
create policy "barbers_update_own_cuts" on cuts
  for update using (
    barber_id = auth.uid() and performed_at > now() - interval '1 hour'
  );
create policy "owners_full_access_cuts" on cuts
  for all using (
    barbershop_id = public.user_barbershop_id() and public.user_role() = 'owner'
  );

-- ── RLS POLICIES — reservations ──
create policy "tenants_isolation_select" on reservations
  for select using (barbershop_id = public.user_barbershop_id());
create policy "barbers_manage_own_reservations" on reservations
  for all using (
    barbershop_id = public.user_barbershop_id() and (barber_id = auth.uid() or barber_id is null)
  );
create policy "owners_full_access_reservations" on reservations
  for all using (
    barbershop_id = public.user_barbershop_id() and public.user_role() = 'owner'
  );

-- ── RLS POLICIES — cash_register_sessions ──
create policy "tenants_isolation_select" on cash_register_sessions
  for select using (barbershop_id = public.user_barbershop_id());
create policy "owners_manage_cash_sessions" on cash_register_sessions
  for all using (
    barbershop_id = public.user_barbershop_id() and public.user_role() = 'owner'
  );

-- ── TRIGGER updated_at ──
create or replace function update_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
create trigger trg_barbershops_updated_at
  before update on barbershops for each row execute function update_updated_at();

-- ── RPCs de login (v1 + v2). v2 = multi-tenant (scopeado + email + clave interna) ──
create or replace function public.login_local(p_usuario text, p_password_hash text)
returns uuid language sql security definer set search_path = public as $$
  select id from public.barbershops
  where usuario = p_usuario and password_hash = p_password_hash limit 1;
$$;
grant execute on function public.login_local(text, text) to anon, authenticated;

create or replace function public.login_local_v2(p_usuario text, p_password_hash text)
returns table (barbershop_id uuid, app_password text, name text, logo_url text)
language sql security definer set search_path = public as $$
  select id, app_password, name, logo_url from public.barbershops
  where usuario = p_usuario and password_hash = p_password_hash limit 1;
$$;
grant execute on function public.login_local_v2(text, text) to anon, authenticated;

create or replace function public.barberos_para_login_v2(p_barbershop_id uuid)
returns table (id uuid, full_name text, role public.user_role, is_active boolean, email text)
language sql security definer stable set search_path = public as $$
  select p.id, p.full_name, p.role, p.is_active, u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.barbershop_id = p_barbershop_id;
$$;
grant execute on function public.barberos_para_login_v2(uuid) to anon, authenticated;

-- ════════════════════════════════════════════════════════════════
-- DATOS INICIALES — Barbería Bacano
-- usuario/contraseña del local: bacano / bacano2026
-- contraseña del dueño y one-tap (app_password): AdDaApp2024!
-- (mismo id que usa scripts/seed-demo-users.ts → el seed funciona tal cual)
-- ════════════════════════════════════════════════════════════════
insert into public.barbershops (id, name, slug, usuario, password_hash, app_password, logo_url)
values (
  '8bc02018-0fa4-41a2-b24d-4d6c375caf3d',
  'Barbería Bacano',
  'barberia-bacano',
  'bacano',
  encode(digest('adda-bacano-local-v1' || 'bacano2026', 'sha256'), 'hex'),
  'AdDaApp2024!',
  '/logo-bacano.jpg'
);

-- Servicios por defecto (editables después desde Administración).
insert into public.services (barbershop_id, name, price, display_order) values
  ('8bc02018-0fa4-41a2-b24d-4d6c375caf3d', 'Corte',          5000, 1),
  ('8bc02018-0fa4-41a2-b24d-4d6c375caf3d', 'Corte + Barba',  7000, 2),
  ('8bc02018-0fa4-41a2-b24d-4d6c375caf3d', 'Barba',          3500, 3),
  ('8bc02018-0fa4-41a2-b24d-4d6c375caf3d', 'Corte niño',     4500, 4),
  ('8bc02018-0fa4-41a2-b24d-4d6c375caf3d', 'Diseño / línea', 2500, 5);

-- Verificación:
-- select * from public.login_local_v2('bacano', encode(digest('adda-bacano-local-v1' || 'bacano2026','sha256'),'hex'));
-- (después del seed) select * from public.barberos_para_login_v2('8bc02018-0fa4-41a2-b24d-4d6c375caf3d');
