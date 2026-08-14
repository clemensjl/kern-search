"""Schreibformat fuer die beiden Statusdateien des Linkchecks.

data/link_status.json (~0,9 MB) und data/item_meta.json (~5,4 MB) werden vom
Workflow "Linkcheck autonom" alle zwei Stunden neu committet. Lagen sie als
Einzeiler vor, konnte git kein Delta bilden und legte bei jedem Lauf die
vollen Dateien neu ab - rund 65 MB Pack-Wachstum pro Tag, dauerhaft.

save_lines() schreibt deshalb eine Zeile je Eintrag mit sortierten
Schluesseln. Weiterhin gueltiges JSON, nur anders umgebrochen.
"""
import json
from pathlib import Path


def save_lines(path: Path, data: dict) -> None:
    """Flaches Objekt, eine Zeile je Eintrag, Schluessel sortiert.

    Der Wert bleibt bewusst kompakt auf seiner Zeile; json.dumps(indent=...)
    waere hier falsch, weil es auch verschachtelte Werte aufbricht und die
    Dateien um ein Vielfaches aufblaeht.
    """
    body = ",\n".join(
        f'{json.dumps(k, ensure_ascii=False)}:'
        f'{json.dumps(v, ensure_ascii=False, separators=(",", ":"))}'
        for k, v in sorted(data.items())
    )
    Path(path).write_text(f"{{\n{body}\n}}\n" if body else "{}\n", encoding="utf-8")
