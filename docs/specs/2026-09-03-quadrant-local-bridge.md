# Quadrant Local Bridge — acceso remoto de baja latencia sin desplegar datos

- Status: Draft
- Owner: Diego
- Date: 2026-09-03
- Related issue: N/A
- Related spec: `2026-09-03-quadrant-mvp.md` (contratos, idempotencia y adaptadores)
- Supersedes: N/A

## Context and problem

Quadrant es local-first: la base SQLite vive en `.data/quadrant.sqlite` y los adaptadores actuales (`apps/api`, `apps/mcp`) delegan en la misma capa `application` sin lógica de dominio propia. El adaptador MCP en `apps/mcp/src/main.ts` (artefacto `dist/apps/mcp/main.js`) usa transporte stdio con JSON-RPC por línea y, en mediciones recientes, completa una invocación típica en ~240 ms de punta a punta en WSL.

Ese coste local es aceptable. La latencia percibida al operar Quadrant desde un asistente remoto (por ejemplo, un Cloud Agent de Cursor) no viene del core sino de la cadena de intermediación:

1. el asistente remoto no puede abrir stdio contra un proceso en el PC del usuario;
2. cada intención atraviesa aprobación local, shell de Windows (PowerShell), entrada a WSL y orquestación de un proceso Node/MCP nuevo o equivalente;
3. arrancar o reconectar el adaptador en cada petición repite inicialización de runtime, apertura de SQLite y handshake MCP;
4. el asistente remoto tiende a encadenar varias herramientas o comandos de shell para una sola intención de negocio.

El usuario quiere usar el bot remoto como interfaz principal de gestión, pero **no** desplegar Quadrant ni replicar datos fuera de su máquina. Los datos deben permanecer en WSL; el asistente solo envía intenciones estructuradas y recibe envelopes JSON ya definidos por el manifiesto de capacidades.

El adaptador HTTP local (`apps/api`, puerto 3000) ya expone `POST /capabilities/:id` con el mismo contrato que MCP, pero tampoco es alcanzable desde un entorno remoto sin un túnel explícito. Hace falta un **canal de invocación local persistente** optimizado para «una sola operación local por petición remota», compatible con el MCP actual y preparado para evolucionar a MCP Streamable HTTP sin obligar a un despliegue cloud del producto.

## Goals

- Reducir la latencia percibida desde un asistente remoto manteniendo todos los datos en el PC del usuario bajo WSL.
- Establecer **exactamente una operación local de Quadrant** por petición remota aceptada (una capacidad del manifiesto por invocación).
- Reutilizar el manifiesto, JSON Schemas, envelopes (`ok`, `validation_error`, `conflict`, `needs_confirmation`, `needs_clarification`) e idempotencia por `request_id` ya definidos en el MVP.
- Introducir un **daemon local persistente** (Quadrant Local Bridge) que conserve la conexión a SQLite y evite cold starts repetidos.
- Exponer un **CLI de invocación única** que el asistente remoto pueda disparar con un solo comando WSL aprobado, devolviendo **una línea JSON** (el envelope) por stdout.
- Mantener **paridad funcional** con `apps/mcp` y `apps/api`: misma `QuadrantApp.invoke()`, mismos efectos.
- Añadir **autenticación local**, límites de tasa básicos y registro estructurado de latencias sin registrar secretos ni payloads completos sensibles.
- Documentar una **ruta de evolución** hacia MCP Streamable HTTP y túneles seguros (Tailscale, SSH reverse, etc.) sin implementar despliegue de Quadrant fuera de la máquina del usuario en esta fase.

## Non-goals

- Desplegar Quadrant, su API o su base de datos en cloud, VPS o servicios gestionados del proveedor del asistente.
- Sincronizar o replicar `.data/quadrant.sqlite` fuera del host WSL del usuario.
- Reemplazar el adaptador MCP stdio existente; convive como transporte para clientes locales (Cursor Desktop, Nora).
- Implementar un relay cloud propio de Quadrant; cualquier túnel externo es configuración opcional del usuario.
- Agrupar varias capacidades en una sola llamada de shell remoto (anti-objetivo: un comando = una capacidad).
- Cambiar reglas de dominio, el manifiesto de capacidades ni los flujos de confirmación del MVP.
- Exponer la base SQLite o el socket del bridge sin autenticación a interfaces distintas de loopback, salvo documentación explícita de hardening para túneles.
- Sustituir la UI web local ni el flujo de revisión semanal visual.

## User stories or scenarios

- Como usuario con un Cloud Agent, quiero ejecutar «lista mi bandeja» con un único comando WSL aprobado y recibir el envelope JSON de `inbox.list` en menos de un segundo de overhead de orquestación (excluyendo latencia de red y aprobación humana).
- Como usuario, quiero que un daemon local en WSL permanezca activo mientras trabajo, de modo que las invocaciones sucesivas no reinicien Node ni vuelvan a abrir SQLite desde cero.
- Como usuario, quiero que capturar, procesar o archivar una tarea desde el bot remoto use el mismo `request_id` que ya conozco del MVP, de forma que un reintento del asistente no duplique efectos.
- Como usuario, quiero ver en un log local cuánto tardó cada invocación (`bridge_latency_ms`, capacidad, `status`) para distinguir lentitud de red de lentitud local.
- Como usuario, quiero seguir usando MCP stdio en Cursor Desktop local sin cambiar mi configuración actual.
- Como usuario, quiero una guía futura para activar MCP Streamable HTTP sobre el mismo daemon cuando el ecosistema lo soporte, sin mover datos fuera de mi PC.
- Como usuario, quiero que una operación con `confirmation: required` devuelva `needs_confirmation` en el envelope y que un segundo comando con el mismo payload y `confirmation_token` complete la acción, igual que vía MCP.

## Functional requirements

### Bridge daemon

1. **FR-B01** Debe existir un proceso persistente `quadrant-bridge` (nuevo adaptador en `apps/bridge`) que arranque en WSL, abra la misma base configurada por `QUADRANT_DB` (por defecto `.data/quadrant.sqlite`) y permanezca en ejecución hasta recibir señal de parada o fallo irrecuperable.
2. **FR-B02** El daemon debe escuchar solo en `127.0.0.1` (HTTP) o en un socket de dominio Unix bajo el directorio del proyecto (p. ej. `.data/quadrant-bridge.sock`), nunca en `0.0.0.0` por defecto.
3. **FR-B03** El daemon debe reutilizar una única instancia de `createQuadrantApp()` (misma fábrica que `apps/mcp` y `apps/api`) para todas las invocaciones concurrentes serializadas o con cola acotada.
4. **FR-B04** Debe exponer `GET /health` (o equivalente en protocolo interno) con versión del manifiesto, ruta de base de datos resuelta (sin credenciales) y tiempo de actividad del proceso.
5. **FR-B05** Debe exponer `GET /manifest` devolviendo el manifiesto de capacidades sin transformación.

### Invocación única (CLI)

6. **FR-B06** Debe existir un ejecutable CLI `quadrant-bridge invoke` (mismo paquete `apps/bridge`) invocable desde WSL con una sola línea, sin arrancar un servidor MCP stdio.
7. **FR-B07** El CLI debe aceptar como mínimo: `--capability <id>` (p. ej. `inbox.list`), `--payload <json|string>` (objeto JSON o `@ruta/archivo.json`), `--request-id <uuid>` (opcional pero recomendado para escrituras) y `--output jsonl` (por defecto: una línea JSON en stdout).
8. **FR-B08** Cada ejecución del CLI debe realizar **como máximo una** llamada a `QuadrantApp.invoke(capabilityId, payload)` contra el daemon; no debe encadenar capacidades ni interpretar lenguaje natural.
9. **FR-B09** El CLI debe imprimir el envelope completo en stdout y código de salida `0` si `status` es `ok` o `needs_confirmation`; `1` para `validation_error`, `conflict` o `needs_clarification`; `2` para errores de conexión al daemon o autenticación.
10. **FR-B10** Si el daemon no está en ejecución, el CLI puede opcionalmente arrancarlo en modo «one-shot» (proceso efímero) con advertencia de mayor latencia; el modo recomendado para uso remoto es daemon ya activo.

### Contrato HTTP interno del daemon

11. **FR-B11** `POST /invoke` debe aceptar un cuerpo JSON:

    ```json
    {
      "capability": "inbox.list",
      "payload": {},
      "request_id": "550e8400-e29b-41d4-a716-446655440000"
    }
    ```

    y devolver el envelope tipado del MVP sin envolver en MCP `CallToolResult`.
12. **FR-B12** Los nombres de herramienta MCP (`inbox_list`) y los ids de capacidad (`inbox.list`) deben ser intercambiables en la capa bridge mediante la misma función `toolName` / `capabilityFromTool` que `apps/mcp`, pero el contrato canónico del bridge es el **id de capacidad con punto**.
13. **FR-B13** Las respuestas deben incluir cabecera o campo `X-Quadrant-Bridge-Request-Id` (UUID generado por el bridge) además del `request_id` de negocio del envelope.

### Seguridad

14. **FR-B14** Toda petición al daemon debe incluir `Authorization: Bearer <token>` donde el token se lee de `QUADRANT_BRIDGE_TOKEN` (generado en setup local, mínimo 32 bytes aleatorios). Sin token válido: HTTP 401 y CLI exit code `2`.
15. **FR-B15** El token no debe persistirse en logs ni imprimirse en stdout del CLI en modo normal.
16. **FR-B16** El bridge debe rechazar payloads cuyo tamaño supere 1 MiB y más de 10 invocaciones por minuto por origen (rate limit en memoria) con HTTP 429.
17. **FR-B17** Las capacidades con `sideEffect: destructive` o `confirmation: required` siguen las mismas reglas del core; el bridge no puede omitir confirmación.

### Idempotencia y duplicados

18. **FR-B18** El bridge debe reenviar `request_id` del payload al core sin alterarlo; la idempotencia de 30 días y detección de `conflict` por hash de payload permanecen en `application` (FR-47 del MVP).
19. **FR-B19** El bridge debe registrar en log estructurado si una invocación fue **deduplicada** (`idempotent_replay: true`) cuando el core devuelve la respuesta cacheada para un `request_id` existente.
20. **FR-B20** El CLI debe aceptar `--idempotency-key` como alias de `--request-id` para alinear con convenciones de asistentes.

### Observabilidad

21. **FR-B21** Cada invocación debe emitir una línea JSON en `.data/bridge-audit.jsonl` (rotación manual o por tamaño fuera de alcance del MVP del bridge) con: `bridge_request_id`, `request_id`, `capability`, `status`, `bridge_latency_ms`, `core_latency_ms`, `idempotent_replay`, `timestamp` (ISO 8601). No incluir títulos de tareas ni notas completas.
22. **FR-B22** Debe existir `GET /metrics` (solo loopback + token) devolviendo contadores agregados: invocaciones totales, por `status`, latencia p50/p95 de las últimas N invocaciones en memoria (N=1000).
23. **FR-B23** El arranque del daemon debe escribir un evento `bridge.started` con versión y PID.

### Compatibilidad MCP y evolución HTTP

24. **FR-B24** `apps/mcp` stdio permanece sin cambios de comportamiento; puede compartir documentación de setup pero no depende del daemon para clientes locales.
25. **FR-B25** El daemon debe diseñarse como **punto único de invocación local** al que un futuro transporte MCP Streamable HTTP se conectará como adaptador fino (misma ruta `/invoke` o handler compartido), sin duplicar `QuadrantApp`.
26. **FR-B26** La spec debe documentar (sin implementar aún) la activación opcional de bind en interfaz Tailscale (`100.x.x.x`) solo con flag explícito `QUADRANT_BRIDGE_BIND=tailscale` y token obligatorio.

### Operación remota asistida

27. **FR-B27** Debe documentarse el contrato de **un comando WSL por intención** para Cloud Agents, por ejemplo:

    ```bash
    wsl -e bash -lc 'cd ~/personal/quadrant && node dist/apps/bridge/cli.js invoke --capability inbox.list --payload "{}" --request-id "$(uuidgen)"'
    ```

    El asistente remoto no debe generar scripts multi-paso para una sola capacidad salvo el flujo de confirmación en dos invocaciones explícitas.
28. **FR-B28** Para operaciones de lectura frecuentes (`inbox.list`, `backlog.list`, `week.current`), el asistente debe preferir una sola invocación con filtros del payload en lugar de varias listas parciales.

## Non-functional requirements

- **NFR-B01 — Locality:** ningún dato de tareas, proyectos o reportes sale del host WSL salvo el envelope JSON devuelto al asistente en esa invocación.
- **NFR-B02 — Latency:** con daemon activo, overhead del bridge (CLI → daemon → core) por debajo de 50 ms p95 en hardware de referencia del usuario, excluyendo red y aprobación; el core sigue cumpliendo NFR-06 del MVP (<300 ms).
- **NFR-B03 — Single operation:** una petición remota aceptada produce como máximo una ejecución de `invoke` en el core; los reintentos idempotentes no cuentan como nueva ejecución de dominio.
- **NFR-B04 — Availability:** el daemon debe recuperarse de errores de invocación individuales sin reiniciar el proceso; solo errores de corrupción de BD o migración fallida pueden terminar el proceso.
- **NFR-B05 — Security:** superficie de ataque limitada a loopback; token de alto entropía; sin exposición por defecto a la LAN.
- **NFR-B06 — Compatibility:** paridad de envelopes y códigos de estado con `apps/api` y `apps/mcp` para la misma capacidad y payload.
- **NFR-B07 — Observability:** logs estructurados consultables localmente; métricas suficientes para comparar «antes (spawn MCP)» vs «después (daemon)».
- **NFR-B08 — Evolvability:** el diseño interno separa transporte (HTTP/UDS/CLI/futuro Streamable HTTP) de `QuadrantApp.invoke()`.
- **NFR-B09 — Operability:** instalación como servicio opcional de usuario (`systemd --user` en WSL) documentada; arranque manual con `npm run serve:bridge` equivalente a otros adaptadores.

## Technical approach

### Architecture

Se añade un adaptador fino `apps/bridge` al monolito modular existente. No introduce reglas de dominio.

```text
Remote assistant (Cloud Agent)
    │  one approved WSL command per capability
    ▼
quadrant-bridge CLI  ──HTTP/UDS + Bearer──►  bridge daemon (persistent)
                                                    │
                                                    ▼
                                            QuadrantApp.invoke()
                                                    │
                                                    ▼
                                            .data/quadrant.sqlite

Cursor Desktop / Nora (local) ──stdio──► apps/mcp ──┘ (same application layer, separate process OK)

Web UI ──HTTP──► apps/api ───────────────────────────┘ (unchanged; may share daemon later, not required F1)

Future: MCP Streamable HTTP adapter ──► bridge daemon /invoke (same handler)
```

**Decisión arquitectónica:** el cuello de botella remoto es el **arranque y la orquestación por petición**, no el tiempo de `invoke`. Un daemon local con CLI de una sola invocación reduce el trabajo local a: (1) un proceso `wsl` ya caliente si el usuario mantiene WSL activo, (2) una conexión HTTP/UDS al daemon, (3) una llamada al core. El adaptador MCP stdio se conserva para clientes locales; el bridge es el camino optimizado para asistentes remotos que hoy pagan el coste de spawn + JSON-RPC MCP completo.

### Componentes

| Componente | Responsabilidad |
| ---------- | --------------- |
| `apps/bridge/src/daemon.ts` | Servidor HTTP/UDS, auth, rate limit, métricas, handler `/invoke` |
| `apps/bridge/src/cli.ts` | Parseo de flags, una llamada al daemon, envelope en stdout |
| `apps/bridge/src/client.ts` | Cliente HTTP/UDS compartido por CLI y tests |
| `apps/bridge/src/metrics.ts` | Ring buffer de latencias y contadores |
| `apps/bridge/src/audit.ts` | Append a `.data/bridge-audit.jsonl` |
| `packages/application` | Sin cambios de contrato; idempotencia existente |
| `apps/mcp` | Sin cambios obligatorios en F1 |
| `apps/api` | Sin cambios obligatorios en F1; opcional convergencia futura |

### Contratos

#### POST /invoke (daemon)

**Request**

```json
{
  "capability": "task.process",
  "payload": {
    "taskId": "tsk_123",
    "urgent": true,
    "important": false,
    "workType": "short",
    "nominalMinutes": 30,
    "request_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  },
  "request_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

`request_id` en la raíz, si se envía, se fusiona con `payload.request_id` (deben coincidir o fallar validación).

**Response** — envelope del MVP (mismo cuerpo que `POST /capabilities/:id` en `apps/api`).

**Headers**

- `Authorization: Bearer <QUADRANT_BRIDGE_TOKEN>` (requerido)
- `X-Quadrant-Bridge-Request-Id: <uuid>` (respuesta)

#### CLI

```bash
# Lectura
quadrant-bridge invoke --capability inbox.list --payload '{}'

# Escritura idempotente
quadrant-bridge invoke \
  --capability inbox.capture_many \
  --payload '{"items":[{"title":"Idea remota","channel":"mcp"}]}' \
  --request-id '7c9e6679-7425-40de-944b-e07fc1f90ae7'

# Confirmación (segunda invocación explícita)
quadrant-bridge invoke \
  --capability task.archive \
  --payload '{"taskId":"tsk_123","confirmation_token":"<token>"}' \
  --request-id '8d0e7780-8536-51ef-a055-f18gd2g01bf8'
```

**Stdout:** una línea JSON (envelope). **Stderr:** mensajes de diagnóstico solo si `--verbose`.

#### Variables de entorno

| Variable | Default | Descripción |
| -------- | ------- | ----------- |
| `QUADRANT_DB` | `.data/quadrant.sqlite` | Ruta de la base (igual que MCP) |
| `QUADRANT_BRIDGE_TOKEN` | (requerido en daemon) | Secreto compartido CLI↔daemon |
| `QUADRANT_BRIDGE_HOST` | `127.0.0.1` | Bind address |
| `QUADRANT_BRIDGE_PORT` | `3721` | Puerto HTTP si no se usa UDS |
| `QUADRANT_BRIDGE_SOCKET` | `.data/quadrant-bridge.sock` | Si está definido, preferir UDS sobre TCP |
| `QUADRANT_BRIDGE_BIND` | `loopback` | `loopback` \| `tailscale` (futuro, documentado) |

### Security model

1. **Confianza:** el daemon confía en cualquier cliente local que posea el token. El token se genera una vez (`openssl rand -hex 32`) y se guarda en `.env.local` (gitignored) o en el entorno del servicio systemd user.
2. **Red:** bind por defecto solo a loopback. Un túnel (SSH `-R`, Tailscale Serve, Cloudflare Tunnel) es responsabilidad del usuario; la spec incluye checklist de hardening, no un servicio hospedado.
3. **Autorización:** no hay usuarios múltiples; el token es por instalación. Rotación: reiniciar daemon con token nuevo.
4. **Confirmación:** operaciones destructivas siguen el flujo `needs_confirmation` del core; el asistente remoto debe mostrar `summary` al usuario antes de la segunda invocación.

### Lifecycle

```text
setup (once)
  → generar QUADRANT_BRIDGE_TOKEN
  → npm run build:bridge
  → opcional: systemd --user enable quadrant-bridge

session
  → usuario inicia daemon (o ya está activo vía systemd)
  → Cloud Agent emite un comando WSL por capacidad
  → CLI → daemon → envelope
  → asistente interpreta JSON (sin parsear texto libre)

shutdown
  → SIGTERM al daemon: cerrar servidor, flush audit log, cerrar SQLite limpiamente

upgrade
  → detener daemon → migraciones al arrancar (storage existente) → reiniciar
```

### Error handling

| Situación | Comportamiento |
| --------- | -------------- |
| Token ausente o inválido | HTTP 401; CLI exit `2`; envelope no generado |
| Daemon inalcanzable | CLI exit `2`; stderr con mensaje actionable («ejecuta npm run serve:bridge») |
| Capability desconocida | Envelope `validation_error` del core o bridge |
| Payload inválido vs JSON Schema | Envelope `validation_error` |
| `request_id` duplicado, payload distinto | Envelope `conflict` (core) |
| Rate limit excedido | HTTP 429; CLI exit `2` |
| Core lanza excepción no controlada | HTTP 500; log `bridge.error` con stack en archivo local, no en stdout del CLI |

### Metrics and measurement

- **Comparativa antes/después:** registrar en la guía de validación la latencia de `time wsl ... node dist/apps/mcp/main.js` (stdio simulado o herramienta de prueba) vs `time wsl ... quadrant-bridge invoke` con daemon activo.
- **Campos mínimos por invocación:** `bridge_latency_ms`, `core_latency_ms`, `capability`, `status`, `idempotent_replay`.
- **Agregados en `/metrics`:** `invocations_total`, `invocations_by_status`, `latency_ms_p50`, `latency_ms_p95`.

### Compatibility with current MCP

- El manifiesto y los JSON Schemas no cambian.
- Los nombres de herramienta MCP siguen derivándose con `toolName(capabilityId)`.
- Un cliente MCP stdio local puede coexistir con el daemon; ambos pueden apuntar a la misma `QUADRANT_DB`. SQLite en WAL mode con lectores concurrentes: el daemon serializa escrituras; lecturas concurrentes permitidas.
- Paridad verificada con tabla de pruebas cruzadas bridge vs `apps/api` vs `apps/mcp` para capacidades representativas.

### Future: Streamable HTTP without deployment

Fase posterior (fuera de F1, diseño reservado):

1. Añadir `apps/mcp-http` o extender `apps/mcp` con transporte Streamable HTTP del SDK MCP apuntando al handler `/invoke` interno.
2. El usuario opcionalmente publica el puerto vía Tailscale Serve hacia su propio nodo; Quadrant sigue sin salir de su máquina.
3. Cloud Agents que hablen MCP nativo remoto podrán conectar al túnel; los que solo ejecuten shell seguirán usando el CLI.

## Impacted files or systems

- `docs/specs/2026-09-03-quadrant-local-bridge.md` — esta spec.
- `apps/bridge/` — nuevo adaptador (daemon + CLI + tests).
- `package.json` / `nx` — scripts `serve:bridge`, `build:bridge`.
- `.gitignore` — `.env.local`, token files.
- `docs/setup/bridge-remote.md` (opcional en implementación) — guía WSL, token, systemd, comando único para Cloud Agents.
- `apps/mcp/` — sin cambios requeridos en F1; referencia de paridad.
- `apps/api/` — sin cambios requeridos en F1.
- `packages/application/`, `packages/storage/` — reutilizados sin modificación de contrato.
- Entorno WSL del usuario — servicio user, variables de entorno, aprobación de comandos en el cliente del asistente.

## Risks and open questions

- **Aprobación humana:** el bridge no elimina la latencia de aprobación de comandos en Cursor; solo reduce el trabajo local post-aprobación. Comunicar expectativas realistas.
- **SQLite concurrente:** MCP stdio y daemon simultáneos sobre la misma BD pueden contentionar; documentar recomendación «preferir daemon para remoto; cerrar MCP stdio redundante durante sesiones de Cloud Agent» o unificar en F2.
- **Token en shell history:** el CLI debe leer token de entorno, no de flags en línea de comandos.
- **WSL sleep:** si WSL se apaga, el daemon muere; systemd user o script de login debe documentarse.
- **Un solo comando vs confirmación:** operaciones con `confirmation: required` necesitan dos aprobaciones remotas; evaluar UX con `needs_confirmation` antes de implementar atajos.
- **¿Converger `apps/api` con daemon?** F1 los mantiene separados para alcance mínimo; F2 podría hacer que `apps/api` sea cliente del daemon o compartan proceso.
- **Tailscale / túneles:** decisión de hardening y rotación de token bajo responsabilidad del usuario; no validar proveedores concretos en CI.

## Task checklist

Implementación por fases. Cada fase deja `build`, `test`, `lint` y `typecheck` en verde para los proyectos tocados.

### F1 — Daemon, CLI e invocación única

- [ ] Crear `apps/bridge` con daemon HTTP/UDS y handler `/invoke` delegando en `createQuadrantApp()`.
  - Check: `curl` local con token invoca `inbox.list` y devuelve envelope `ok`.
- [ ] Implementar CLI `invoke` con una sola llamada al daemon y salida JSON de una línea.
  - Check: script de integración devuelve exit `0` y JSON válido para lectura; exit `1` en `validation_error` inducido.
- [ ] Autenticación Bearer, rate limit y bind solo loopback.
  - Check: petición sin token → 401; 11ª petición/minuto → 429.
- [ ] Auditoría en `.data/bridge-audit.jsonl` y endpoint `/metrics`.
  - Check: línea de log por invocación sin títulos de tareas; `/metrics` devuelve p50/p95.
- [ ] Scripts `npm run serve:bridge` y documentación de comando WSL único para Cloud Agents.
  - Check: README o `docs/setup/bridge-remote.md` con ejemplo copy-paste.

### F2 — Paridad, idempotencia y confirmación

- [ ] Tabla de pruebas cruzadas bridge vs API vs MCP para ≥10 capacidades representativas (lectura, escritura, `needs_confirmation`, `conflict`).
  - Check: mismos envelopes byte-a-byte salvo `bridge_request_id`.
- [ ] Soporte explícito de `idempotent_replay` en logs cuando el core devuelve recibo cacheado.
  - Check: dos invocaciones CLI con mismo `request_id` y payload generan un solo efecto en BD.
- [ ] Prueba de flujo remoto simulado: un script que emula Cloud Agent (un `wsl` por capacidad).
  - Check: latencia p95 del script al menos 2× mejor que spawn MCP en medición documentada.

### F3 — Operación prolongada y evolución transporte

- [ ] Unit file `systemd --user` de ejemplo y señales SIGTERM limpias.
  - Check: reinicio del daemon no corrompe BD; migraciones aplican al arrancar.
- [ ] Diseño e interfaz estable para adaptador MCP Streamable HTTP (issue o sección implementable).
  - Check: handler compartido exportado; sin segundo `QuadrantApp`.
- [ ] Documentación de túnel opcional (Tailscale Serve / SSH `-R`) con checklist de seguridad.
  - Check: no bind `0.0.0.0` por defecto; flag `QUADRANT_BRIDGE_BIND` documentado.

## Acceptance criteria

- [ ] Existe un daemon persistente en WSL que invoca capacidades sin reiniciar Node ni reabrir la BD en cada petición.
- [ ] Un Cloud Agent (o script equivalente) puede ejecutar **un solo comando WSL** por capacidad y recibir el envelope JSON del MVP en stdout.
- [ ] Los datos permanecen en `.data/quadrant.sqlite` local; no se añade replicación cloud.
- [ ] `request_id` opcional funciona igual que en el MVP: reintentos sin duplicar efectos; payload distinto → `conflict`.
- [ ] Operaciones con `confirmation: required` devuelven `needs_confirmation` en la primera invocación y ejecutan solo con `confirmation_token` válido en la segunda.
- [ ] El adaptador MCP stdio existente sigue funcionando sin regresiones en las pruebas del MVP.
- [ ] Cada invocación genera registro estructurado con `bridge_latency_ms` y `capability`.
- [ ] Sin token válido, el daemon rechaza peticiones; sin exposición por defecto fuera de loopback.
- [ ] La documentación describe la ruta hacia MCP Streamable HTTP sin exigir despliegue de Quadrant fuera del PC del usuario.
- [ ] Medición documentada muestra reducción significativa del overhead local respecto a spawn MCP por petición (objetivo: ≥50% en p95 de orquestación local).

## Rollout and validation

1. **Desarrollo:** implementar F1 en rama feature; no activar en producción personal hasta F2 verde.
2. **Setup usuario:** generar token, arrancar daemon con `systemd --user` o sesión manual, configurar Cloud Agent para usar el comando CLI documentado (no MCP stdio remoto).
3. **Validación comparativa:** ejecutar batería de 20 invocaciones `inbox.list` con daemon vs 20 spawns MCP; registrar p50/p95 de tiempo total local.
4. **Validación funcional:** recorrido remoto simulado: captura → procesamiento → `week.current` → `block.schedule` → `report.nominal_time` con un comando por paso.
5. **Rollback:** detener daemon y volver al flujo MCP stdio local anterior; la BD no requiere migración específica del bridge en F1.

## Test plan

### Unit tests

- Validación de auth Bearer y rechazo 401.
- Rate limiter en memoria.
- Fusión y conflicto de `request_id` raíz vs payload.
- Mapeo `capability` ↔ nombre herramienta MCP.
- Formato de línea de auditoría JSONL.
- Cálculo de p50/p95 en ring buffer de métricas.

### Integration tests

- Daemon + CLI: invocación `inbox.capture_many` y lectura posterior con `inbox.list`.
- Idempotencia: doble CLI con mismo `request_id` → un solo registro en BD.
- Confirmación: `task.archive` → `needs_confirmation` → segunda llamada con token → `ok`.
- Paridad: mismo payload en bridge, API y MCP produce envelopes equivalentes.
- Daemon inalcanzable: CLI exit code `2` y mensaje stderr claro.
- Concurrencia ligera: 5 lecturas paralelas sin corrupción.

### Manual validation

- Sesión real con Cloud Agent: una aprobación por listar bandeja; medir tiempo percibido.
- Reinicio de WSL y recuperación del daemon vía systemd user.
- Inspección de `.data/bridge-audit.jsonl` tras 10 operaciones mixtas.
- Verificar que `apps/mcp` configurado en Cursor Desktop local sigue listando herramientas e invocando correctamente con daemon activo.
