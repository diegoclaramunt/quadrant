# Quadrant — UX centrada en el trabajo diario

- Status: Implementing
- Owner: Diego
- Date: 2026-09-05
- Related issue: N/A
- Specs fuente: `2026-09-03-quadrant-mvp.md` y `2026-09-05-planificacion-realista.md`

## Context and problem

La interfaz permite completar los casos funcionales, pero exige entender y recorrer demasiados controles. La revisión del código y de la captura móvil de la entrega anterior muestra:

- Ocho destinos de navegación al mismo nivel, incluidos configuración, clasificación y trabajo diario.
- La pantalla semanal reúne apertura/cierre, ajustes de disponibilidad, resumen semanal, detalle del día, reservas y propuesta en una página larga.
- En móvil se apilan siete tarjetas de días con cifras repetidas antes de mostrar el día seleccionado y las reservas.
- La configuración ocupa el primer plano incluso después de tener un plan. Los textos explican reglas internas repetidamente; aparecen fechas ISO y estados como `planned`.
- Seleccionar una tarea de un desplegable crea inmediatamente una asignación manual. El efecto no tiene una acción final diferenciada.
- La aceptación añade un `window.confirm` a una propuesta ya revisada; los errores y cargas no se comunican de forma uniforme.

El objetivo es que resulte evidente qué hacer ahora y que organizar la semana sea una actividad deliberada y acotada. Esta spec propone cambios de UX, no una nueva capacidad de planificación. Tras aprobación, sustituye la presentación de revisión de capacidad de FR-04 de la spec anterior: se revisa en un paso de planificación, sin una casilla obligatoria en la vista diaria. Conserva sus reglas de dominio y confirmación.

## Goals

- Dar acceso directo al día de trabajo y a su próxima acción.
- Separar consulta/ejecución de configuración y planificación.
- Hacer captura, clasificación y reserva contextuales, sin formularios repetidos.
- Ofrecer una composición móvil propia que muestre un día a la vez.
- Mantener capacidad, reservas y exclusiones visibles cuando ayudan a decidir.

## Non-goals

- Cambiar tipos, duraciones, prioridad, persistencia, idempotencia o compatibilidad de bloques.
- Calendarios externos, voz, IA, recurrencias, sincronización o colaboración.
- Progreso de proyectos, estimaciones totales, rachas o gamificación.
- Arrastrar como interacción obligatoria, nuevas dependencias visuales o migración de stack.
- Completar funciones nuevas de administración de proyectos o plantillas que no existan ya.
- Eliminar confirmaciones del dominio o fingir que se guardó una operación fallida.

## User stories or scenarios

- Como usuario, al abrir Quadrant quiero ver qué tengo para hoy y poder marcar un bloque realizado.
- Como usuario, quiero capturar desde cualquier sección y volver a lo que estaba haciendo.
- Como usuario, quiero procesar la bandeja sin aprender nombres de módulos.
- Como usuario, quiero planificar en tres pasos: disponibilidad, reservas opcionales y revisión de propuesta.
- Como usuario móvil, quiero cambiar entre días sin recorrer toda la semana verticalmente.
- Como usuario, quiero saber si una acción guarda datos, prepara un borrador o cierra una semana.

## Functional requirements

1. **FR-01 — Navegación.** Mostrar tres destinos principales: Hoy, Bandeja y Semana. Agrupar Tareas, Plantillas, Proyectos y categorías e Historial en navegación secundaria accesible mediante «Más». Tareas contiene vistas Lista y Matriz. Mantener rutas existentes como accesos o redirecciones que conserven filtros; `/` abre Hoy. En móvil usar navegación compacta de tres destinos y Más, sin cubrir contenido ni foco.
2. **FR-02 — Hoy.** Mostrar fecha legible, bloques del día y una acción contextual. Cada fila prioriza título de tarea, tipo y duración; para bloques pendientes del día ofrecer «Marcar bloque realizado», con cancelar en acciones secundarias. La finalización de tarea permanece separada. Si no hay semana abierta, mostrar «Preparar semana»; si hoy está vacío, «Ver semana» y acceso a planificar. Si está abierta una semana futura, indicar sus fechas y no presentarla como hoy ni habilitar ejecución anticipada.
3. **FR-03 — Captura global.** Ofrecer «Capturar» desde todas las secciones mediante un panel con un campo de texto y botón de envío; admite líneas múltiples como ahora. Tras guardar, mostrar cuántos elementos entraron en bandeja, limpiar el campo y permitir cerrar volviendo al foco anterior. Ante fallo, conservar el texto y ofrecer reintento explícito. No introducir clasificación durante la captura.
4. **FR-04 — Bandeja integrada.** La Bandeja permite alternar entre lista y procesamiento dentro del mismo contexto, conservando la siguiente tarjeta. En procesamiento, el título y la decisión son el foco: importancia, urgencia y tipo con nombres comprensibles; metadatos en «Detalles». Acciones: «Guardar y seguir», «Revisar más adelante» y archivo secundario. Al terminar, mostrar un estado vacío con acceso a Hoy o Semana. No repetir la explicación completa de los tipos en cada vista: mantener ayuda accesible a demanda y las duraciones visibles. Preservar atajos sin interferir con navegación y campos.
5. **FR-05 — Semana para consultar.** Mostrar encabezado con rango legible, resumen nominal compacto y «Planificar semana». El editor de disponibilidad no aparece al entrar. En escritorio mostrar resumen compacto de días y detalle del seleccionado; en móvil un selector de siete días compacto y solo el detalle del seleccionado. Seleccionar hoy si pertenece a la semana; para otra semana, el primer día con bloques/slots, o lunes si está vacía. Días sin capacidad se identifican sin tarjetas grandes de ceros. El detalle puede incluir capacidad total/ocupada/libre sin repetir toda la información en cada resumen.
6. **FR-06 — Planificación guiada.** Abrir una vista específica dentro de Semana con tres etapas: «Disponibilidad», «Reservas» y «Revisar plan». La primera muestra capacidad y acceso a ajustar slots; «Continuar» registra la revisión para este borrador en lugar de una casilla. Reservas es opcional y ofrece «Continuar sin reservas». Al entrar en revisión se invoca `plan.propose`; se muestran asignaciones, reservas diferenciadas, espacio libre y tareas excluidas con motivos. Permitir volver, retirar reservas y generar una propuesta nueva. Ninguna reserva crea bloques antes de aplicar.
7. **FR-07 — Reservar en contexto.** En la etapa de reservas, elegir una tarea en una lista con búsqueda y filtro opcional «Importantes sin fecha». Mostrar después los bloques compatibles por día en un selector accesible. La tarea elegida permanece visible durante la elección de bloque. Las reservas agregadas aparecen junto a la tarea y permiten retirarlas. No exigir comparar simultáneamente dos desplegables largos ni arrastrar elementos. Las reservas del borrador deben distinguirse de asignaciones ya guardadas.
8. **FR-08 — Ajustes y asignación manual.** Abrir ajustes desde el bloque o desde Disponibilidad; mostrar solo el formulario seleccionado. Antes de asignar manualmente, elegir tarea y pulsar «Asignar bloque»: cambiar una selección no escribe datos. Mostrar candidatos compatibles y mantener la validación del servidor. Explicar por qué un bloque ocupado no puede editarse. Los ajustes de slots se guardan mediante las capacidades existentes y se indican como «Guardado en esta semana»; cerrar planificación no promete revertirlos.
9. **FR-09 — Revisión semanal contextual.** Colocar «Cerrar semana y preparar otra» en acciones secundarias de Semana. Antes de ejecutar, mostrar destino, semana que se cerrará y número de bloques pendientes que pasarán a no realizados. Solo ofrecer destinos válidos según las reglas actuales; si no existe destino válido, explicar que ya está abierta la siguiente semana. Después del cierre/apertura, entrar en Disponibilidad. No mostrar controles de cierre en Hoy.
10. **FR-10 — Confirmación en la interfaz.** Sustituir `window.confirm` por confirmación integrada accesible. Para aplicar un plan, la propia vista de revisión muestra efectos y un único botón final «Aplicar plan»: obtener el token antes de ese clic sin ejecutar la mutación. Archivo y cierre semanal muestran un diálogo con consecuencia y acción concreta. Conservar vinculación del token al payload, caducidad, un solo uso y `request_id`. Si la propuesta queda obsoleta, mostrar conflicto y «Generar nueva propuesta»; no ejecutar reintentos de escritura automáticamente.
11. **FR-11 — Lenguaje y feedback.** Usar «Pendiente», «Realizado», «Cancelado» y «No realizado» para los estados de bloque; fechas como «Lun 7 sep» y rangos «7–13 septiembre», incluyendo año cuando difiera del actual. Mantener ISO en contratos. Mostrar horas/minutos con la aclaración nominal una vez en el contexto correspondiente. Resolver títulos por `task.get` si una tarea de un bloque no está en backlog; nunca mostrar un UUID como sustituto de título. Comunicar carga, éxito, fallo y vacío; conservar los datos del formulario ante fallo y anunciar resultados sin mover el foco arbitrariamente.
12. **FR-12 — Borradores y navegación.** Mantener etapa, selecciones y reservas en un servicio de UI por semana mientras la app permanece abierta. Al volver, releer semana y backlog y validar el borrador; si cambiaron, pedir regenerar antes de aplicar. Al cambiar de semana, limpiar el borrador anterior con aviso si había reservas. Al cerrar sin aplicar, ofrecer conservar o descartar las reservas; los ajustes de disponibilidad ya guardados se mantienen. No prometer recuperación del borrador tras recargar el navegador ni añadir persistencia de negocio.

## Non-functional requirements

- Jerarquía: una acción principal por contexto; ajustes, ayuda y acciones infrecuentes aparecen a demanda.
- Accesibilidad: tabulación coherente, foco visible, diálogos con entrada/restauración de foco, Escape para cerrar sin mutar, nombres accesibles independientes del texto de opciones y objetivos táctiles de al menos 44 × 44 px para acciones principales.
- Responsive: sin desbordamiento horizontal a 390 × 844 ni a 1280 × 900; un día visible en móvil. Con zoom de texto al 200 %, las acciones siguen disponibles sin recortes.
- Estilo: conservar la paleta y tipografía de base; reducir cajas anidadas, párrafos permanentes y repetición de cifras. Verde para acción principal y selección discreta; errores con texto, sin depender solo del color.
- Integridad: estados de UI no sustituyen invariantes del dominio; contratos JSON Schema existentes como fuente de tipos, sin migraciones de datos previstas.
- Privacidad: sin telemetría externa ni nuevas llamadas a servicios de terceros.

## Technical approach

1. Reorganizar shell y rutas manteniendo las direcciones actuales; añadir una vista Hoy que consulta `week.current` y resuelve los títulos de tareas necesarios. Reutilizar las operaciones de bloque actuales.
2. Extraer componentes de presentación reutilizables para filas de bloque, selector de día y captura. Separar la consulta semanal del flujo de planificación; conservar operaciones y resultados de application.
3. Crear un servicio de UI para el borrador semanal y su estado de carga/error; no guardar estado de negocio nuevo ni ejecutar escrituras al navegar entre etapas.
4. Adaptar `QuadrantApi` para separar petición de token y confirmación de una operación. Reutilizar las capacidades existentes en un diálogo de Angular con gestión de foco; la propuesta es inmutable y su identificador vincula la confirmación final.
5. Extraer etiquetas/fechas y resolver títulos de bloques completados mediante consultas existentes. Reutilizar filtros actuales de backlog/matriz dentro de Tareas, sin duplicar reglas.
6. Construir primero el recorrido Hoy → Bandeja → Semana y después integrar captura global, administración secundaria y confirmaciones. No agregar gráficos, ilustraciones ni dependencias por decoración.

Esquema orientativo de la vista diaria:

```text
Quadrant                                  Capturar
Hoy   Bandeja (3)   Semana                      Más

Lunes, 7 septiembre
Tu día                                  Ver semana

09:00*  Gemelo digital                   Sesión abierta · 2 h
        Pendiente                       Marcar bloque realizado

        Gestión administrativa          Corta · 30 min
        Pendiente                       Marcar bloque realizado

* Mostrar hora solo cuando exista; en otro caso, usar orden.
```

## Impacted files or systems

- `apps/web/src/app/app.ts`, `app.html`, `app.css`, `app.routes.ts`: navegación y jerarquía.
- `apps/web/src/app/pages/inbox.page.ts`, `process.page.ts`, `week.page.ts`, `backlog.page.ts`, `matrix.page.ts`: recorridos principales.
- Nueva vista `apps/web/src/app/pages/today.page.ts` y componentes de captura, bloque y confirmación bajo `apps/web/src/app/`.
- `apps/web/src/app/quadrant-api.ts`, `work-labels.ts` y servicio de borrador: estado de UI, tokens y lenguaje.
- `apps/web/src/styles.css`: densidad, foco, objetivos táctiles y jerarquía.
- Specs de UI y pruebas en navegador para los recorridos principales; no se prevén cambios de storage ni de lógica de dominio.

## Risks and open questions

- Hipótesis principal: Hoy debe ser el inicio. Se propone porque el uso diario es más frecuente que configurar la semana; queda pendiente aprobación.
- Tres etapas pueden resultar excesivas para un usuario habitual. Mostrar solo su contenido pertinente y permitir saltar reservas; no añadir etapas de bienvenida.
- Obtener tokens en la revisión no elimina su caducidad: ante expiración se renueva la confirmación, se muestra otra vez la consecuencia y se exige otro clic final.
- Algunas acciones de disponibilidad se guardan inmediatamente. El texto y el cierre del borrador deben hacer esa diferencia explícita.
- La navegación secundaria reorganiza acceso a funciones existentes, sin autorizar ampliar administración ni inventar reportes.
- La validación automática anterior demostró funcionamiento, no facilidad de uso. Esta propuesta necesita revisión visual y un recorrido con tareas reales antes de declararse satisfactoria.

## Task checklist

- [x] Reorganizar navegación y crear Hoy.
  - Check: entrada por defecto útil, rutas antiguas accesibles y estados sin semana/semana futura correctos.
- [x] Integrar captura y procesamiento en el recorrido principal.
  - Check: capturar desde Semana vuelve al mismo contexto y una tarjeta se procesa sin datos adicionales obligatorios.
- [ ] Separar consulta semanal y planificación por etapas.
  - Check: móvil muestra solo un día y se completa una propuesta sin recorrer otros seis días.
- [ ] Implementar reservas contextuales y asignación manual explícita.
  - Check: seleccionar no crea bloques y retirar una reserva invalida la propuesta previa.
- [ ] Integrar confirmaciones y feedback accesibles.
  - Check: cancelar/escapar no muta; conflictos conservan contexto; un clic final aplica una vez con token válido.
- [ ] Validar visualmente y comprobar regresiones.
  - Check: capturas de Hoy/Bandeja/Semana en escritorio y móvil, teclado, emulación táctil, zoom y comandos del repositorio.

Nota de implementación: la navegación, Hoy, captura global, lenguaje de estados y selector móvil están implementados. La vista Semana ya expone las tres etapas y la asignación manual explícita, pero la ocultación condicional completa por etapa y la revisión visual con capturas quedan pendientes de validación antes de archivar esta spec.

## Acceptance criteria

- [ ] Abrir la app muestra Hoy con la primera acción pertinente sin configuración semanal por delante.
- [ ] La navegación principal contiene Hoy, Bandeja y Semana; funciones secundarias y rutas anteriores siguen accesibles.
- [ ] Capturar conserva el contexto de origen y un fallo conserva el texto escrito.
- [ ] La bandeja permite procesar tarjetas con metadatos opcionales y atajos compatibles con navegación.
- [ ] A 390 × 844 el selector de día y el encabezado de su detalle se ven en la primera pantalla de Semana con datos de prueba normales y sin banners de error; no se apilan siete días.
- [ ] Disponibilidad, reservas opcionales y revisión se completan por etapas, sin una casilla permanente fuera del flujo.
- [ ] Elegir tarea/slot no crea bloques; solo asignar manualmente o aplicar propuesta los crea.
- [ ] La revisión explica qué cambia y aplica una vez; cancelación, caducidad y conflictos conservan las garantías existentes.
- [ ] Ninguna fila de bloque muestra estados internos, fechas ISO o identificadores en lugar de títulos; no aparecen métricas de progreso.
- [ ] El borrador se conserva al navegar dentro de la app y se revalida al volver; el texto distingue reservas pendientes de ajustes guardados.
- [ ] Teclado, foco, emulación táctil y zoom permiten completar el flujo; no hay desbordamiento horizontal.

## Rollout and validation

Implementar tras aprobación explícita. Validar con una base temporal que contenga un día con trabajo, otro vacío, tareas de varios tipos, títulos largos y bloques de tareas completadas. Revisar capturas de escritorio y móvil antes de probar con datos personales.

Comparar recorridos observables: encontrar la siguiente acción al abrir, capturar y volver, reservar una tarea importante y aceptar el plan. Registrar obstáculos y correcciones; no usar número de tests ni ausencia de overflow como prueba suficiente de buena UX. El piloto personal de la spec anterior permanece pendiente.

## Test plan

- UI: rutas, estados de Hoy, formulario conservado tras error, navegación de tarjetas, día seleccionado y etapas, conservación del borrador, nombres accesibles y confirmaciones.
- Integración de UI/API: token emitido sin efecto, aceptación única, cancelación, expiración, propuesta obsoleta, asignación manual explícita y títulos fuera del backlog.
- Navegador: recorrido completo con teclado y táctil, captura global, red lenta/fallo simulado, 390 × 844 y 1280 × 900, zoom de texto, títulos largos y foco al cerrar paneles.
- Validaciones: tests relevantes de web, lint, typecheck y build; suite de application/capabilities si se altera su consumo. Comprobar formato de cambios; el error preexistente de `tools/patch-nx-serve.mjs` sigue fuera de alcance.
