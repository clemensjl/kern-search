"""Entfernt Items mit eindeutig totem Weidian-Link aus site/items.json
(basierend auf data/link_status.json aus check_links.py). "unknown" bleibt drin.

Laeuft nach compact.py und schreibt danach meta.lc fort: Anzahl und Anteil der
geprueften Items stimmen erst nach dem Loeschen, und meta.lc.removed haelt
fest, wie viele tote Links dieser Lauf aussortiert hat - die Zahl, mit der die
Oberflaeche die Frischegarantie belegen kann.
"""
import json
from pathlib import Path

import linkstatus

ROOT = Path(__file__).resolve().parent.parent
ITEMS = ROOT / "site" / "items.json"
STATUS = ROOT / "data" / "link_status.json"


def main():
    status = linkstatus.load(STATUS)
    dead = {k for k, v in status.items() if v[0] == "dead"}
    data = json.loads(ITEMS.read_text(encoding="utf-8"))
    items = data["items"] if isinstance(data, dict) else data
    kept = [it for it in items if not (it.get("pf") == "wd" and f"wd:{it.get('pid')}" in dead)]
    removed = len(items) - len(kept)
    if isinstance(data, dict):
        data["items"] = kept
        meta = data.setdefault("meta", {})
        # lc/lcr aus dem aktuellen Pruefstand neu setzen - so ist der Frische-
        # stand auch dann korrekt, wenn der Linkcheck ohne vollen Rebuild lief
        # (iterate_linkcheck.ps1 ruft compact.py bewusst nicht auf).
        meta["lcr"] = linkstatus.stamp(kept, status)
        meta["lc"] = linkstatus.summary(kept, meta["lcr"], removed)
    else:
        data = kept
    ITEMS.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{removed} tote Items entfernt, {len(kept)} verbleiben")
    if isinstance(data, dict):
        s = data["meta"]["lc"]
        print(f"  meta.lc: {s['checked']}/{s['total']} ({s['pct']}%) geprueft, "
              f"juengste Runde {s['last']}, {s['removed']} tote Links entfernt")


if __name__ == "__main__":
    main()
