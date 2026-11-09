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

## Capturar tareas por voz

La captura usa `@five/voice-runtime@0.1.1` como dependencia local original. No requiere arrancar la consola del runtime. Quadrant conserva sus contratos JSON Schema, su controlador y su UX Angular.

1. Copia `.env.example` a `.env` y configura `OPENAI_API_KEY` en el servidor. Los modelos y la voz se ajustan con las variables `OPENAI_*` del ejemplo. No copies la clave a código Angular.
2. Reinicia `npm run serve:web`, abre `http://localhost:4200`, pulsa **Capturar → Hablar** y permite el micrófono.
3. Dicta, por ejemplo: «Tengo que llamar a Ana por el presupuesto y revisar la factura del taller». El modelo sintetiza tareas y las añade directamente a la bandeja; el panel muestra los títulos devueltos por el servidor.

Las capturas conservan `channel=voice`, notas y el fragmento textual interpretado en `originalText`. Entran sin clasificar: urgencia, importancia, proyectos y planificación se deciden después. Terminar o cerrar el diálogo apaga el micrófono. La alternativa de texto permanece disponible. El audio se envía a OpenAI durante la conversación, con su facturación API; Quadrant no guarda audio. Para acceder desde otro dispositivo se necesita un contexto seguro HTTPS para el micrófono.

Si la conexión falla durante el guardado, **Reintentar guardado** recupera el mismo lote con su identificador original, sin duplicarlo. El lote pendiente se mantiene mientras la aplicación siga abierta, incluso al cerrar el diálogo; no se promete recuperarlo tras recargar la página. Cerrar la voz no revierte tareas ya guardadas.

El adaptador publica `/api/voice/manifest`, abre sesiones en `/api/voice/call` y delega `/api/voice/capture` en `QuadrantApp.invoke('inbox.capture_many', ...)`. Solo se expone captura. El esquema de voz se deriva del JSON Schema existente y resuelve sus referencias; el modelo no define el canal ni identificadores de reintento. El backend empaqueta las entradas ESM del runtime dentro de su salida CommonJS sin modificar el paquete.

Spec y validación: `docs/specs/2026-09-06-captura-voz.md`. Las pruebas automáticas usan transporte simulado y SQLite en memoria; la calidad de síntesis requiere una prueba hablada con la configuración del usuario.

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
