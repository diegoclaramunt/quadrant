# Quadrant — Captura de tareas por voz

- Status: Verifying
- Owner: Diego
- Date: 2026-09-06
- Fuente: solicitud de usar Quadrant como consumidor del runtime de voz y elección explícita de añadir directamente a la bandeja.

## Context and problem

Quadrant ya publica manifiesto y JSON Schema y ejecuta inbox.capture_many mediante QuadrantApp.invoke. Falta un adaptador de voz que convierta discurso libre en varias capturas sin duplicar contratos, dominio o integración OpenAI. Se conserva el trabajo local existente.

## Goals

- Hablar desde Capturar, sintetizar tareas y añadirlas directamente a bandeja mostrando títulos guardados.
- Probar @five/voice-runtime como dependencia externa con Angular/Nest y contratos JSON Schema existentes.
- Usar QuadrantApp.invoke para persistir y deduplicar, sin crear otro controlador de negocio.

## Non-goals

- Clasificar, planificar, completar, borrar, asociar proyectos o estimar esfuerzo mediante voz.
- Whisper, palabra de activación, control remoto, despliegue y migraciones de datos.
- Reformar el runtime o el stack de Quadrant; no modificar tareas existentes ni cargar datos reales durante las pruebas.

## User stories or scenarios

- «Tengo que llamar a Ana por el presupuesto y revisar la factura del taller» crea dos tareas con títulos breves.
- Detalles, plazos y referencias expresados se conservan en notas para procesarlos después. No se inventan clasificaciones ni se convierten fechas relativas automáticamente.
- Ante fallo de red se conserva el lote y se permite reintentar con el mismo request_id.

## Functional requirements

1. El micrófono solo se activa mediante Hablar. Terminar/cerrar/destruir el componente libera la sesión. La captura por texto sigue disponible.
2. El LLM separa tareas y redacta títulos accionables en español, conserva detalles y originalText como fragmento textual interpretado; no se promete transcripción literal certificada.
3. Solo se expone inbox.capture_many, proyectada desde su JSON Schema con title, notes y originalText. El adaptador fija channel=voice; request_id procede del transporte y se mantiene al reintentar. Ningún argumento permite alreadyProcessed ni clasificar.
4. Las tareas entran directamente en inbox, sin revisión ni confirmación adicional. El resultado visible usa tareas/IDs devueltos por Quadrant, no el texto del asistente. Solo status=ok permite confirmar guardado.
5. Publicar manifiesto de esta integración y generar herramientas mediante createToolSurface. Resolver las referencias JSON Schema locales antes de enviarlas al proveedor.
6. Crear sesiones con la entrada servidor del paquete y configuración OPENAI\_\* exclusiva de servidor. Ausencia de configuración o fallo del proveedor muestra error recuperable; nunca se expone la clave.
7. Conservar el lote ante respuesta incierta. Reintento explícito con ID y payload originales evita duplicados. No ejecutar más capturas mientras quede un lote pendiente de resolver.
8. Actualizar bandeja visible tras captura por voz, sin recargar la aplicación. Datos derivados de selección de voz no cambian las tareas ya existentes.

## Non-functional requirements

- UX Angular propia con estados accesibles, teclado, aviso de envío de audio a OpenAI y alternativa por texto.
- No persistir audio, tokens ni logs de conversación; originalText y notas forman parte de la tarea según el contrato existente.
- Reutilizar artefacto 0.1.1 original del runtime, sin variante específica ni imports a fuentes externas.
- Validación de argumentos en servidor y delegación al controlador transaccional existente.

## Technical approach

Proyección JSON Schema en capabilities a partir de inbox.capture_many y common.json; herramientas generadas con el runtime. Nest incorpora un adaptador fino de sesión SDP, manifiesto y captura de voz. Angular carga dinámicamente BrowserRealtimeSession, presenta estado y resultados e invoca el adaptador HTTP. Mantener request_id estable durante reintentos y refrescar la bandeja mediante evento del servicio API. Ajustes limitados de resolución de módulos para consumir el paquete ESM desde el build Nest.

## Impacted files or systems

- packages/capabilities: proyección del contrato y pruebas.
- apps/api: adaptador de voz y configuración servidor.
- apps/web: control de captura por voz, API cliente y actualización de bandeja.
- vendor, package.json/lock, README y .env.example.

## Risks and open questions

- La calidad real de síntesis requiere prueba hablada; los tests simulados solo verifican contrato y ejecución.
- Enviar una escritura y perder la respuesta no implica que se haya cancelado. Se conserva identidad del lote para recuperar el resultado.
- El servidor Nest consume ESM con webpack; verificar build y arranque real sin llamar a OpenAI.
- La clave se configura por el usuario; no se copian secretos de otros proyectos.

## Task checklist

- [x] Instalar artefacto original del runtime y comprobar su integridad.
- [x] Derivar manifiesto/esquema de captura y cubrir rechazo de campos ajenos.
- [x] Implementar adaptador Nest y probar captura transaccional/idempotencia.
- [x] Integrar UX Angular con estados, resultados y reintento.
- [x] Ejecutar pruebas, tipos, lint/build y documentar configuración.
- [ ] Registrar prueba hablada real por separado.

## Acceptance criteria

- [x] Un lote con varias tareas entra en inbox con channel=voice, títulos, notas y originalText conservados.
- [x] Repetir el mismo request_id/payload no duplica tareas; reutilizarlo con otros datos devuelve conflicto.
- [x] Voz no puede clasificar ni ejecutar capacidades distintas de captura.
- [x] No se solicita micrófono al cargar; terminar/cerrar libera sesión; fallos no se anuncian como éxito.
- [x] La UI muestra tareas devueltas y conserva lotes inciertos para reintento explícito.
- [x] El build no incluye claves y la API sin configuración rechaza apertura de sesión sin llamadas externas.

## Rollout and validation

Integración local, sin despliegue. Configurar OPENAI\_\* en servidor y arrancar con los comandos habituales. Pruebas con SQLite en memoria y transporte simulado; no crear tareas en la base del usuario. Mantener pendiente aceptación hablada si no se dispone de ella.

## Test plan

- Contrato: referencias resueltas, superficie acotada, campos extra rechazados.
- Aplicación/adaptador: captura múltiple, notas/origen, idempotencia y conflictos sobre SQLite en memoria.
- UI: inicio por gesto, cierre, resultados reales, fallo y reintento estable, conservación de texto.
- Tipos, lint, build API/web/MCP y validación de arranque local sin proveedor.

## Evidencia técnica — 2026-09-06

- Artefacto original 0.1.1: SHA-256 `d4948dada24cb919471e74f708c3e25486b116fa7a80354396ec4d5758b0485a`, idéntico al origen, sin parche de Quadrant.
- Preparación aislada y verificación en Quadrant: `npm run test`, `npm run build`, `npm run typecheck` correctos para los siete proyectos (tres builds). Pruebas específicas de capabilities: 12; API: 5; web incluye cinco nuevas regresiones de captura.
- La API compilada arranca con el runtime empaquetado y SQLite en memoria. Nueve comprobaciones HTTP correctas en `docs/validation/2026-09-06-voice-http.json`: descubrimiento, lote, origen/estado, notas, repetición, no duplicados, clasificación rechazada, clave ausente y origen ajeno rechazado. No hubo llamadas a OpenAI.
- El build Nest inicialmente convertía imports del paquete ESM a require; se ajustan moduleResolution y el empaquetado de esa dependencia, sin modificar el paquete.
- Lint global web mantiene un error previo en `apps/web/src/app/app.html:36` (interactive-supports-focus), además de advertencias previas en otras páginas. No se altera ese menú en esta integración. Los cambios nuevos pasan lint y formato dirigidos.
- Las tareas originales del usuario no se han usado en pruebas. Las escrituras de prueba se ejecutaron exclusivamente en SQLite en memoria.
- La síntesis real y la experiencia acústica siguen pendientes de aceptación con `OPENAI_API_KEY` configurada por el usuario; no se copian secretos de otros proyectos.
