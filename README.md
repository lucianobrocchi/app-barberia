# ADDA App — Barbería Bacano

SaaS de gestión para barberías (cliente piloto: Barbería Bacano, La Plata).
App multi-barbero con panel de dueño (métricas, cierre de caja) y panel de
barbero (registro de cortes).

**Stack:** React 19 + Vite + TypeScript · Tailwind CSS · Supabase (Postgres +
Auth + Realtime) · Zustand · React Router · Framer Motion · date-fns.

**En producción:** https://adda-app-ten.vercel.app

---

## Cómo correr el proyecto localmente

Necesitás [Node.js](https://nodejs.org) instalado (versión 20 o superior).

### 1. Cloná el repo
```bash
git clone https://github.com/juancruzrabita-alt/adda-app.git
cd adda-app
```

### 2. Instalá las dependencias
```bash
npm install
```

### 3. Configurá las variables de entorno
Creá un archivo llamado `.env.local` en la raíz del proyecto con las claves de
Supabase. **Estas claves NO están en el repo** (por seguridad) — pediéselas a
Juani por un canal privado. El formato es:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
VITE_APP_NAME=ADDA App
```

> La variable `SUPABASE_SERVICE_ROLE_KEY` solo hace falta si vas a correr los
> scripts de la carpeta `scripts/` (seeds, ajustes de datos). Para trabajar en
> la app no la necesitás.

### 4. Arrancá el servidor de desarrollo
```bash
npm run dev
```
Abrí la URL que aparece (normalmente http://localhost:5173).

---

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila para producción (chequea tipos + bundle) |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Corre ESLint |

---

## Trabajar de a dos (flujo git)

```bash
git pull                 # antes de empezar, traé lo último
# ... editás ...
git add -A
git commit -m "qué cambiaste"
git push                 # subís tus cambios
```

Para cambios grandes, conviene una rama aparte:
```bash
git checkout -b mi-feature
# ... trabajás y commiteás ...
git push -u origin mi-feature
```
y después abrís un Pull Request en GitHub.

---

## Notas importantes

- **Base de datos compartida:** hoy la app local apunta a la MISMA base de
  Supabase que producción. Lo que toques (o los seeds que corras) afecta los
  datos reales. Tener cuidado con eso.
- **Las tablas de Supabase están en inglés:** `barbershops`, `profiles`,
  `cuts`, `services`, `cash_register_sessions`. No asumir nombres en español.
- **El proyecto está deployado en Vercel.** Re-deploy: `npx vercel --prod`.

## Estructura

```
src/
  app/            Router y providers
  features/
    auth/         Login del local, selector de perfiles, PIN
    barber/       Panel del barbero (registro de cortes)
    dashboard/    Panel del dueño (métricas, cierre de caja, administración)
  shared/         Tipos, cliente de Supabase, componentes y utilidades comunes
scripts/          Migraciones SQL y seeds (requieren SERVICE_ROLE_KEY)
```
