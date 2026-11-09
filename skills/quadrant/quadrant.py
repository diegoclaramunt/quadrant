#!/usr/bin/env python3
"""Cliente mínimo de Quadrant para la skill: añade tareas y lista el tablero.

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


def board(_args):
    projects = {p["id"]: p["name"] for p in call("project.list")["projects"]}
    tag = lambda t: f"  #{projects[t['projectId']]}" if t.get("projectId") in projects else ""
    inbox = call("inbox.list")["tasks"]
    backlog = call("backlog.list")["tasks"]
    print(f"Sin colocar ({len(inbox)})")
    for t in inbox:
        print(f"  - {t['title']}{tag(t)}")
    for code, _, _, name in QUADRANTS.values():
        items = [t for t in backlog if t["quadrant"] == code]
        print(f"{name} ({len(items)})")
        for t in items:
            print(f"  - {t['title']}{tag(t)}")
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
    b.set_defaults(fn=board)
    args = parser.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
