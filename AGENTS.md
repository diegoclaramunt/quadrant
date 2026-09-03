# Repository Working Agreement

Este repositorio trabaja en modo spec-first por defecto.

## Flujo obligatorio

1. Toda feature nueva y todo cambio no trivial empieza con una spec.
2. Las specs viven en `docs/specs/`.
3. No se implementa codigo hasta que exista la spec correspondiente.
4. Si durante la implementacion cambia el alcance o aparece una restriccion nueva, primero se actualiza la spec.
5. Toda implementacion debe referenciar la ruta de la spec fuente en el resumen de trabajo, commit o PR cuando aplique.
6. Antes de cerrar una tarea hay que verificar los criterios de aceptacion de la spec y ejecutar las validaciones relevantes.
7. No se permite ampliar alcance de forma silenciosa.

## Convencion de nombres para specs

Usar `YYYY-MM-DD-slug-corto.md` para nuevas specs mientras el repositorio no adopte otra convencion.

## Contenido minimo de una spec

Cada spec debe cubrir como minimo:

- contexto y problema
- goals
- non-goals
- user stories o escenarios
- functional requirements
- non-functional requirements
- technical approach
- impacted files o systems
- risks y open questions
- acceptance criteria
- rollout and validation
- test plan

## Spec fuente del MVP

La spec vigente del producto es `docs/specs/2026-09-03-quadrant-mvp.md`.

## Reglas de implementacion

- Implementar solo el comportamiento descrito en la spec fuente.
- Preferir cambios pequenos y revisables.
- No mezclar migraciones de stack, refactors amplios o limpieza general si la spec no lo pide.
- Mantener trazabilidad clara entre decision funcional, implementacion y validacion.
- JSON Schema es la fuente de verdad de los contratos publicos; los tipos TypeScript se generan desde `packages/capabilities/schemas`.
- `apps/api` y `apps/mcp` son adaptadores finos: validan, delegan en application y traducen el resultado. No contienen reglas de dominio.
- No estimar esfuerzo total ni representar progreso a partir de bloques.

## Comandos del repositorio

Stack: `Nx + Angular + NestJS + TypeScript + SQLite`, con adaptador MCP local.

- install: `npm install`
- typecheck: `npm run typecheck`
- frontend: `npm run serve:web`
- backend: `npm run serve:api`
- mcp: `npm run serve:mcp`
- test: `npm run test`
- lint: `npm run lint`
- build: `npm run build`
- format check: `npm run format:check`
- generar tipos: `npm run generate:types`

## Notas actuales

- Node 24 (ver `.nvmrc`). Usar Node de WSL, no shims de Windows.
- Los scripts Nx del repo usan `NX_ISOLATE_PLUGINS=false` para evitar fallos de plugin workers observados en WSL.
- Datos locales en `.data/quadrant.sqlite`.
- El core no depende de STT, TTS, un proveedor LLM ni de Nora.
