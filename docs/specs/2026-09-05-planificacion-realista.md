# Quadrant — Procesamiento sencillo y planificación realista

- Status: Verifying — implementación y recorrido en Chromium verificados; piloto de uso real pendiente
- Owner: Diego
- Date: 2026-09-05
- Related issue: N/A
- Spec fuente: `docs/specs/2026-09-03-quadrant-mvp.md`

## Context and problem

Quadrant busca convertir capturas desordenadas en compromisos semanales asumibles, incluyendo trabajo abierto sin estimación total. La spec del MVP define el funcionamiento, pero quedan hipótesis de uso por validar: coste de clasificación, comprensión de los tipos, disponibilidad real y protección de tareas importantes sin fecha.

La implementación inspeccionada ya ofrece tarjetas con atajos y valores predeterminados (`process.page.ts`), una plantilla de cinco horas por día laborable (`week.ts`) y planificación por fechas y cuadrantes (`planning.ts`). La UI muestra los tipos internos en inglés. La revisión descrita en la spec abre la semana actual incluso cuando se realiza al final de ella.

Esta propuesta fue aprobada por Diego el 2026-09-05 y complementa la spec fuente. Modifica explícitamente la revisión semanal (FR-27/28), añade reservas a la planificación (FR-30/31/32) y concreta la experiencia de procesamiento y ajuste semanal. Conserva la plantilla inicial, los tipos internos, sus duraciones y la separación entre ejecución y finalización.

## Goals

- Procesar una captura con pocas decisiones y contexto opcional accesible.
- Hacer comprensibles los tipos sin migrar el modelo de tareas.
- Revisar capacidad disponible antes de aceptar compromisos.
- Reservar atención para tareas importantes sin fecha.
- Preparar explícitamente la semana actual o siguiente sin ambigüedad.
- Validar utilidad personal mediante uso real, además de corrección técnica.

## Non-goals

- Integraciones de calendario, voz, proveedores LLM, nube o colaboración.
- Estimaciones totales, porcentajes de progreso, cronómetros o métricas de rendimiento personal.
- Cuotas automáticas por categoría, nuevos algoritmos de optimización o rediseño visual completo.
- Cambiar los identificadores `brief`, `short`, `deep`, `project` o flexibilizar su compatibilidad.
- Telemetría externa, un sistema de analítica o conclusiones sobre demanda comercial.

## User stories or scenarios

- Como usuario, quiero procesar una tarjeta sin asignarle proyecto ni fecha obligatoriamente.
- Como usuario, quiero distinguir una tarea de concentración de una sesión de trabajo abierto aunque ambas pertenezcan a un proyecto.
- Como usuario, quiero ajustar la semana tras descontar reuniones y obligaciones que Quadrant no conoce.
- Como usuario, quiero reservar un bloque para una tarea importante y dejar que la propuesta complete el resto.
- Como usuario, quiero cerrar el viernes y abrir el lunes siguiente, o hacer esa misma transición el lunes.

## Functional requirements

1. **FR-01 — Tarjeta sencilla.** Mostrar prioridad y tipo como controles principales; agrupar proyecto/categoría, fecha límite y notas en detalles opcionales. Mantener urgente=no, importante=sí y corta=30 minutos como valores iniciales visibles. Reinicializar el formulario para cada tarjeta usando sus datos existentes cuando los haya; no arrastrar elecciones de la tarjeta anterior.
2. **FR-02 — Nombres comprensibles.** Presentar `brief` como «Rápida · 10 min», `short` como «Corta · menos de 1 h», `deep` como «Concentración · un bloque» y `project` como «Sesión abierta · 2 h». Explicar que pertenecer a un proyecto es independiente del tipo y que ejecutar una sesión no completa la tarea. Usar las etiquetas consistentemente en procesamiento, backlog y planificación.
3. **FR-03 — Capacidad visible.** Mostrar minutos u horas nominales por día y total semanal al preparar la semana, y separar capacidad total, ocupación y capacidad libre. Sumar duración de slots para capacidad y bloques `planned`/`executed` para ocupación, sin contar dos veces un slot compartido. Etiquetar las cifras como nominales.
4. **FR-04 — Ajuste consciente.** Antes de la primera propuesta de una semana, presentar un paso de revisión de capacidad con edición de slots mediante las operaciones existentes y la indicación de descontar compromisos externos. Mantener visible que la plantilla inicial representa 25 horas semanales. No modificar la plantilla al ajustar la semana ni bloquear el trabajo manual por este paso de UI.
5. **FR-05 — Reservas explícitas.** Permitir seleccionar una tarea del backlog y un slot compatible como reserva dentro del borrador de propuesta. La UI puede facilitar encontrar tareas importantes sin fecha, pero la selección siempre es del usuario. Las reservas no crean bloques hasta aceptar el plan; el algoritmo las coloca primero y usa solo la capacidad restante para otras candidatas. Permitir quitarlas antes de aceptar.
6. **FR-06 — Propuesta explicable.** Mantener el orden por fechas, cuadrante y antigüedad para candidatas no reservadas. Definir fechas próximas como vencimientos dentro de la semana objetivo y priorizarlas junto a las vencidas, ordenadas por fecha ascendente; para el resto, ordenar por cuadrante, después fecha (ausente al final) y antigüedad, con ID estable como último desempate. Mostrar reservas, asignaciones propuestas, capacidad libre y motivos de exclusión. Señalar tareas vencidas o que vencen en la semana que quedan fuera, para que el usuario pueda revisar sus reservas.
7. **FR-07 — Fechas compatibles.** Evaluar disponibilidad frente a la fecha absoluta de cada slot, sin asignar a días pasados. Una tarea disponible el jueves puede ocupar el jueves o viernes de la semana objetivo aunque la propuesta se genere el lunes. Una tarea no colocable por disponibilidad debe mostrar ese motivo.
8. **FR-08 — Semana objetivo.** Añadir a `week.review` una fecha opcional `targetWeekStart` que sea lunes ISO de la semana actual o siguiente, según zona de instalación. Su ausencia conserva el destino actual para clientes existentes. La UI propone la siguiente de viernes a domingo y la actual de lunes a jueves, mostrando las fechas y permitiendo cambiar antes de ejecutar. Si existe semana abierta, el destino debe ser posterior a ella; rechazar el mismo destino o uno anterior sin cerrar nada. Si el destino ya existe, devolver `conflict` sin efectos parciales.
9. **FR-09 — Revisión atómica.** Cerrar y abrir en una sola transacción; marcar pendientes como `missed` y no reprogramar tareas automáticamente. Reactivar pospuestas cuya revisión vence hasta el lunes objetivo, conservando su origen. Preparar una semana futura no habilita ejecución de bloques antes de su día. Mantener una sola semana abierta y no crear semanas intermedias.
10. **FR-10 — Aceptación segura.** Revalidar reservas y asignaciones al aceptar: estado de tarea, disponibilidad, semana abierta, compatibilidad y capacidad. Ante cambios incompatibles devolver `conflict` sin aplicar parte del plan. La propuesta y sus reservas son inmutables: editar genera una propuesta nueva. Mantener idempotencia y paridad HTTP/MCP.

## Non-functional requirements

- Accesibilidad: controles y detalles utilizables con teclado, etiquetas legibles y errores asociados al campo correspondiente.
- Determinismo: mismas entradas y contexto producen mismas asignaciones y motivos.
- Privacidad: persistencia local y ninguna nueva comunicación externa.
- Compatibilidad: conservar tareas, plantillas, semanas y reportes históricos. Los nuevos campos de entrada son opcionales; los resultados ampliados deben quedar reflejados en los contratos.
- Atomicidad: revisión y aceptación no dejan semanas cerradas ni bloques parciales tras un fallo.
- Mantener JSON Schema como fuente de contratos y adaptadores sin reglas de dominio.

## Technical approach

1. Ampliar primero JSON Schemas y manifiesto para destino semanal y reservas opcionales `{taskId, slotId}` en `plan.propose`; regenerar tipos mediante el script del repositorio. Documentar los cambios de comportamiento de planificación en las descripciones de capacidades.
2. En dominio, normalizar fechas objetivo, calcular capacidad y resolver planificación: validar reservas, incluir ocupación existente, reservar capacidad y ordenar el resto. Rechazar reservas incompatibles o duplicadas sin crear propuestas parciales. Para tareas no `project`, respetar un único bloque pendiente también entre reservas y nuevas asignaciones.
3. En application, guardar la propuesta con sus reservas y motivos; validar el estado vigente antes de aceptar. Resolver cierre/apertura y reactivación de pospuestas usando el lunes objetivo dentro de la transacción.
4. Inspeccionar el formato de persistencia de propuestas antes de implementar. Añadir migración solo si los nuevos datos lo requieren; propuestas anteriores se leen con reservas vacías. No recalcular bloques históricos.
5. En web, introducir etiquetas compartidas, detalles de tarjeta, resumen de capacidad, fecha objetivo y selección de reservas en las páginas existentes. No crear una nueva sección de producto.

## Impacted files or systems

- `apps/web/src/app/pages/process.page.ts`, `backlog.page.ts`, `week.page.ts`, `templates.page.ts`: interacción y nombres visibles.
- `apps/web/src/app/quadrant-api.ts`: consumo de contratos ampliados.
- `apps/web/src/app/app.css`, `apps/web/src/styles.css`: límites de ancho para el recorrido responsive sin desbordamiento horizontal.
- `packages/domain/src/planning.ts`, `week.ts`, `types.ts`, `compatibility.ts`: propuestas, fechas, reservas y capacidad.
- `packages/application/src/app.ts`, `presenters.ts`: revisión, aceptación y resultados.
- `packages/capabilities/schemas/`, `manifest.json` y tipos generados: contratos públicos.
- `packages/storage/src/store.ts`, `migrations.ts`: persistencia compatible si resulta necesaria.
- Pruebas existentes de domain, application, storage, capabilities, web, API y MCP.

## Risks and open questions

- Se propone conservar importante=sí por defecto para limitar cambios. El piloto debe comprobar si hace que casi todo acabe en el mismo cuadrante; no se inferirá importancia desde texto.
- Las etiquetas aclaran los tipos pero mantienen la restricción de sesiones abiertas de dos horas. Si el piloto muestra incompatibilidad frecuente con la disponibilidad real, hará falta otra decisión de producto y spec.
- El paso de capacidad es una ayuda de UI; consumidores MCP deben consultar y ajustar slots explícitamente. No se añade un estado obligatorio de onboarding al dominio.
- Una reserva puede desplazar una fecha urgente. La propuesta lo explica y el usuario decide; no se garantiza cumplir todos los vencimientos.
- Preparar la siguiente semana el viernes cierra la actual inmediatamente. La UI debe mostrar este efecto antes de confirmar; tener dos semanas abiertas queda fuera de alcance.
- Se asume que posponer hasta una revisión permite reaparecer al preparar esa revisión anticipadamente. La disponibilidad por fecha sigue limitando la asignación.
- Se propone validar con uso personal durante dos semanas; duración y umbrales siguientes son hipótesis de evaluación, no resultados demostrados.

## Task checklist

- [x] Revisar contratos y ampliar esquemas, ejemplos y tipos.
  - Check: entradas anteriores válidas siguen aceptándose; fechas y reservas inválidas fallan de forma estructurada.
- [x] Implementar capacidad, prioridad y reservas en dominio.
  - Check: escenarios con fechas, reservas y slots compartidos producen asignaciones y sumas esperadas.
- [x] Implementar revisión con destino y aceptación atómica.
  - Check: viernes→lunes y lunes→semana actual funcionan; conflictos no dejan efectos parciales.
- [x] Adaptar las páginas existentes.
  - Check: recorrido por teclado desde tarjeta hasta propuesta aceptada, con etiquetas y fechas explícitas.
  - Pruebas de DOM y recorrido en Chromium aprobados: captura, procesamiento con teclado, navegación, reserva, cancelación y aceptación; recorrido equivalente con emulación táctil. Captura móvil revisada visualmente, sin desbordamiento a 390 px. No se ha probado un dispositivo físico.
- [x] Validar persistencia y paridad de adaptadores.
  - Check: reinicio conserva resultados y HTTP/MCP producen efectos equivalentes.
- [ ] Ejecutar validaciones y piloto personal.
  - Check: registrar comandos y resultados; separar criterios técnicos de observaciones de uso.
  - Pruebas, lint, tipos y build aprobados. Formato global afectado por un archivo previo ajeno al cambio; piloto de dos semanas pendiente.

## Acceptance criteria

- [x] Una tarjeta puede procesarse sin proyecto ni fecha y no hereda elecciones de la anterior.
- [x] Los cuatro tipos se muestran con nombres y ayudas que distinguen asociación a proyecto de sesión abierta.
- [x] La plantilla inicial muestra 5 horas por día y 25 por semana; eliminar un slot semanal cambia el resumen sin alterar la plantilla.
- [x] Dos tareas cortas de 30 minutos en un slot de 90 muestran 60 ocupados y 30 libres.
- [x] Una reserva compatible para una tarea importante sin fecha se conserva en la propuesta y no genera bloques antes de aceptar.
- [x] Reservas incompatibles se rechazan; una tarea urgente excluida por falta de capacidad aparece con motivo.
- [x] Las candidatas no reservadas cumplen el orden definido en FR-06, incluidas tareas sin fecha y empates.
- [x] Una tarea disponible el jueves no se asigna al lunes y puede asignarse al jueves; no se proponen días pasados.
- [x] Revisar el viernes hacia el lunes siguiente cierra la semana anterior, abre solo la elegida y no ejecuta bloques futuros.
- [x] Revisar el lunes con la semana anterior abierta abre la actual; elegir un destino inválido no cierra la anterior.
- [x] Una aceptación con capacidad modificada devuelve conflicto sin bloques parciales; reintentar una aceptación exitosa no duplica efectos.
- [x] Se preservan historial, duraciones nominales y finalización explícita, sin métricas de progreso.

Las marcas anteriores reflejan cobertura técnica automatizada y revisión de implementación, no una validación de utilidad personal ni de accesibilidad en dispositivos reales.

## Rollout and validation

Implementar únicamente tras aprobación explícita de esta spec. Primero validar con datos de prueba y copia de seguridad de la base local; probar migración si existe. Después realizar dos revisiones semanales con datos personales.

Para el piloto, anotar manualmente en una nota local elegida por el usuario: tiempo aproximado de procesamiento de diez capturas, asignaciones propuestas que se mantienen al aceptar y si una reserva ayudó a retomar trabajo importante sin fecha. Hipótesis iniciales: mediana de procesamiento inferior a 20 segundos, conservar al menos el 70 % de asignaciones sugeridas y poder identificar un caso útil de reserva. Son indicadores del flujo, nunca progreso de proyectos ni valoración del usuario; incumplirlos implica revisar el diseño, no añadir funciones automáticamente.

## Test plan

- Unitarias: orden de fechas y cuadrantes, empates sin fecha, sumas de capacidad, reservas y límites de compatibilidad, disponibilidad por slot y lunes objetivo en la zona configurada.
- Integración: revisión viernes/lunes, salto de semanas, destino ya existente, reactivación de pospuestas, rechazo de ejecución futura, aceptación tras cambios y rollback, idempotencia y persistencia tras reinicio.
- Contratos: ejemplos anteriores sin parámetros nuevos; nuevas entradas válidas e inválidas; equivalencia HTTP/MCP.
- UI/manual: reinicio de tarjeta, detalles opcionales, teclado, etiquetas, ajuste semanal y reserva/retirada/aceptación.
- Validación de implementación: `npm run generate:types`, `npm run typecheck`, `npm run test`, `npm run lint`, `npm run build` y `npm run format:check`.

## Implementation evidence — 2026-09-05

- Continuación: el recorrido en Chromium detectó que el atajo global Enter de procesamiento interceptaba enlaces de navegación. Se corrige dentro del requisito de accesibilidad: los enlaces y controles interactivos mantienen su acción nativa; sin tarjeta activa no se intercepta Enter. Se añade regresión y se repite el recorrido con teclado y emulación táctil.
- La emulación táctil a 390 px detectó un ancho de contenido de 568 px. Se acota el tamaño mínimo del contenedor y el ancho de los controles, y se muestran días en una columna en pantallas pequeñas. Es una corrección de legibilidad del flujo existente, sin rediseño de producto.

- Contratos publicados como manifiesto 1.1.0, con campos nuevos opcionales y tipos regenerados. `week.current` incluye fecha y zona de instalación para que la UI no dependa de la zona del navegador.
- Reservas persistidas dentro del JSON existente de propuestas; las propuestas anteriores se leen con reservas vacías. No fue necesaria migración ni se modificó la base de datos personal: las pruebas usaron memoria y bases temporales.
- Los ajustes rechazan modificar bloques con ocupación activa para conservar la duración y el historial; se pueden ajustar los bloques libres. La categoría directa se limpia al elegir proyecto.
- Una tarjeta aún sin tipo se considera sin clasificar y parte de importante=sí. Cuando ya tiene tipo se restauran sus valores guardados. No se arrastran valores entre tarjetas.
- Se completó el recorrido de navegador mediante Chromium con teclado y emulación táctil, sin afirmar validación en dispositivos físicos. El piloto sigue pendiente; antes de iniciarlo queda preparar una copia de seguridad de la base personal.

| Criterios (orden anterior) | Evidencia principal                                                                                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–2                        | `apps/web/src/app/pages/planning-flow.spec.ts`: teclado, restauración de valores, etiquetas y cancelación de archivo; etiquetas compartidas en procesamiento, backlog y semana.          |
| 3–4                        | `packages/application/src/realistic-planning.spec.ts`: 1500 min semanales, 300 diarios y aislamiento de plantilla; pruebas de dominio y DOM para 60 min ocupados y 30 libres en un slot. |
| 5–6                        | Pruebas de application para reserva prioritaria, ausencia de bloques antes de aceptar y tarea con vencimiento excluida; DOM para añadir, quitar y conservar propuesta tras cancelar.     |
| 7–8                        | `packages/domain/src/domain.spec.ts`: orden determinista con fechas ausentes y empates; application verifica disponibilidad del jueves y exclusión de días pasados.                      |
| 9–10                       | Application: viernes→lunes, ejecución futura rechazada, reactivación de inbox/backlog, salto de semanas y rollback con plantilla o destino inválidos.                                    |
| 11–12                      | Application: aceptación atómica tras cambio de duración, reintento idempotente, persistencia de reservas, compatibilidad de payload antiguo y reporte nominal sin completar tarea.       |

También pasan las pruebas de adaptadores: controlador HTTP y cliente MCP mediante transporte en memoria conservan los mismos resultados que application para reservas, destino y aceptación.

Validaciones ejecutadas: `npm run generate:schemas`, `npm run generate:types`, `npm run test` (los siete proyectos), `npm run lint`, `npm run typecheck` y `npm run build` (web/API/MCP), todas correctas. La suite web se comprobó también con `nx test web --watch=false` y las suites de adaptadores con Jest directamente.

`npm run format:check` detecta una incidencia preexistente en `tools/patch-nx-serve.mjs:1`: `import fs from " node:fs;` es una cadena sin cerrar. El mismo contenido está en HEAD; se conserva por estar fuera de alcance. El formato de los archivos de esta implementación se verifica por separado con Prettier y `git diff --check`.

### Verificación de navegador y correcciones del cierre

Se reutilizaron Chromium y Playwright ya instalados, sin añadir dependencias. La prueba sirvió el build de producción y la API contra una base SQLite temporal. Pasó el recorrido de captura → procesamiento → navegación con Enter → revisión → reserva → cancelación de confirmación → aceptación; la API confirmó dos bloques y 120 minutos nominales ocupados. El recorrido táctil añadió otra tarea y una reserva aceptada, dejando tres bloques.

Se corrigieron dos incidencias del requisito de accesibilidad: el atajo Enter ya no intercepta enlaces ni se activa sin tarjeta, y los formularios mantienen el ancho de la pantalla. La emulación de 390 × 844 verificó `innerWidth = scrollWidth = 390`; antes de corregir era 568. Los días usan una columna hasta 600 px.

Evidencia temporal de esta ejecución: `/tmp/quadrant-browser-validation.cjs` y `/tmp/quadrant-browser-07d6KA/mobile-week.png`. La imagen fue inspeccionada. Las pruebas permanentes de DOM en `planning-flow.spec.ts` cubren enlaces, combinaciones con modificadores y bandeja vacía; la medición de layout requiere navegador real. La base personal permaneció intacta.
