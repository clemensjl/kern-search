"""Gemeinsames Lese-/Schreibformat fuer data/link_status.json.

Bis 08/2026 stand dort nur das Ergebnis: {"wd:<id>": "ok"}. Damit war nicht
feststellbar, WANN geprueft wurde - genau die Information, aus der die
Frischegarantie auf der Seite entsteht. Neues Format traegt das Pruefdatum:

    {"wd:<id>": ["ok", "2026-08-14"]}

Altbestand ohne Datum wird beim Laden auf LEGACY_DATE gehoben. Das ist der
erste Commit, in dem die Datei in Git auftaucht - die Pruefungen sind also
nachweislich MINDESTENS so alt. Ein aelteres Datum ist nicht belegbar, ein
juengeres waere gelogen, deshalb dieser Stichtag.

check_links.py, merge_linkcheck.py, prune_dead.py und compact.py lesen und
schreiben ausschliesslich ueber dieses Modul, damit die vier Skripte nicht
auseinanderlaufen.
"""
import json
from datetime import date, datetime
from pathlib import Path

# Erster Commit von data/link_status.json (git log --reverse). Alles ohne
# eigenes Datum ist mindestens von diesem Tag.
LEGACY_DATE = "2026-07-19"

FINAL = ("ok", "dead")


def today() -> str:
    return date.today().isoformat()


def load(path: Path) -> dict[str, list]:
    """Liest link_status.json und normalisiert Alt- wie Neuformat auf
    {key: [status, "YYYY-MM-DD"]}."""
    if not Path(path).exists():
        return {}
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    out: dict[str, list] = {}
    for k, v in raw.items():
        if isinstance(v, str):
            out[k] = [v, LEGACY_DATE]
        elif isinstance(v, (list, tuple)) and v:
            out[k] = [v[0], v[1] if len(v) > 1 and v[1] else LEGACY_DATE]
    return out


def save(path: Path, data: dict[str, list]) -> None:
    Path(path).write_text(
        json.dumps(data, separators=(",", ":")), encoding="utf-8"
    )


def final_only(data: dict[str, list]) -> dict[str, list]:
    """'unknown' rausfiltern - nur ok/dead sind endgueltig, der Rest wird
    in der naechsten Runde neu geprueft."""
    return {k: v for k, v in data.items() if v[0] in FINAL}


def age_days(datestr: str, ref: date | None = None) -> int:
    """Alter einer Pruefung in Tagen."""
    ref = ref or date.today()
    try:
        return (ref - datetime.strptime(datestr, "%Y-%m-%d").date()).days
    except (ValueError, TypeError):
        return 10**6


def stamp(items: list, data: dict[str, list]) -> list[str]:
    """Setzt auf jedem Item mit bestaetigt lebendem Link das Feld "lc" - den
    Index seines Pruefdatums in der zurueckgegebenen Datumsliste (meta.lcr).
    Items ohne bestaetigten Link verlieren das Feld wieder.

    Bewusst idempotent und allein aus link_status.json abgeleitet, damit sowohl
    compact.py (voller Build) als auch prune_dead.py (Linkcheck-Nachlauf ohne
    Rebuild) die Frischedaten fortschreiben koennen, ohne sich zu widersprechen.
    """
    live = {k: v[1] for k, v in data.items() if v[0] == "ok"}
    used = sorted({live[k] for it in items
                   if (k := f"{it.get('pf')}:{it.get('pid')}") in live})
    idx = {d: i for i, d in enumerate(used)}
    for it in items:
        d = live.get(f"{it.get('pf')}:{it.get('pid')}")
        if d is None:
            it.pop("lc", None)
        else:
            it["lc"] = idx[d]
    return used


def summary(items: list, lcr: list[str], removed: int | None = None) -> dict:
    """Kennzahlenblock fuer meta.lc - daraus formuliert die Oberflaeche die
    Frischeangabe. Wird von compact.py gesetzt und von prune_dead.py nach dem
    Loeschen der toten Items neu gerechnet.

    checked = Items mit Feld lc (nachweislich lebender Link)
    pct     = Anteil an allen ausgelieferten Items
    last    = juengste Pruefrunde, oldest = aelteste noch gueltige
    removed = beim letzten prune_dead entfernte tote Links
    """
    checked = sum(1 for it in items if it.get("lc") is not None)
    total = len(items)
    out = {
        "checked": checked,
        "total": total,
        "pct": round(100 * checked / total, 1) if total else 0.0,
        "last": lcr[-1] if lcr else None,
        "oldest": lcr[0] if lcr else None,
    }
    if removed is not None:
        out["removed"] = removed
    return out


def due(data: dict[str, list], keys, max_age: int, ref: date | None = None) -> list[str]:
    """Pruefreihenfolge fuer einen rollierenden Lauf: nie geprueft zuerst,
    danach die aeltesten Pruefungen. Frisch Geprueftes faellt raus."""
    never, stale = [], []
    for k in keys:
        rec = data.get(k)
        if rec is None or rec[0] not in FINAL:
            never.append(k)
        else:
            a = age_days(rec[1], ref)
            if a >= max_age:
                stale.append((a, k))
    stale.sort(key=lambda t: -t[0])
    return never + [k for _, k in stale]
