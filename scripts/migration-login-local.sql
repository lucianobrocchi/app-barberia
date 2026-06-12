-- ============================================================
-- Login del local (pantalla previa al selector de perfiles)
-- Correr en Supabase SQL Editor.
--
-- ⚠️ La tabla real es "barbershops" (inglés). "barberías" NO existe.
--
-- Guardamos la contraseña HASHEADA (SHA-256 + salt), nunca en texto
-- plano — misma convención que el PIN de barberos (pin_hash).
-- La validación se hace vía RPC security definer (igual que
-- barberos_para_login), así el cliente anon nunca lee el hash.
-- ============================================================

-- 1. Columnas nuevas en barbershops
alter table public.barbershops
  add column if not exists usuario text unique,
  add column if not exists password_hash text;

-- 2. RPC de login: recibe usuario + hash calculado en el cliente,
--    devuelve el id de la barbería si coincide (o NULL si no).
--    security definer → no hace falta abrir RLS de barbershops al anon.
create or replace function public.login_local(p_usuario text, p_password_hash text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id
  from public.barbershops
  where usuario = p_usuario
    and password_hash = p_password_hash
  limit 1;
$$;

grant execute on function public.login_local(text, text) to anon, authenticated;

-- 3. Setear las credenciales de Barbería Bacano.
--    ⚠️ EDITAR antes de correr: reemplazá 'CAMBIAR-USUARIO' y
--    'CAMBIAR-PASSWORD' por los reales. El hash se calcula acá mismo
--    con pgcrypto (salt 'adda-bacano-local-v1' + password, SHA-256 hex,
--    idéntico a como lo calculará el frontend).
create extension if not exists pgcrypto;

update public.barbershops
set usuario = 'bacano',
    password_hash = encode(digest('adda-bacano-local-v1' || 'bacano2026', 'sha256'), 'hex')
where id = '8bc02018-0fa4-41a2-b24d-4d6c375caf3d';

-- Verificación rápida (debería devolver el id del local):
-- select public.login_local('bacano', encode(digest('adda-bacano-local-v1' || 'bacano2026', 'sha256'), 'hex'));
