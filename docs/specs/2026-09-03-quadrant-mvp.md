# MVP — Quadrant: captura, priorización y planificación por bloques

- Status: Draft
- Owner: Diego
- Date: 2026-09-03
- Related issue: N/A
- Supersedes: `2026-09-02-quadrant-local-project.md` (bootstrap del repositorio absorbido en el hito H1)

## Context and problem

El usuario gestiona trabajo de varias áreas —Warpcom, Five, proyectos vendibles y proyectos personales— con varios proyectos por categoría, tareas asociadas a proyectos y tareas independientes. Las ideas y tareas llegan de forma desordenada, a menudo mediante voz, y necesitan un recorrido sencillo desde la captura hasta una planificación diaria realista.

Las herramientas tradicionales mezclan captura, progreso, estimación y calendario. Quadrant debe centrarse en cuatro decisiones: qué es cada elemento, si es urgente o importante, qué clase de bloque necesita y cuándo merece ocupar capacidad semanal. Los proyectos grandes deben permanecer deliberadamente abstractos: no se estimará su esfuerzo total ni se representará un porcentaje de progreso.

Además, Quadrant debe poder ser operado desde distintas interfaces. La aplicación visual, un LLM, una skill, un comando de voz o Nora deben invocar las mismas capacidades mediante contratos estables. Nora mantiene como principio arquitectónico un monolito modular con adaptadores reemplazables; Quadrant debe ser compatible con ese enfoque sin depender de su proveedor de voz ni de su implementación interna.

## Goals

- Capturar cualquier idea o tarea en una bandeja de entrada única.
- Organizar proyectos por categorías y permitir tareas sin proyecto.
- Procesar la bandeja mediante una experiencia rápida tipo tarjetas y matriz de Eisenhower.
- Mantener un backlog de tareas procesadas que pueden planificarse ahora o más adelante.
- Crear semanas a partir de plantillas reutilizables y permitir ajustes exclusivos de cada semana.
- Producir una planificación diaria basada en prioridad, fechas y compatibilidad con bloques disponibles.
- Gestionar proyectos abiertos mediante bloques nominales de dos horas, sin estimación total ni representación de progreso.
- Registrar bloques ejecutados y generar reportes nominales por tarea, proyecto y categoría.
- Exponer las capacidades mediante un manifiesto versionado y un adaptador MCP o equivalente, reutilizable por Nora, LLM, skills y comandos de voz.

## Non-goals

- Implementar captura de audio, STT, TTS, palabra de activación o experiencia conversacional propia de Nora.
- Interpretar el tiempo acumulado como porcentaje, etapa o progreso de una tarea.
- Estimar el esfuerzo total o el tiempo restante de proyectos y tareas de proyecto.
- Incorporar un cronómetro, seguimiento de tiempo real o facturación por horas.
- Sincronizar con calendarios externos, correo, gestores de tareas o dispositivos múltiples.
- Soportar colaboración multiusuario, organizaciones, permisos avanzados o sincronización cloud.
- Reprogramar automáticamente tareas abiertas sin una decisión de planificación.
- Eliminar automáticamente tareas pospuestas; el MVP solo sugerirá archivarlas.
- Gestionar tareas recurrentes o repetitivas; cada ocurrencia se captura como una tarea independiente.

## User stories or scenarios

- Como usuario, quiero volcar por voz o texto varias ideas para que todas entren en la bandeja sin obligarme a clasificarlas durante la captura.
- Como usuario, quiero revisar una tarjeta cada vez y decidir importancia, urgencia, tipo de trabajo y contexto para vaciar la bandeja con poca fricción.
- Como usuario, quiero asociar proyectos a categorías y conservar tareas que no pertenecen a ningún proyecto.
- Como usuario, quiero que una tarea procesada salga de la bandeja aunque todavía no tenga una semana asignada.
- Como usuario, quiero posponer un elemento hasta una revisión semanal futura y recibir una sugerencia de archivo tras cuatro posposiciones consecutivas.
- Como usuario, quiero abrir una semana copiando una plantilla, ajustarla para esa semana y conservar intacta la plantilla original.
- Como usuario, quiero disponer por defecto de dos bloques profundos y un bloque de proyecto por día activo.
- Como usuario, quiero trabajar dos horas nominales en “Gemelo digital”, registrar ese bloque y mantener la tarea abierta hasta que decida completarla.
- Como usuario, quiero que una tarea abierta al cerrar la semana siga en el backlog para decidir si debe planificarse de nuevo.
- Como usuario, quiero pedir por voz “pon Gemelo digital en un bloque de proyecto mañana” y obtener el mismo resultado que desde la interfaz visual.
- Como usuario, quiero consultar cuántos bloques y horas nominales he dedicado a una tarea, proyecto o categoría.

## Domain model and terminology

### Category

Agrupa proyectos en un área de actividad. Las categorías iniciales sugeridas son Warpcom, Five, Proyectos vendibles y Proyectos personales, pero deben ser editables y no deben estar codificadas en el dominio.

### Project

Pertenece a una categoría y agrupa tareas. Un proyecto puede permanecer abierto indefinidamente y acumular bloques ejecutados sin estimación de esfuerzo total.

### Task

Unidad gestionable que puede pertenecer a un proyecto o existir sin proyecto. Si pertenece a un proyecto, hereda su categoría para filtros y reportes. Una tarea sin proyecto puede tener categoría directa opcional.

Invariante: una tarea con proyecto no puede tener categoría directa; su categoría efectiva es siempre la del proyecto. Al asociar una tarea a un proyecto se descarta la categoría directa.

Campos mínimos:

- identificador estable;
- título y notas opcionales;
- proyecto opcional y categoría efectiva;
- estado de ciclo de vida;
- urgente: sí/no;
- importante: sí/no;
- tipo de trabajo;
- duración nominal (solo para `short`; ver tipos de trabajo);
- fecha límite opcional;
- fecha de disponibilidad o revisión opcional;
- fechas de creación, actualización, finalización y archivo.

El contador de posposiciones consecutivas se deriva del historial de posposiciones y no se almacena como campo independiente.

No tendrá porcentaje, etapa, puntos completados, estimación total ni tiempo restante.

### Work type

- `brief`: tarea tan breve que gestionarla cuesta aproximadamente lo mismo que ejecutarla; duración nominal fija de 10 minutos. Puede completarse directamente sin planificar o agruparse en un slot `deep`.
- `short`: tarea de menos de una hora. Su duración nominal se declara al procesarla; por defecto 30 minutos.
- `deep`: trabajo concentrado de entre una y dos horas; ocupa un slot `deep` completo y toma su duración del slot.
- `project`: trabajo abierto que se agenda en sesiones nominales fijas de 120 minutos.

La duración de un slot `deep` procede de la plantilla o del ajuste semanal: 90 minutos por defecto, configurable entre 60 y 120. Para `project`, la duración nominal siempre es 120 minutos en el MVP.

### Slot compatibility

| Slot      | Admite                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| `project` | exactamente una tarea `project`                                                                                    |
| `deep`    | exactamente una tarea `deep`, **o** varias tareas `short`/`brief` cuya suma nominal no supere la duración del slot |

Un slot `deep` no mezcla una tarea `deep` con tareas `short`/`brief`. Un slot ya ocupado por una `deep` o una `project` no admite más bloques (sin doble reserva). Una tarea no `project` no puede tener más de un bloque `planned` simultáneo.

### Inbox

Contiene elementos todavía no procesados. Toda captura nueva entra aquí, independientemente del canal de origen.

### Backlog

Contiene tareas abiertas que ya fueron procesadas y están listas para planificarse, aunque no tengan que tocarse en la semana actual.

### Week template

Define días activos, slots disponibles, tipo y duración de cada slot, y su orden u horario. Es reutilizable y no cambia cuando se modifica una semana ya creada.

### Week plan

Es una copia inmutable en origen de la plantilla elegida. Sus ajustes solo afectan a esa semana. Contiene slots y asignaciones de tareas.

Solo puede existir una semana abierta a la vez. Las semanas empiezan en lunes (ISO 8601). No se crean semanas intermedias vacías cuando pasan varias semanas sin revisión.

### Work block

Sesión planificada dentro de un slot semanal. Tiene estados:

- `planned`: asignado y pendiente.
- `executed`: el usuario lo marcó como realizado. Es el único estado que suma tiempo nominal en reportes.
- `cancelled`: el usuario lo canceló explícitamente.
- `missed`: seguía `planned` al cerrar la semana; lo asigna el cierre semanal automáticamente.

Ejecutar un bloque no completa automáticamente la tarea asociada.

### Time model

- `deadline` y fecha de disponibilidad son fechas de calendario sin hora (`YYYY-MM-DD`).
- Los slots tienen día y orden; la hora de inicio es opcional.
- La zona horaria es una configuración única de la instalación (por defecto la del sistema). El core la usa para resolver “hoy”, “mañana” y el inicio de semana. Los adaptadores envían siempre fechas absolutas en ISO 8601; la resolución de expresiones relativas en lenguaje natural corresponde al adaptador, que puede consultar la zona horaria configurada.

### Task lifecycle

```text
capture
  → inbox
      ├─ process → backlog
      ├─ postpone → snoozed (origen: inbox) → inbox en la revisión elegida
      └─ archive (confirmación explícita)

backlog
  ├─ schedule → bloque planned en week plan (la tarea sigue en backlog)
  ├─ postpone → snoozed (origen: backlog) → backlog en la revisión elegida
  ├─ complete → completed
  └─ archive (confirmación explícita)

archived
  └─ unarchive → estado previo (inbox o backlog)

week close
  ├─ bloques planned → missed
  ├─ tarea completada → completed (sin cambio)
  └─ tarea todavía abierta → permanece en backlog
```

La asignación a una semana no sustituye el estado de ciclo de vida. Una tarea puede estar en backlog y tener uno o más bloques planificados. Una tarea `snoozed` conserva su estado de origen y vuelve a él cuando vence la posposición.

## Functional requirements

### Capture and inbox

1. **FR-01** Toda tarea creada desde UI, API, MCP, skill o voz debe entrar en `inbox` salvo que la operación solicite explícitamente crearla ya procesada.
2. **FR-02** El sistema debe aceptar captura individual y captura por lotes, conservando el texto original y el canal de origen.
3. **FR-03** El core debe recibir elementos estructurados; la separación de un discurso libre en varias tareas corresponde al adaptador LLM o de voz.
4. **FR-04** La interfaz debe mostrar la bandeja en orden de captura y permitir abrir una tarjeta cada vez.

### Categories, projects and tasks

5. **FR-05** El usuario debe poder crear, renombrar, archivar y desarchivar categorías.
6. **FR-06** El usuario debe poder crear, renombrar, archivar y desarchivar proyectos asociados a una categoría.
7. **FR-07** Una tarea debe poder asociarse a un proyecto, cambiar de proyecto o permanecer sin proyecto, respetando el invariante de categoría efectiva.
8. **FR-08** Archivar una categoría o proyecto no debe eliminar sus tareas ni su historial de bloques. Sus tareas abiertas quedan ocultas de inbox, backlog y planificación, no admiten nuevos bloques, siguen contando en reportes históricos y vuelven a ser visibles al desarchivar el padre.

### Processing and Eisenhower classification

9. **FR-09** Procesar una tarea debe permitir definir urgente, importante, tipo de trabajo, duración nominal (si es `short`), fecha límite opcional y proyecto o categoría opcionales.
10. **FR-10** Al procesarse, la tarea debe salir de la bandeja y entrar en el backlog, esté o no planificada para una semana.
11. **FR-11** La UI de procesamiento debe ofrecer una interacción rápida tipo tarjetas y permitir corregir cualquier clasificación propuesta.
12. **FR-12** El sistema debe derivar el cuadrante de Eisenhower a partir de los campos urgente/importante y no guardar una clasificación contradictoria separada.
13. **FR-13** Un adaptador LLM puede proponer clasificación y asociaciones, pero el core debe aceptar correcciones explícitas del usuario.
14. **FR-14** La UI debe ofrecer una vista de matriz de Eisenhower del backlog con los cuatro cuadrantes derivados, filtrable por categoría y proyecto.

### Postponement and archive suggestion

15. **FR-15** Posponer una tarea debe poder hacerse desde `inbox` o desde `backlog`, retirarla temporalmente de la vista activa y programar su regreso a su estado de origen en la revisión semanal seleccionada (la siguiente o una posterior).
16. **FR-16** Cada decisión explícita de posponer incrementa en uno el contador de posposiciones consecutivas, independientemente del número de semanas de la posposición. Dejar una tarea sin tocar no incrementa ni resetea el contador.
17. **FR-17** Al alcanzar cuatro posposiciones consecutivas, el sistema debe sugerir archivar la tarea y permitir mantenerla activa.
18. **FR-18** Procesar, planificar un bloque, completar o archivar la tarea reinicia la secuencia de posposiciones consecutivas.
19. **FR-19** Ninguna sugerencia debe archivar o eliminar una tarea sin confirmación explícita.

### Week templates and weekly review

20. **FR-20** Debe existir al menos una plantilla predeterminada editable.
21. **FR-21** La plantilla predeterminada debe ofrecer en cada día activo (lunes a viernes) dos slots `deep` de 90 minutos y un slot `project` de 120 minutos.
22. **FR-22** El usuario debe poder crear, duplicar, renombrar, editar y archivar plantillas.
23. **FR-23** Crear una semana debe copiar la plantilla elegida como snapshot independiente.
24. **FR-24** Añadir, quitar, mover o cambiar slots de una semana no debe modificar la plantilla ni otras semanas.
25. **FR-25** Editar posteriormente una plantilla no debe alterar semanas ya creadas.
26. **FR-26** Solo puede haber una semana abierta. Abrir una semana con otra abierta debe fallar con `conflict` o ejecutarse como parte de la revisión que cierra la anterior.
27. **FR-27** La revisión semanal es una única ceremonia de cierre y apertura que el usuario puede ejecutar indistintamente al final de la semana o al inicio de la siguiente.
28. **FR-28** La revisión debe: cerrar la semana abierta si existe, marcar como `missed` sus bloques `planned`, mantener en backlog las tareas abiertas, reactivar en su estado de origen los elementos cuya posposición vence, y abrir desde una plantilla la semana que contiene la fecha actual, sin crear semanas intermedias.

### Planning

29. **FR-29** El usuario debe poder asignar manualmente una tarea del backlog a un slot compatible según la matriz de compatibilidad.
30. **FR-30** El sistema debe poder proponer una planificación diaria o semanal sin aplicarla hasta que el usuario la acepte mediante una acción explícita.
31. **FR-31** La propuesta debe ordenar candidatas por fecha límite, cuadrante de Eisenhower y antigüedad, y después encajarlas en slots compatibles con su tipo de trabajo y capacidad restante.
32. **FR-32** Una propuesta debe mostrar qué slots quedan vacíos y qué tareas no se colocaron, incluyendo el motivo.
33. **FR-33** Una tarea de tipo `project` puede recibir bloques en varias semanas sin estimación total ni límite de bloques.
34. **FR-34** Cerrar una semana no debe crear automáticamente bloques para la siguiente.

### Execution, completion and nominal reporting

35. **FR-35** Un bloque planificado debe poder marcarse como ejecutado o cancelado por el usuario.
36. **FR-36** Marcar un bloque como ejecutado debe sumar su duración nominal al historial de la tarea, sin cambiarla a completada.
37. **FR-37** Completar una tarea debe ser una acción binaria e independiente de sus bloques acumulados. Completar una tarea con bloques `planned` los cancela.
38. **FR-38** Una tarea abierta al cerrar la semana debe permanecer en el backlog aunque haya ejecutado todos sus bloques planificados.
39. **FR-39** Los reportes deben sumar bloques y minutos u horas nominales por rango de fechas, tarea, proyecto y categoría.
40. **FR-40** Los reportes deben distinguir bloques planificados, ejecutados, cancelados y perdidos (`missed`); solo los ejecutados cuentan como trabajo realizado.
41. **FR-41** La UI y las APIs no deben presentar los bloques acumulados como porcentaje o indicador de progreso.

### Capability contract and Nora compatibility

42. **FR-42** Debe existir un manifiesto de capacidades versionado y legible por máquina como fuente de verdad de las operaciones públicas.
43. **FR-43** Cada capacidad debe declarar identificador estable, descripción, esquema de entrada, esquema de salida, `sideEffect` (`read` | `write` | `destructive`), `confirmation` (`none` | `required`) y ejemplos de lenguaje natural.
44. **FR-44** Los esquemas deben ser JSON Schema y ser la fuente de verdad: los tipos TypeScript se generan desde ellos, y admiten generación o validación automática de herramientas MCP.
45. **FR-45** Debe existir un adaptador MCP mínimo que exponga las capacidades públicas sin incorporar lógica de negocio propia.
46. **FR-46** UI (vía adaptador HTTP local), MCP y futuros adaptadores deben invocar la misma capa de aplicación y producir las mismas reglas de dominio.
47. **FR-47** Las operaciones mutables deben admitir un `request_id` opcional, único globalmente. El core guarda un hash del payload junto al recibo. Mismo `request_id` y mismo payload devuelven la respuesta original; mismo `request_id` con payload distinto devuelve `conflict`. Los recibos se conservan 30 días.
48. **FR-48** Las respuestas deben poder expresar de forma estructurada: éxito, error de validación, conflicto, necesidad de confirmación o necesidad de aclaración.
49. **FR-49** Las capacidades con `confirmation: required` responden `needs_confirmation` con un resumen del efecto y un `confirmation_token` de corta duración (5 minutos). El cliente repite la misma llamada con el token para ejecutarla. El token es de un solo uso y está ligado al hash del payload.
50. **FR-50** El manifiesto inicial debe cubrir, como mínimo:
    - Captura y consulta: `inbox.capture_many`, `inbox.list`, `backlog.list`, `task.get`
    - Tareas: `task.process`, `task.update`, `task.postpone`, `task.complete`, `task.archive`, `task.unarchive`
    - Categorías: `category.create`, `category.rename`, `category.archive`, `category.unarchive`, `category.list`
    - Proyectos: `project.create`, `project.rename`, `project.move`, `project.archive`, `project.unarchive`, `project.list`
    - Plantillas: `template.create`, `template.duplicate`, `template.update`, `template.archive`, `template.list`
    - Semanas: `week.open`, `week.review`, `week.current`, `week.adjust_slots`
    - Planificación: `plan.propose`, `plan.accept`, `block.schedule`, `block.execute`, `block.cancel`
    - Reportes: `report.nominal_time`

    `inbox.capture_many` admite un flag por elemento para crearlo ya procesado (excepción de FR-01). `task.archive`, `category.archive`, `project.archive`, `template.archive`, `week.review` y `plan.accept` tienen `confirmation: required`.

51. **FR-51** El core no debe depender de STT, TTS, un proveedor LLM ni de Nora; esos sistemas traducen lenguaje natural a capacidades estructuradas.

## Non-functional requirements

- **NFR-01 — Local-first:** el MVP debe poder ejecutarse y conservar datos en una sola máquina sin depender de servicios cloud.
- **NFR-02 — Integrity:** cambios de estado, planificación y registro de bloques deben ser transaccionales.
- **NFR-03 — Auditability:** debe conservarse un historial mínimo de capturas, cambios de estado, posposiciones y ejecución de bloques.
- **NFR-04 — Idempotency:** repetir una operación mutable con el mismo `request_id` y el mismo payload no debe duplicar tareas, bloques ni transiciones; con payload distinto debe fallar con `conflict`.
- **NFR-05 — Compatibility:** el manifiesto debe usar versionado semántico y esquemas JSON compatibles con clientes independientes.
- **NFR-06 — Performance:** las operaciones locales habituales deben responder en menos de 300 ms con hasta 10.000 tareas, excluyendo inferencia LLM externa.
- **NFR-07 — Accessibility:** la experiencia visual debe ser operable con teclado y no depender exclusivamente de gestos tipo swipe.
- **NFR-08 — Voice safety:** una transcripción o intención ambigua debe poder corregirse antes de una acción irreversible.
- **NFR-09 — Privacy:** no se almacenará audio en Quadrant y los textos capturados no se enviarán a terceros desde el core.
- **NFR-10 — Recoverability:** archivar debe ser reversible; el borrado permanente queda fuera del MVP.
- **NFR-11 — Testability:** las reglas de dominio deben probarse sin arrancar UI, MCP ni servicios externos.
- **NFR-12 — Observability:** cada invocación externa debe generar un resultado trazable por `request_id`, capacidad y estado final, sin registrar secretos.

## Technical approach

### Architecture

Se implementará como monolito modular local con puertos y adaptadores, alineado con la arquitectura conceptual de Nora:

```text
Web UI ──→ HTTP adapter ─┐
MCP adapter ─────────────┼─→ Application commands/queries → Domain → Repository
future voice/skill ──────┘                                    ↓
                                                        local database

Capability manifest + JSON Schemas → tipos TS generados, compartidos por HTTP, MCP y futuros adaptadores
```

Los módulos iniciales serán:

- `domain`: entidades, estados, invariantes, matriz de compatibilidad, planificación y cálculo nominal.
- `application`: comandos, consultas, idempotencia, tokens de confirmación y resultados estructurados.
- `storage`: persistencia local y migraciones.
- `capabilities`: manifiesto, JSON Schemas, tipos generados, ejemplos y políticas de confirmación.
- `api`: adaptador HTTP local uno-a-uno con capacidades, consumido por la web.
- `mcp`: adaptación uno-a-uno de capacidades a herramientas MCP.
- `web`: bandeja, tarjetas de procesamiento, matriz, backlog, plantillas, semana, día y reportes.

`api` y `mcp` son adaptadores finos: validan contra los JSON Schemas, delegan en `application` y traducen el resultado estructurado. No contienen reglas de dominio.

### Persistence

La implementación inicial asumirá SQLite por su operación local, transacciones y portabilidad. El modelo debe separar al menos:

- categories;
- projects;
- tasks;
- week_templates y template_slots;
- week_plans y week_slots;
- work_blocks;
- postponements (fuente del contador de posposiciones consecutivas);
- command_receipts para idempotencia (request_id, hash del payload, respuesta, fecha);
- confirmation_tokens (token, capacidad, hash del payload, expiración, usado);
- settings (zona horaria y configuración de instalación);
- audit_events.

Las migraciones deben versionarse. Los reportes se derivarán de `work_blocks` ejecutados; no se almacenará un campo de progreso calculado.

### Planning heuristic

La primera versión usará una heurística determinista y explicable:

1. filtrar tareas abiertas y disponibles del backlog (excluyendo `snoozed` y tareas de padres archivados);
2. priorizar vencidas o con fecha límite próxima;
3. ordenar por cuadrante: urgente/importante, importante/no urgente, urgente/no importante, no urgente/no importante;
4. desempatar por antigüedad en backlog;
5. asignar únicamente a slots compatibles con capacidad restante según la matriz de compatibilidad;
6. devolver tareas y slots no emparejados con un motivo (`no_compatible_slot`, `slot_full`, `already_planned`, `not_available`).

La propuesta es editable y requiere aceptación explícita mediante `plan.accept`. Un adaptador LLM puede formular explicaciones o resolver lenguaje natural, pero no debe reemplazar las invariantes del dominio.

### Capability manifest

El manifiesto será neutral respecto al canal. Una capacidad tendrá una forma conceptual equivalente a:

```json
{
  "id": "block.schedule",
  "version": "1.0.0",
  "description": "Asigna una tarea abierta a un slot semanal compatible",
  "inputSchema": "./schemas/block.schedule.input.json",
  "outputSchema": "./schemas/block.schedule.output.json",
  "sideEffect": "write",
  "confirmation": "none",
  "examples": ["Pon Gemelo digital en un bloque de proyecto mañana"]
}
```

Todas las respuestas comparten un envoltorio con `status` (`ok` | `validation_error` | `conflict` | `needs_confirmation` | `needs_clarification`), `request_id` y un `result` o `error` tipado por capacidad.

El manifiesto no incluirá prompts propietarios, credenciales, comportamiento de voz ni detalles de proveedores. Nora podrá descubrirlo mediante MCP o consumir los mismos esquemas desde otro adaptador.

### Initial stack assumption

Para que la implementación pueda comenzar sin otra decisión previa, se asume TypeScript para dominio, aplicación, API, web y MCP; SQLite para persistencia; JSON Schema como fuente de tipos; y una interfaz web local responsive. La elección concreta de framework y herramientas de build se decidirá durante el bootstrap, priorizando pocas dependencias y sin alterar los contratos definidos aquí.

## Impacted files or systems

El repositorio todavía no contiene implementación. Se prevén las siguientes áreas:

- `.git/` — inicialización del repositorio (absorbido de la spec del 09-02).
- `AGENTS.md` — reglas de trabajo del repositorio.
- `.codex/config.toml` — configuración local opcional, sin credenciales.
- `package.json` y configuración de workspace — bootstrap del proyecto TypeScript.
- `apps/web/` — interfaz local responsive.
- `apps/api/` — adaptador HTTP local.
- `apps/mcp/` — servidor o adaptador MCP local.
- `packages/domain/` — modelo e invariantes.
- `packages/application/` — casos de uso y contratos internos.
- `packages/storage/` — SQLite, repositorios y migraciones.
- `packages/capabilities/` — manifiesto, JSON Schemas y tipos generados.
- `tests/` — pruebas de aceptación e integración.
- Nora / Voice Knowledge Engine — consumidor futuro; no se modifica dentro de esta spec.

## Decisions log

Decisiones tomadas el 2026-09-03 sobre ambigüedades de la primera versión:

- Bloques `planned` al cerrar la semana pasan a `missed` (distinto de `cancelled`).
- Matriz de compatibilidad: `project` 1:1; `deep` admite una `deep` o varias `short`/`brief` por duración.
- Posposición desde inbox y backlog, con retorno al estado de origen; el contador cuenta decisiones, no semanas; se reinicia con procesar, planificar, completar o archivar.
- Máximo una semana abierta; la revisión abre la semana actual sin crear intermedias; lunes ISO.
- Fechas de calendario sin hora; slots con hora opcional; zona horaria única de instalación.
- Confirmación en dos pasos mediante `confirmation_token` emitido por el core.
- `request_id` global con hash de payload, `conflict` si difiere, retención 30 días.
- Capacidades atómicas en lugar de `*.manage`.
- Tareas de padres archivados quedan ocultas y no planificables; vuelven al desarchivar.
- JSON Schema como fuente de verdad de tipos.

## Risks and open questions

- **Horario de la plantilla predeterminada:** están decididos los tipos, cantidades y duraciones de slots, pero no sus horas de inicio. Se asume que el onboarding pedirá disponibilidad y que la plantilla podrá conservar slots ordenados sin hora hasta completarla.
- **Atribución de `brief`:** las `brief` agrupadas en un slot suman 10 minutos nominales cada una; la exactitud de esa cifra no es objetivo del primer reporte.
- **Interpretación por LLM:** la calidad al dividir una captura de voz en tareas pertenece al adaptador y debe validarse con Nora; el core no asumirá que una interpretación sea correcta.
- **MCP como transporte:** el manifiesto es la fuente estable. Si Nora adopta otro protocolo, deberá poder añadirse otro adaptador sin cambiar dominio ni aplicación.
- **Conflictos de planificación:** el MVP previene doble reserva de un slot local, pero no resolverá conflictos con calendarios externos.
- **Expiración de tokens de confirmación en voz:** 5 minutos puede ser corto si el usuario se distrae; se revisará tras la validación con Nora.

## Task checklist

Los hitos se implementan en pasadas separadas y en orden. Cada hito debe dejar `build`, `test`, `lint` y `typecheck` en verde.

### H1 — Núcleo: dominio, persistencia, contratos e idempotencia

- [ ] Inicializar el repositorio (git, `AGENTS.md`, workspace TypeScript) y fijar convenciones de desarrollo desde esta spec.
  - Check: `AGENTS.md`, scripts de build/test/lint/typecheck y estructura de workspace existen y se ejecutan.
- [ ] Implementar el modelo de dominio y sus invariantes, incluida la matriz de compatibilidad.
  - Check: pruebas unitarias cubren ciclo inbox/backlog/snoozed/archived, clasificación, posposición con retorno a origen, cierre semanal con `missed`, finalización binaria y compatibilidad slot↔tipo.
- [ ] Implementar persistencia local y migraciones.
  - Check: una base nueva se crea, migra y recupera datos tras reiniciar el proceso.
- [ ] Implementar categorías, proyectos, tareas, captura y procesamiento.
  - Check: escenario de captura por lotes → tarjetas → backlog funciona sin proyecto obligatorio; archivar un proyecto oculta sus tareas y desarchivarlo las recupera.
- [ ] Implementar posposición y sugerencia de archivo a la cuarta decisión consecutiva.
  - Check: cuatro posposiciones consecutivas producen sugerencia; una sola posposición de tres semanas cuenta uno; procesar o planificar reinicia; nunca se archiva automáticamente.
- [ ] Crear y validar el manifiesto de capacidades, sus JSON Schemas y la generación de tipos TS.
  - Check: todos los ejemplos válidos pasan validación, las entradas inválidas fallan con errores estructurados y los tipos generados compilan.
- [ ] Implementar idempotencia, tokens de confirmación y auditoría de comandos.
  - Check: dos invocaciones con el mismo `request_id` y payload generan un único efecto; payload distinto devuelve `conflict`; una capacidad `required` sin token devuelve `needs_confirmation` y con token válido ejecuta una sola vez.

### H2 — Semanas, planificación y reportes

- [ ] Implementar plantillas y snapshots semanales con la plantilla predeterminada.
  - Check: editar una semana o plantilla no modifica snapshots anteriores ni la fuente contraria; la predeterminada tiene 2 `deep` de 90 min y 1 `project` de 120 min por día laborable.
- [ ] Implementar revisión única de cierre y apertura con invariante de una semana abierta.
  - Check: bloques `planned` pasan a `missed`, tareas abiertas siguen en backlog, pospuestas vencidas vuelven a su origen, se abre la semana actual sin intermedias y abrir una segunda semana devuelve `conflict`.
- [ ] Implementar asignación manual, propuesta explicable y `plan.accept`.
  - Check: la heurística respeta fecha, cuadrante, antigüedad y capacidad restante; devuelve motivos; la propuesta no tiene efecto hasta aceptarse.
- [ ] Implementar bloques ejecutados/cancelados y reportes nominales.
  - Check: tres bloques `project` ejecutados reportan seis horas nominales sin crear progreso; los reportes distinguen `planned`, `executed`, `cancelled` y `missed`.

### H3 — Adaptador MCP

- [ ] Implementar el adaptador MCP mínimo generado desde el manifiesto.
  - Check: un cliente MCP puede capturar, procesar, planificar, ejecutar un bloque, confirmar un archivo con token y consultar el reporte.
- [ ] Validar compatibilidad conceptual con Nora.
  - Check: las frases de ejemplo se mapean a capacidades sin introducir lógica de Quadrant en el adaptador de voz.

### H4 — Interfaz web

- [ ] Implementar el adaptador HTTP local.
  - Check: cada capacidad pública tiene un endpoint que valida contra el mismo JSON Schema que MCP.
- [ ] Implementar la interfaz web responsive y accesible: bandeja, tarjetas, matriz de Eisenhower, backlog, plantillas, semana, día y reportes.
  - Check: el flujo principal se completa con ratón, táctil y teclado; ninguna vista muestra progreso.

## Acceptance criteria

- [ ] Una captura individual o por lotes entra en la bandeja y conserva su canal de origen.
- [ ] El usuario puede procesar una tarea, clasificarla en Eisenhower y dejarla en backlog sin programarla.
- [ ] Existen categorías, proyectos y tareas sin proyecto, con filtros y asociaciones coherentes; una tarea con proyecto nunca tiene categoría directa.
- [ ] Una tarea pospuesta desde inbox o backlog reaparece en su estado de origen en la revisión elegida, y tras cuatro posposiciones consecutivas se sugiere archivarla.
- [ ] Una semana nueva copia una plantilla y sus ajustes no alteran la plantilla ni otras semanas.
- [ ] La plantilla inicial ofrece por día laborable dos bloques `deep` de 90 minutos y un bloque `project` de 120 minutos.
- [ ] Solo puede haber una semana abierta; la revisión semanal única cierra la anterior, marca `missed` sus bloques pendientes y abre la actual sin reprogramar automáticamente tareas abiertas.
- [ ] La planificación propuesta respeta prioridad, fechas, matriz de compatibilidad y capacidad de slot, explica los elementos no colocados y no tiene efecto hasta `plan.accept`.
- [ ] Un bloque de proyecto ejecutado suma exactamente dos horas nominales aunque la tarea siga abierta.
- [ ] Una tarea solo se completa mediante una acción explícita y binaria; nunca por número de bloques.
- [ ] Los reportes agregan bloques nominales por tarea, proyecto, categoría y rango temporal, distinguen los cuatro estados de bloque y no muestran progreso.
- [ ] El manifiesto permite descubrir e invocar las capacidades esenciales mediante esquemas versionados; los tipos TS se generan desde los esquemas.
- [ ] HTTP y MCP producen los mismos efectos para una operación equivalente.
- [ ] Los reintentos con el mismo `request_id` y payload no duplican efectos; con payload distinto devuelven `conflict`.
- [ ] Las operaciones con confirmación requerida no se ejecutan sin un `confirmation_token` válido y de un solo uso.
- [ ] Ninguna operación archiva o elimina automáticamente una tarea.

## Rollout and validation

El MVP se desplegará inicialmente como aplicación local con datos de prueba y después con datos reales del usuario. La validación se hará en tres pasos:

1. dominio y persistencia con pruebas automatizadas (H1, H2);
2. recorrido manual completo desde captura hasta cierre/apertura semanal y reporte (H4);
3. prueba de contrato desde MCP con frases representativas de Nora, usando texto y sin audio real (H3).

No se conectará Nora ni se importarán tareas reales de otros sistemas hasta completar los criterios de aceptación. Las migraciones y copias de seguridad deben probarse antes de usar Quadrant como fuente principal de tareas.

## Test plan

### Unit tests

- Derivación de los cuatro cuadrantes de Eisenhower.
- Transiciones válidas e inválidas de inbox, backlog, completed, archived y snoozed, incluido el retorno de `snoozed` a su estado de origen.
- Invariante de categoría efectiva al asociar y desasociar proyecto.
- Contador de posposiciones por decisiones: cuatro consecutivas sugieren; una de tres semanas cuenta uno; procesar/planificar/completar/archivar reinician.
- Matriz de compatibilidad: `project` 1:1, `deep` con una `deep` o varias `short`/`brief` hasta la capacidad, rechazo de mezcla y de doble reserva.
- Copia de plantillas y aislamiento de ajustes semanales.
- Cierre/apertura semanal: bloques `planned` → `missed`, tareas abiertas permanecen en backlog, pospuestas vencidas retornan, invariante de una semana abierta, sin semanas intermedias.
- Duración nominal fija de 120 minutos para bloques `project` y 90 por defecto para `deep`.
- Ausencia de cálculo de progreso a partir de bloques.
- Orden y motivos de la heurística de planificación; `plan.accept` como único punto de aplicación.
- Idempotencia por `request_id`: misma respuesta con mismo payload, `conflict` con payload distinto.
- Tokens de confirmación: emisión, un solo uso, expiración y vinculación al payload.
- Resolución de “hoy”/“mañana” e inicio de semana con la zona horaria de instalación.

### Integration tests

- Persistencia y recuperación completa con SQLite.
- Captura por lotes → procesamiento → backlog → semana → bloque ejecutado → reporte.
- Cuatro posposiciones consecutivas → sugerencia de archivo → conservación al rechazarla.
- Modificación de plantilla después de crear una semana → snapshot semanal intacto.
- Archivar proyecto → tareas ocultas y no planificables → desarchivar → visibles.
- Paridad entre comando de aplicación, endpoint HTTP y herramienta MCP.
- Validación del manifiesto, esquemas y tipos generados de todas las capacidades públicas.
- Flujo de confirmación en dos pasos vía MCP para `task.archive`.

### Manual validation

- Procesar la bandeja mediante tarjetas con teclado y táctil.
- Crear una semana desde la plantilla predeterminada y ajustar únicamente esa semana.
- Planificar “Gemelo digital” en varios bloques de proyecto, ejecutar algunos, dejar uno sin ejecutar, cerrar la semana y comprobar que el bloque queda `missed` y la tarea sigue abierta sin porcentaje ni etapa.
- Agrupar tres tareas `short` en un slot `deep` y comprobar el límite de capacidad.
- Consultar un reporte por tarea, proyecto y categoría.
- Simular órdenes de Nora: captura múltiple, clasificación, planificación, confirmación de archivo, finalización y consulta de horas.
