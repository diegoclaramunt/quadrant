# Quadrant

Captura y priorización de tareas en una matriz de Eisenhower. La pantalla principal es el tablero (`/board`): una línea por tarea, sin fechas, y luego se coloca en su cuadrante (arrastrando, teclas 1–4 o tocándola). La planificación semanal por bloques sigue disponible en «Más».

Prototipo aprobado el 9-11-2026: https://claude.ai/artifact/2EphBG4BKm8KA4obCGQ2JB

Spec: `docs/specs/2026-09-03-quadrant-mvp.md`.

## Stack

- Nx 22 + Angular 21 + NestJS 11 + TypeScript
- SQLite local (`better-sqlite3`)
- Contratos públicos: manifiesto de capacidades + JSON Schema
- Adaptadores: HTTP (`apps/api`) y MCP (`apps/mcp`)

## Requisitos

- Node 24 (`nvm use`)
- npm 11+

## Arranque

```bash
nvm use
npm install
npm run serve:web
```

La web queda en `http://localhost:4200` y proxifica `/api` hacia `http://localhost:3000`.

## En el servidor de casa (truenas)

Stack de Dockge en `/mnt/data/apps/dockge/stacks/quadrant` (remoto git `truenas`, con `updateInstead`).
Un solo contenedor sirve la web y la API en http://192.168.1.38:3360; la base SQLite vive en
`/mnt/data/apps/quadrant/data`. Desplegar:

```bash
git push truenas main
ssh truenas 'cd /mnt/data/apps/dockge/stacks/quadrant && sudo docker compose up -d --build --wait'
```

La captura por voz está aparcada en la rama `voz-aparcada`; `main` no la incluye.

Servidor MCP (stdio):

```bash
npm run serve:mcp
```

## Validación

```bash
npm run lint
npm run test
npm run build
npm run typecheck
npm run format:check
```

En WSL los scripts ya fijan `NX_ISOLATE_PLUGINS=false`.

## Datos

La API crea `.data/quadrant.sqlite` al arrancar, aplica migraciones y siembra categorías sugeridas más la plantilla semanal predeterminada.
