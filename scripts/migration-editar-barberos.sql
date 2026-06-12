-- ════════════════════════════════════════════════════════════════
-- Editar barberos: nombres en vivo en "¿Quién sos?" + ocultar inactivos
-- Correr en Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- La pantalla "¿Quién sos?" se muestra ANTES del login, así que no puede leer
-- la tabla `profiles` (RLS lo bloquea para anónimos). Esta función SECURITY
-- DEFINER devuelve SOLO nombre/rol/estado (nunca pin_hash) y se puede llamar
-- sin estar logueado. Así el selector muestra el nombre actual de cada barbero
-- (si el dueño lo renombró) y oculta a los desactivados.
create or replace function public.barberos_para_login()
returns table (id uuid, full_name text, role public.user_role, is_active boolean)
language sql
security definer
stable
as $$
  select id, full_name, role, is_active from public.profiles;
$$;

grant execute on function public.barberos_para_login() to anon, authenticated;
