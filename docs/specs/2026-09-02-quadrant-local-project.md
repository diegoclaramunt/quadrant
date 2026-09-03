# Crear el proyecto local `quadrant`

- Status: Superseded
- Owner: Diego
- Date: 2026-09-02
- Related issue: N/A
- Superseded by: `2026-09-03-quadrant-mvp.md` (hito H1 absorbe git init, `AGENTS.md` y `.codex/config.toml` opcional)

## Context and problem

El directorio `/home/diego/personal/quadrant` existe, pero está vacío y todavía no está preparado como proyecto de trabajo para Codex. El objetivo es poder iniciar el proyecto desde una orden conversacional y asociarlo a ese directorio.

La aplicación de escritorio de ChatGPT/Codex no documenta una API ni un fichero soportado para registrar automáticamente una entrada en su barra lateral. Por tanto, la automatización puede preparar el directorio y su configuración, pero la asociación visual con la aplicación requiere añadir la carpeta desde la propia aplicación.

## Goals

- Preparar `/home/diego/personal/quadrant` como proyecto local de Codex.
- Mantener el nombre lógico `quadrant` y la ruta física indicada.
- Crear una base mínima y reproducible para las instrucciones y configuración del proyecto.
- Dejar el directorio listo para que el usuario lo añada una vez en la aplicación de escritorio.

## Non-goals

- Modificar la base de datos, caché o estado interno de la aplicación de escritorio.
- Prometer el registro automático del proyecto en la barra lateral sin una API oficial.
- Crear todavía una aplicación, dependencias o código de negocio de `quadrant`.
- Compartir o modificar credenciales, historial global o configuración personal de Codex.

## User stories or scenarios

- Como usuario, quiero decir “crea el proyecto `quadrant` asociado a `/home/diego/personal/quadrant`” para que el directorio quede preparado para trabajar con Codex.
- Como usuario, quiero poder añadir esa carpeta una sola vez en la aplicación y encontrar allí el proyecto y sus chats posteriores.

## Functional requirements

1. La ruta objetivo debe existir y ser un directorio.
2. El nombre lógico del proyecto debe ser `quadrant`.
3. El directorio debe inicializarse como repositorio Git si aún no lo es, sin borrar ni sobrescribir contenido existente.
4. Debe crearse `AGENTS.md` únicamente si no existe, con instrucciones iniciales mínimas y no destructivas.
5. Debe crearse `.codex/config.toml` únicamente si no existe, sin incluir credenciales ni endpoints personales.
6. La respuesta de finalización debe indicar qué se creó, qué se omitió por existir y que la carpeta debe añadirse manualmente a la aplicación de escritorio para que aparezca en su barra lateral.
7. No se deben modificar archivos fuera de `/home/diego/personal/quadrant` para registrar el proyecto en la aplicación.

## Non-functional requirements

- Seguridad: no tocar `~/.codex/auth.json`, historiales globales ni bases de datos internas de la aplicación.
- No destructivo: conservar cualquier contenido previo y pedir confirmación si hubiera que sobrescribir archivos.
- Reproducibilidad: los archivos de proyecto deben poder versionarse y revisarse mediante Git.
- Compatibilidad: usar rutas absolutas y formatos soportados por Codex (`AGENTS.md` y `.codex/config.toml`).

## Technical approach

1. Validar la ruta y listar su contenido antes de modificarla.
2. Detectar si ya existe un repositorio Git.
3. Inicializar Git solo si no existe `.git`.
4. Crear plantillas mínimas para `AGENTS.md` y `.codex/config.toml` solo cuando falten.
5. Validar el estado final y mostrar las instrucciones para añadir `/home/diego/personal/quadrant` desde la aplicación de escritorio.

La detección de raíz de proyecto de Codex usa `.git` por defecto. La configuración específica del proyecto se carga desde `.codex/config.toml`; la entrada visual de la aplicación sigue siendo una operación del cliente de escritorio.

## Impacted files or systems

- `/home/diego/personal/quadrant/.git/` — repositorio Git local, si se inicializa.
- `/home/diego/personal/quadrant/AGENTS.md` — instrucciones permanentes del proyecto, si falta.
- `/home/diego/personal/quadrant/.codex/config.toml` — configuración local del proyecto, si falta.
- Aplicación de escritorio de ChatGPT/Codex — asociación manual de la carpeta en la barra lateral.

## Risks and open questions

- La aplicación podría mantener una lista de proyectos independiente; crear archivos en el repositorio no garantiza su aparición automática.
- El contenido inicial de `AGENTS.md` y `.codex/config.toml` debe confirmarse antes de implementarlo si se requieren reglas específicas.
- Si el directorio deja de estar vacío antes de la implementación, no se debe inicializar Git ni crear archivos sin volver a revisar el estado.

## Task checklist

- [ ] Validar que `/home/diego/personal/quadrant` es el directorio objetivo correcto.
  - Check: `test -d /home/diego/personal/quadrant` y revisión de su contenido.
- [ ] Preparar el repositorio Git sin sobrescribir datos.
  - Check: `git -C /home/diego/personal/quadrant status` devuelve un estado válido.
- [ ] Añadir las plantillas de instrucciones y configuración solo si faltan.
  - Check: existen `AGENTS.md` y `.codex/config.toml`, y no contienen secretos.
- [ ] Añadir la carpeta en la aplicación de escritorio.
  - Check: `quadrant` aparece en la barra lateral y permite iniciar un chat local.
- [ ] Verificar el flujo de trabajo.
  - Check: un chat local usa `/home/diego/personal/quadrant` como carpeta principal.

## Acceptance criteria

- [ ] El directorio `quadrant` queda preparado sin pérdida de contenido.
- [ ] Codex puede reconocer `/home/diego/personal/quadrant` como raíz local mediante Git.
- [ ] La configuración de proyecto es revisable y no contiene credenciales.
- [ ] El usuario puede ver el proyecto en la aplicación después de añadir la carpeta desde la UI.
- [ ] Se documenta explícitamente que el registro automático en la barra lateral no está cubierto por una interfaz oficial.

## Rollout and validation

No hay despliegue. La preparación se realiza localmente y debe revisarse antes de iniciar trabajo de desarrollo. La carpeta se incorpora a la aplicación mediante la opción de agregar/adjuntar carpeta.

## Test plan

- Comprobación de existencia y tipo de la ruta objetivo.
- Comprobación de no sobrescritura de archivos existentes.
- Validación de Git con `git status`.
- Validación de sintaxis TOML si se crea `.codex/config.toml`.
- Verificación manual en la aplicación de escritorio: agregar la carpeta, iniciar un chat local y confirmar la ruta de trabajo.
