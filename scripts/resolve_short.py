"""Loest Shortlinks (ikako.vip -> Kakobuy-Produktseite) aus data/raw/ auf.

Ergebnis: data/shortlink_map.json {kurz_url: finale_url}. parse.py folgt der
Map in extract_ref, damit Shortlink-Items Plattform+ID (Weidian etc.) bekommen
und so an Dedupe, Linkpruefung und Enrich teilnehmen.
Idempotent: bereits aufgeloeste URLs werden nicht erneut angefragt.
"""
import json
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
MAP = ROOT / "data" / "shortlink_map.json"

SHORT_RE = re.compile(r"https?://(?:www\.)?ikako\.vip/[A-Za-z0-9_/-]+")
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
WORKERS = 6
# Zwischenstationen der Redirect-Kette: landet ein Wert hier, ist die
# Aufloesung unvollstaendig und wird in einer weiteren Runde fortgesetzt.
PENDING_HOSTS = ("ikako.vip", "sl.kakobuy.com")


def pending(url):
    return any(f"//{h}/" in url or f"//www.{h}/" in url for h in PENDING_HOSTS)


def save(mapping):
    MAP.write_text(json.dumps(mapping, ensure_ascii=False, indent=0), encoding="utf-8")


def main():
    found = set()
    for f in RAW.glob("*.html"):
        text = f.read_text(encoding="utf-8", errors="replace")
        found.update(u.rstrip("/") for u in SHORT_RE.findall(text))
    mapping = json.loads(MAP.read_text(encoding="utf-8")) if MAP.exists() else {}

    session = requests.Session()
    session.headers.update(HEADERS)

    def resolve(u):
        try:
            r = session.get(u, timeout=30, allow_redirects=True, stream=True)
            r.close()
            return u, r.url
        except requests.RequestException:
            return u, None

    # Runde 1: nie gesehene Shortlinks; Folgerunden: Ketten, die auf einer
    # Zwischenstation (sl.kakobuy.com) haengengeblieben sind.
    for runde in range(4):
        if runde == 0:
            todo = {u: u for u in sorted(found - set(mapping))}
        else:
            todo = {k: v for k, v in mapping.items() if pending(v)}
        if not todo:
            continue
        print(f"Runde {runde + 1}: {len(todo)} aufzuloesen", flush=True)
        done = 0
        with ThreadPoolExecutor(max_workers=WORKERS) as ex:
            for key, (u, final) in zip(todo, ex.map(resolve, todo.values())):
                done += 1
                if final and final != u:
                    mapping[key] = final
                if done % 50 == 0:
                    save(mapping)
                    print(f"  {done}/{len(todo)}", flush=True)
        save(mapping)
    offen = sum(1 for v in mapping.values() if pending(v))
    print(f"fertig: {len(mapping)} Eintraege in {MAP.name}, {offen} unvollstaendig")


if __name__ == "__main__":
    main()
