# Confirmación visible del cambio de semana

- Status: Verifying
- Date: 2026-09-06
- Owner: Diego

## Context and problem

El domingo el usuario intenta cerrar su semana y preparar la siguiente, pero el botón parece no responder. WeekPage presenta needs_confirmation al final del contenido, sin mover el foco ni hacerlo visible. Los errores también quedan lejos del control.

## Goals

Hacer visible y accesible la confirmación de operaciones de Semana, conservar el contrato existente y mostrar el resultado del cambio de semana.

## Non-goals

Cambiar reglas de cierre, migrar datos, cerrar la semana real del usuario desde pruebas, rediseñar la planificación o modificar voz.

## User stories

El domingo pulso Revisar y abrir semana elegida, leo fechas y consecuencias en un diálogo, confirmo y veo la siguiente semana en Disponibilidad. Si cancelo no hay cierre. Si falla veo el error en el diálogo y puedo salir.

## Functional requirements

- La confirmación usa dialog modal nativo, con título, resumen del servidor y foco gestionado por el navegador.
- Cancelar o Escape descarta la confirmación sin invocar operaciones. No se permite cancelar mientras se guarda.
- Confirmar conserva payload, request_id y token originales. El diálogo permanece durante el guardado y ante un error, mostrado dentro.
- Tras el cierre correcto se recarga la semana, se abre Disponibilidad en lunes y se anuncia el intervalo abierto.
- Errores generales visibles cerca de la cabecera; una respuesta inválida sin token no queda silenciada.
- La confirmación de aceptar una propuesta conserva su comportamiento existente.

## Non-functional requirements

Reutilizar estilos dialog existentes; sin cambios de contratos ni dominio. Respetar cambios locales previos.

## Technical approach and impacted files

WeekPage: referencia a dialog y efecto de apertura/cierre, estado de resultado, manejo común de errores. planning-flow.spec: regresiones DOM para domingo, cancelación, error y éxito. Sin persistencia real en validación.

## Acceptance criteria

- [x] Revisar semana abre confirmación modal sin desplazamiento manual.
- [x] Cancelar/Escape no cierra semana ni llama a confirm.
- [x] Confirmar usa el mismo identificador/token y actualiza fechas/etapa/día tras éxito.
- [x] Error del servidor o conexión visible en el modal, sin falso éxito.
- [x] Aceptar propuestas sigue funcionando.

## Rollout and validation

Tests web con API simulada; build y tipos web. Lint de archivos tocados. No se ejecutan operaciones contra la base del usuario. La semántica modal nativa se valida en DOM simulado; la comprobación visual en navegador real queda indicada por separado si no está disponible.

## Test plan

Escenario domingo 6 de septiembre con semana del 31 de agosto: solicitar destino 7 de septiembre, cancelar, reabrir, fallar confirmación, reintentar con identidad estable y completar. Cubrir Escape y error sin token. Ejecutar regresiones existentes de planificación.

## Evidencia de validación

- `nx run web:test`: 3 archivos y 12 pruebas correctas, incluidas cancelación por botón/Escape, destino del domingo, identidad de reintento, error visible, resultado y confirmación sin token.
- `nx run web:build` y `nx run web:typecheck`: correctos.
- ESLint dirigido: cero errores; 16 advertencias existentes por aserciones no nulas en el código previo.
- El diálogo se abre con `showModal` después de renderizar su contenido; los tests simulan esta API porque jsdom no la implementa. Pendiente comprobación visual y foco en navegador real.
- No se ha cerrado ni modificado la semana real del usuario; las pruebas usan una API simulada.
