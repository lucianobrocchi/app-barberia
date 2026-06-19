# Handoff — Estado de la app (para seguir el desarrollo)

App de gestión para barberías (Vite + React 19 + Supabase + Tailwind + framer-motion).
Hoy corre para **Barbería Bacano**; el objetivo es volverla **SaaS multi-barbería vendible**.

- **Repo de trabajo**: `lucianobrocchi/app-barberia` (privado). Deploya solo a Vercel: **https://app-barberia-red.vercel.app/**
- **Supabase**: proyecto `xoqalcgrwrwxikqkhapp` (lo administra rabita). El `.env` (no commiteado) necesita `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. En Vercel ya están seteadas.
- Correr local: `npm install` → crear `.env` con esas dos vars → `npm run dev` (puerto 5174).

## ⚠️ Lo primero a hacer (Fase 2 multi-tenant, en esta branch)

Esta branch `feat/multi-tenant-fase2` **des-hardcodea la barbería**: el selector de perfiles y la marca pasan a salir de la base en vez de estar fijos a Bacano. **No se mergeó a main porque depende de una migración que hay que correr ANTES**, o la app en vivo se rompe.

**Pasos (en orden):**
1. Correr en Supabase → SQL Editor el archivo [`scripts/migration-multitenant-fase2.sql`](scripts/migration-multitenant-fase2.sql). Es aditivo (no rompe lo actual): agrega `login_local_v2`, `barberos_para_login_v2`, columnas `app_password`/`logo_url`, y setea los datos de Bacano.
2. Verificar que los RPC responden (hay queries de verificación al final del .sql).
3. Mergear esta branch a `main` → Vercel deploya solo.
4. Probar: login del local (`bacano` / `bacano2026`) → el selector debe mostrar los perfiles de Bacano traídos de la base, y el header la marca real.

Si la app queda en blanco tras deployar sin la migración: faltan los RPC. Correr la migración y redeployar.

## Qué se construyó (ya en `main`, desplegado)

- **Onboarding** de bienvenida en el selector de perfil (`src/features/onboarding/`).
- **Datos de demo**: desde *Administración*, cargar/limpiar ~3 meses de cortes de ejemplo (`src/features/demo/`). Corre client-side (la policy `owners_full_access_cuts` da acceso total al dueño sobre `cuts`).
- **Deep-dive del Mes** (`DashboardPage`, pestaña Mes): proyección del mes en curso, gráfico de facturación día por día **interactivo** (tap a un día → detalle), hora pico y servicios top (`MonthProjection`, `MonthChart`).
- **Récords y rachas** del dueño (`RecordsPanel` + `useRecords`, histórico 180 días) y **podio** oro/plata/bronce en el ranking de barberos (`BarberPerformance`).
- **Panel del barbero** (`BarberHomePage`): su semana en gráfico, su puesto/ranking en el local (`useBarberRanking` + `BarberRankCard`), y sus récords. Dejó de ser "solo registrar".
- **Fase 1 multi-tenant** (ya en main): `useBarbershop` lee el nombre del tenant; los headers muestran la marca real (no "Bacano" hardcodeado).

## Decisiones tomadas

- **Multi-tenant en una sola Supabase**: cada barbería = fila en `barbershops`, aislada por `barbershop_id` con RLS. La base ya está diseñada así.
- **Modelo de auth = one-tap + PIN** (generalizado por barbería). El acceso real lo cuidan el login del local (usuario/contraseña por barbería) + el PIN de cada barbero. La `app_password` por barbería es plomería interna para el one-tap (nadie la tipea). El dueño entra con su contraseña.
- ⚠️ La vieja `barberos_para_login()` devolvía TODOS los perfiles de TODAS las barberías (fuga en multi-tenant). La v2 está scopeada por `barbershop_id`.

## Roadmap pendiente

- **Fase 3 — Provisioning / panel de gestión**: alta y gestión de barberías clientes, y que cada dueño agregue/quite barberos. Necesita **backend seguro** (Edge Function con service-role) porque crear/borrar usuarios auth no se puede desde el cliente anon. Editar/desactivar barberos ya funciona en *Administración*.
- **Demo auto-fresh**: las fechas de la demo se hornean al seedear y envejecen. Falta un job programado (cron/Edge Function) que recargue una barbería demo con fechas de hoy. (Hoy la data de demo está vieja: último corte ~14/6.)
- **Simplificar credenciales**: dejar la `app_password` invisible y que el dueño tenga su propia contraseña cambiable (hoy comparte la interna).

## Notas técnicas

- **StrictMode + framer-motion**: `AnimatePresence mode="wait"` se traba en dev. Para transiciones, animar la entrada re-montando un `motion.div` por `key` (ver `MonthChart`, `Onboarding`).
- **Lint**: hay errores pre-existentes de React Compiler (`set-state-in-effect`, `preserve-manual-memoization`) en los hooks de fetch — patrón de todo el proyecto, no bloquean build ni dev.
- Bundle ~236KB gzip — se puede code-splitear más adelante.
