# Dependencia de voz

`five-voice-runtime-0.1.1.tgz` es el artefacto original de `/home/diego/five/realtime-voice-runtime/vendor/`, instalado y fijado en el lockfile. No se modifica ni se importan fuentes de ese repositorio.

Para actualizar, generar una nueva versión en el repositorio del runtime con `npm run runtime:pack`, copiar el artefacto a esta carpeta e instalarlo con `npm install --ignore-scripts ./vendor/<artefacto>.tgz`. Validar API, web y contratos antes de sustituir la versión anterior. La instalación no requiere ejecutar la consola de voz.
