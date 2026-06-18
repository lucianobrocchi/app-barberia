-- ════════════════════════════════════════════════════════════════
-- MULTI-TENANT · FASE 2 — ProfilePicker dinámico (one-tap + PIN por barbería)
-- Correr en Supabase → SQL Editor. Es ADITIVO: agrega funciones nuevas (v2) y
-- columnas; NO toca las funciones viejas, así la app actual no se rompe mientras
-- se despliega el cliente nuevo. (Las viejas se pueden borrar después.)
--
-- Modelo de auth elegido: one-tap + PIN. El acceso real lo cuidan el LOGIN DEL
-- LOCAL (usuario/contraseña de la barbería) y el PIN por barbero. Para el
-- one-tap, cada barbería tiene una "app_password" interna que solo se revela
-- tras presentar credenciales válidas del local (login_local_v2).
-- ════════════════════════════════════════════════════════════════

-- 1) Columnas nuevas en barbershops: clave interna del one-tap + logo.
alter table public.barbershops
  add column if not exists app_password text,
  add column if not exists logo_url text;

-- 2) login_local_v2: como login_local pero además devuelve la app_password, el
--    nombre y el logo. Security definer → no abre RLS al anon. Devuelve 0 filas
--    si las credenciales no coinciden.
create or replace function public.login_local_v2(p_usuario text, p_password_hash text)
returns table (barbershop_id uuid, app_password text, name text, logo_url text)
language sql
security definer
set search_path = public
as $$
  select id, app_password, name, logo_url
  from public.barbershops
  where usuario = p_usuario
    and password_hash = p_password_hash
  limit 1;
$$;
grant execute on function public.login_local_v2(text, text) to anon, authenticated;

-- 3) Perfiles de UNA barbería (scopeado) + email, para listar y firmar el
--    one-tap. Reemplaza al barberos_para_login() global (que devolvía TODOS los
--    perfiles de TODAS las barberías → fuga en multi-tenant). Nunca expone pin_hash.
create or replace function public.barberos_para_login_v2(p_barbershop_id uuid)
returns table (id uuid, full_name text, role public.user_role, is_active boolean, email text)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.full_name, p.role, p.is_active, u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.barbershop_id = p_barbershop_id;
$$;
grant execute on function public.barberos_para_login_v2(uuid) to anon, authenticated;

-- 4) Setear datos de Bacano para que siga andando con el cliente nuevo.
--    La app_password = la DEMO_PASSWORD actual ('AdDaApp2024!'), así los perfiles
--    existentes (creados con esa contraseña) loguean igual.
update public.barbershops
set app_password = 'AdDaApp2024!',
    logo_url     = '/logo-bacano.jpg'
where id = '8bc02018-0fa4-41a2-b24d-4d6c375caf3d';

-- Verificación rápida:
-- select * from public.login_local_v2('bacano', encode(digest('adda-bacano-local-v1' || 'bacano2026','sha256'),'hex'));
-- select * from public.barberos_para_login_v2('8bc02018-0fa4-41a2-b24d-4d6c375caf3d');
