# Dirección de diseño de Quadrant

Actualizado: 2026-09-05.

## Decisión vigente

Rediseño editorial con referencias de interacción de iOS, autorizado directamente por Diego sin una nueva spec. Aplicado al shell y a las vistas Hoy, Bandeja y Semana; los estilos compartidos alcanzan las pantallas secundarias.

- Titulares serif de sistema, controles sans-serif y jerarquía tipográfica clara.
- Fondo blanco verdoso, superficies blancas, verde bosque para acciones y selección.
- Navegación lateral discreta en escritorio e inferior con cuatro accesos en móvil.
- Listas agrupadas, separadores finos, esquinas suaves y formularios a demanda.
- Semana abre en consulta: siete días compactos y detalle único. La planificación muestra una etapa a la vez.
- Captura en un diálogo nativo con fondo desenfocado, Escape, confinamiento y restauración de foco.
- Sin fuentes externas, imágenes decorativas, nuevas dependencias ni métricas de progreso.

## Validación

Build web, typecheck y cinco pruebas web. Comprobación en Chromium con datos ficticios a 1280 × 900 y 390 × 844: Hoy, Bandeja, Semana, etapas, ausencia de overflow, ampliación de texto, captura con fallo/reintento y restauración de foco. Capturas revisadas en `/tmp/quadrant-editorial-oaDOOT/` (artefactos temporales).

Este registro describe el rediseño visual; no declara completados los requisitos pendientes de la spec de flujo diario ni sustituye el piloto con datos personales.
