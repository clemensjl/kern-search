"""Letzter Build-Schritt: items.json kompaktieren.

- Kategorie als Index in meta.cats
- Bild-URLs ueber Praefix-Tabelle meta.iprefix ("<n>:<rest>")
- Quelle (s) und Tab (t) fallen weg: Herkunfts-Spreadsheets bleiben intern
- Linkfrische als Feld "lc": Index in meta.lcr (Liste der Pruefdaten)

Zum Feld "lc": es traegt NUR das Pruefdatum, keinen Statuscode. Nach
prune_dead.py ist jedes ausgelieferte Item entweder nachweislich lebend oder
ungeprueft - "tot und trotzdem drin" gibt es nicht. Damit genuegt:

    lc vorhanden  -> Link an diesem Tag als lebend bestaetigt
    lc fehlt      -> nie geprueft (Taobao/1688 sind ohne Login nicht pruefbar)

Warum Rundenindex und nicht "Tage seit Stichtag": gemessen an der echten
Datenlage kostet der Index rund 41,6 KB gzip gegenueber 48,8 KB fuer
Tagesdifferenzen - einstellige Indizes komprimieren besser als mehrstellige
Tageszahlen, und meta.lcr kann nicht unbegrenzt wachsen, weil jede Pruefung
nach max-age Tagen erneuert wird und alte Daten damit herausfallen.
"""
import json
from collections import Counter
from pathlib import Path

import linkstatus

ROOT = Path(__file__).resolve().parent.parent
ITEMS = ROOT / "site" / "items.json"
STATUS = ROOT / "data" / "link_status.json"


def main():
    data = json.loads(ITEMS.read_text(encoding="utf-8"))
    items = data["items"]
    meta = data["meta"]

    # Schutz vor Doppellauf: auf einer bereits kompaktierten Datei wuerde
    # dieser Code meta.cats zu [0,1,2,...] machen und meta.iprefix leeren -
    # tausende Bilder zeigten dann ins Nichts, ohne dass es auffaellt.
    if any(isinstance(it.get("c"), int) for it in items):
        raise SystemExit(
            "ABBRUCH: items.json ist bereits kompaktiert (c ist ein Index). "
            "compact.py gehoert einmalig hinter parse/enrich/thumbs."
        )

    cats = sorted({it["c"] for it in items})
    c_idx = {c: i for i, c in enumerate(cats)}

    # haeufigste Bild-URL-Praefixe (bis einschliesslich letztem '/')
    pref_count = Counter()
    for it in items:
        i = it.get("i") or ""
        if "/" in i:
            pref_count[i[: i.rindex("/") + 1]] += 1
    iprefix = [p for p, n in pref_count.most_common(9) if n >= 100]
    p_idx = {p: i for i, p in enumerate(iprefix)}

    # Linkfrische: nur bestaetigt lebende Links bekommen ein Datum
    used = linkstatus.stamp(items, linkstatus.load(STATUS))

    for it in items:
        it.pop("s", None)
        it.pop("t", None)
        it["c"] = c_idx[it["c"]]
        i = it.get("i") or ""
        if "/" in i:
            p = i[: i.rindex("/") + 1]
            if p in p_idx:
                it["i"] = f"{p_idx[p]}:{i[len(p):]}"

    meta.pop("sources", None)
    meta["cats"] = cats
    meta["iprefix"] = iprefix
    meta["lcr"] = used
    meta["lc"] = linkstatus.summary(items, used)
    ITEMS.write_text(
        json.dumps({"meta": meta, "items": items}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    s = meta["lc"]
    print(f"kompaktiert: {len(items)} items -> {ITEMS.stat().st_size // 1024 // 1024} MB")
    print(f"  Linkfrische: {s['checked']}/{s['total']} ({s['pct']}%) geprueft, "
          f"{len(used)} Pruefrunden, juengste {s['last']}")


if __name__ == "__main__":
    main()
