#!/usr/bin/env python3
"""Cliente mínimo de Quadrant para la skill: añade, lista y cierra tareas.

Habla con la API HTTP del servidor (por defecto el NAS de casa). Solo stdlib.
"""
import argparse
import json
import os
import sys
import unicodedata
import urllib.error
import urllib.request
import uuid

BASE = os.environ.get("QUADRANT_URL", "http://192.168.1.38:3360").rstrip("/")
QUADRANTS = {
    "1": ("ui", True, True, "Hacer ya"),
    "2": ("in", False, True, "Planificar"),
    "3": ("un", True, False, "Despachar"),
    "4": ("nn", False, False, "Algún día"),
}
NAMES = {code: name for code, _, _, name in QUADRANTS.values()}


def call(capability, payload=None):
    req = urllib.request.Request(
        f"{BASE}/api/capabilities/{capability}",
        data=json.dumps(payload or {}).encode(),
        headers={"content-type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            env = json.load(res)
    except urllib.error.URLError as err:
        sys.exit(f"No se pudo hablar con Quadrant en {BASE}: {err}")
    if env.get("status") != "ok":
        sys.exit(f"Quadrant respondió {env.get('status')}: {json.dumps(env.get('error') or env, ensure_ascii=False)}")
    return env["result"]


def norm(text):
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if c.isalnum() and not unicodedata.combining(c)).lower()


def project_id(name):
    """Proyecto por nombre (sin tildes ni mayúsculas); si no existe, se crea en «General»."""
    if not name:
        return None
    for p in call("project.list")["projects"]:
        if not p["archived"] and norm(p["name"]) == norm(name):
            return p["id"]
    cats = call("category.list")["categories"]
    cat = next((c for c in cats if not c["archived"] and norm(c["name"]) == "general"), None)
    if not cat:
        cat = call("category.create", {"name": "General"})["category"]
    return call("project.create", {"name": name, "categoryId": cat["id"]})["project"]["id"]


def add(args):
    item = {"title": args.titulo.strip(), "channel": "skill"}
    if args.notas:
        item["notes"] = args.notas
    pid = project_id(args.proyecto)
    if pid:
        item["projectId"] = pid
    if args.cuadrante:
        _, urgent, important, _ = QUADRANTS[args.cuadrante]
        item.update(alreadyProcessed=True, urgent=urgent, important=important, workType="short")
    task = call("inbox.capture_many", {"request_id": str(uuid.uuid4()), "items": [item]})["tasks"][0]
    where = NAMES[task["quadrant"]] if task["status"] == "backlog" else "Sin colocar"
    extra = f" · #{args.proyecto}" if pid else ""
    print(f"Añadida a {where}: {task['title']}{extra}")


def open_tasks():
    return call("inbox.list")["tasks"] + call("backlog.list")["tasks"]


def where(task):
    return NAMES[task["quadrant"]] if task["status"] == "backlog" else "Sin colocar"


def find(query, tasks):
    """Por id (o su prefijo), título exacto o palabras contenidas en el título."""
    q = query.strip()
    by_id = [t for t in tasks if len(q) >= 6 and t["id"].startswith(q)]
    if by_id:
        return by_id
    exact = [t for t in tasks if norm(t["title"]) == norm(q)]
    if exact:
        return exact
    words = [norm(w) for w in q.split() if norm(w)]
    return [t for t in tasks if all(w in norm(t["title"]) for w in words)]


def done(args):
    tasks = open_tasks()
    failed = False
    for query in args.tarea:
        found = find(query, tasks)
        if len(found) == 1:
            t = found[0]
            call("task.complete", {"request_id": str(uuid.uuid4()), "taskId": t["id"]})
            tasks = [x for x in tasks if x["id"] != t["id"]]
            print(f"Hecha: {t['title']} (estaba en {where(t)})")
            continue
        failed = True
        if not found:
            print(f"No encuentro ninguna tarea abierta con «{query}».")
        else:
            print(f"«{query}» coincide con {len(found)} tareas; repite con el id:")
            for t in found:
                print(f"  {t['id'][:8]}  {t['title']}  [{where(t)}]")
    if failed:
        sys.exit(2)


def board(args):
    projects = {p["id"]: p["name"] for p in call("project.list")["projects"]}
    tag = lambda t: f"  #{projects[t['projectId']]}" if t.get("projectId") in projects else ""
    ref = lambda t: f"{t['id'][:8]}  " if args.ids else ""
    inbox = call("inbox.list")["tasks"]
    backlog = call("backlog.list")["tasks"]
    print(f"Sin colocar ({len(inbox)})")
    for t in inbox:
        print(f"  - {ref(t)}{t['title']}{tag(t)}")
    for code, _, _, name in QUADRANTS.values():
        items = [t for t in backlog if t["quadrant"] == code]
        print(f"{name} ({len(items)})")
        for t in items:
            print(f"  - {ref(t)}{t['title']}{tag(t)}")
    print(f"\n{BASE}/board")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("add", help="Añade una tarea")
    a.add_argument("titulo")
    a.add_argument("--proyecto")
    a.add_argument("--cuadrante", choices=list(QUADRANTS), help="1 Hacer ya, 2 Planificar, 3 Despachar, 4 Algún día")
    a.add_argument("--notas")
    a.set_defaults(fn=add)
    b = sub.add_parser("board", help="Muestra el tablero")
    b.add_argument("--ids", action="store_true", help="Muestra el id corto de cada tarea")
    b.set_defaults(fn=board)
    d = sub.add_parser("done", help="Marca como hechas una o varias tareas abiertas")
    d.add_argument("tarea", nargs="+", help="Id (o sus 8 primeros caracteres), título o palabras del título")
    d.set_defaults(fn=done)
    args = parser.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
