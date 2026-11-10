---
name: quadrant
description: Crea, cierra y lista tareas en Quadrant (el gestor de tareas de Diego en su NAS). Úsala cuando Diego diga «deriva eso a una tarea de Quadrant», «apúntalo en Quadrant», «créame una tarea», «mándalo a Quadrant», «cierra/marca como hecha la tarea de…», «eso ya está hecho en Quadrant» o pregunte qué tiene pendiente en Quadrant.
---

# Quadrant

Quadrant es el tablero de tareas de Diego: una matriz de Eisenhower en http://192.168.1.38:3360/board.
Las tareas son una línea breve y no llevan fecha. Se colocan en uno de los cuatro cuadrantes, o se quedan en «Sin colocar» para que él las coloque después.

Script: `python3 ~/.claude/skills/quadrant/quadrant.py` (stdlib; `QUADRANT_URL` cambia el servidor).

## Derivar algo de la conversación a una tarea

1. Escribe el título como una acción corta, en castellano, que se entienda fuera de esta conversación: verbo y objeto, de unas 3 a 10 palabras. Por ejemplo, «Revisar el PR 412 de urbo», no «lo del PR».
2. Si hace falta contexto para retomarla (rutas, enlaces, el porqué), ponlo en `--notas`, en 1–3 frases.
3. Proyecto: solo si es obvio por la conversación (el repo o producto del que hablamos, como `nextbook`, `easycert`, `factoria`, `urbo` o `quadrant`) o si Diego lo dice. Usa el nombre corto en minúsculas. Si no existe, se crea.
4. Cuadrante: solo si Diego lo dice («urgente», «para algún día», «importante»…). Si no, déjala sin colocar; colocarla es decisión suya.
   - 1 Hacer ya (urgente e importante) · 2 Planificar (importante, sin prisa) · 3 Despachar (urgente, poco importante) · 4 Algún día
5. Si pide varias tareas, haz una llamada por tarea.

```bash
python3 ~/.claude/skills/quadrant/quadrant.py add "Revisar el PR 412 de urbo" --proyecto urbo --notas "Lo pidió Marta; mira el cambio de migraciones."
python3 ~/.claude/skills/quadrant/quadrant.py add "Renovar el dominio de la web" --cuadrante 3
```

Después, confirma en una línea lo que quedó: título, proyecto y dónde quedó. No repitas las notas.

## Cerrar tareas

Cuando Diego diga que algo ya está hecho («cierra la del veterinario», «marca como hecha la del PR 412»), o cuando en esta conversación terminemos algo que tenía su tarea en Quadrant y él lo confirme:

```bash
python3 ~/.claude/skills/quadrant/quadrant.py done "veterinario gatos"
python3 ~/.claude/skills/quadrant/quadrant.py done "PR 412" "dominio web"   # varias a la vez
```

- Busca entre las abiertas (sin colocar y en los cuadrantes) por título exacto o por palabras del título, sin tildes ni mayúsculas. También acepta el id o sus 8 primeros caracteres.
- Si hay varias coincidencias, no cierra ninguna, las enumera con su id y sale con código 2. Pregunta a Diego cuál era, o vuelve a lanzar con el id si queda claro por el contexto.
- No cierres por tu cuenta tareas que solo parecen terminadas: confírmalo antes con Diego.
- Confirma en una línea qué quedó hecha. Desde la web, en «Hechas», se ve el histórico; reabrir no está disponible.

## Ver el tablero

```bash
python3 ~/.claude/skills/quadrant/quadrant.py board          # --ids añade el id corto de cada tarea
```

Resúmelo; no pegues la salida entera si es larga.

## Si falla

El servidor vive en la red de casa. Si no responde, díselo a Diego y dale la tarea redactada para que la pegue él. No la guardes en otro sitio.
