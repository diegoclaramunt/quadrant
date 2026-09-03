# Quadrant

Captura, priorización y planificación por bloques. MVP local-first.

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
