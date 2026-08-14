"""Merged Shard-Artefakte (+ lokale Crawl-Stände) in data/link_status.json
und data/item_meta.json. Druckt TODO=<n> (verbleibende fällige IDs).
Aufruf: python scripts/merge_linkcheck.py <artefakt-dir> [--max-age N]

Beim Zusammenführen gewinnt immer die JÜNGERE Prüfung: ein Shard, der ein
Item heute als tot sieht, darf nicht von einem älteren "ok" überschrieben
werden - und umgekehrt soll ein frisches "ok" ein altes "dead" ablösen,
wenn ein Händler das Angebot wieder online stellt.
"""
import json
import sys
from pathlib import Path

import linkstatus

ROOT = Path(__file__).resolve().parent.parent
STATUS = ROOT / "data" / "link_status.json"
META = ROOT / "data" / "item_meta.json"
ITEMS = ROOT / "site" / "items.json"


def main():
    art_dir = Path(sys.argv[1])
    max_age = 0
    if "--max-age" in sys.argv:
        max_age = int(sys.argv[sys.argv.index("--max-age") + 1])

    status = linkstatus.load(STATUS)
    meta = json.loads(META.read_text(encoding="utf-8")) if META.exists() else {}
    for f in art_dir.rglob("*_status.json"):
        for k, v in linkstatus.load(f).items():
            if v[0] not in linkstatus.FINAL:
                continue
            old = status.get(k)
            if old is None or v[1] >= old[1]:
                status[k] = v
    for f in art_dir.rglob("*_meta.json"):
        meta.update(json.loads(f.read_text(encoding="utf-8")))
    # unknown-Reste rauswerfen: naechste Runde prueft sie neu
    status = linkstatus.final_only(status)
    linkstatus.save(STATUS, status)
    META.write_text(json.dumps(meta), encoding="utf-8")

    data = json.loads(ITEMS.read_text(encoding="utf-8"))
    items = data["items"] if isinstance(data, dict) else data
    pids = {it["pid"] for it in items if it.get("pf") == "wd" and it.get("pid")}
    keys = [f"wd:{p}" for p in pids]
    todo = len(linkstatus.due(status, keys, max_age if max_age > 0 else 10**6))
    ok = sum(1 for v in status.values() if v[0] == "ok")
    dead = sum(1 for v in status.values() if v[0] == "dead")
    print(f"gemergt: {ok} ok, {dead} dead, {len(meta)} meta")
    print(f"TODO={todo}")


if __name__ == "__main__":
    main()
