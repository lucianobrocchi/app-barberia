-- ════════════════════════════════════════════════════════════════
-- PASO 5 — Migración: PIN por barbero
-- Correr en Supabase → SQL Editor (no se puede aplicar por PostgREST).
-- ════════════════════════════════════════════════════════════════

-- 1) Columna para el hash del PIN (4 dígitos, hasheado SHA-256 en el cliente).
--    NULL = el barbero todavía no tiene PIN configurado (entrada directa).
alter table profiles add column if not exists pin_hash text;

-- 2) Permitir que el DUEÑO actualice perfiles de SU barbería (para setear PINs).
--    La política existente "users_update_own_profile" solo deja editar el propio.
drop policy if exists "owners_update_barbershop_profiles" on profiles;
create policy "owners_update_barbershop_profiles" on profiles
  for update using (
    barbershop_id = public.user_barbershop_id()
    and public.user_role() = 'owner'
  );
