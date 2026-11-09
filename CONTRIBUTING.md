# Beitragen

Das Repo hat zwei Teile: die App in `web/` (Next.js, TypeScript) und die Datenpipeline in `scripts/` (Python), die `site/items.json` erzeugt.

## App (`web/`)

Fork klonen, dann:

```bash
cd web
npm ci
npm run dev
```

Die App läuft ohne weitere Einrichtung auf http://localhost:3000. Die Daten kommen von der veröffentlichten Seite. Anmeldung, Sammlungen und Einreichungen brauchen eine Datenbank und Auth-Einstellungen, siehe `web/.env.local.example`.

Vor dem Pull Request:

```bash
npx tsc --noEmit
npm test
npm run build
```

Das führt auch der Workflow `Web CI` aus.

Das Aussehen ist in [DESIGN.md](./DESIGN.md) festgelegt und verbindlich. `web/lib/affiliate.ts` enthält die Provisionskennungen des Betreibers, Änderungen dort bitte vorher in einem Issue besprechen.

## Datenpipeline (`scripts/`)

Benötigt Python 3.12 und `requests pillow beautifulsoup4 openpyxl pyyaml playwright`. Die Rohdaten (`data/raw`) liegen nicht im Repo. Ein vollständiger Refresh über alle Quellen dauert Stunden und wird vom Betreiber gemacht, siehe [README](./README.md#refresh-neue-daten-holen).

Neue Quelle vorschlagen: Eintrag in `sources.yaml` (Sheet-ID und Name) per Pull Request oder Issue. Nur diese Quelle lässt sich mit `scripts/fetch.py --only <ID>` nachladen, der Ablauf steht im README.

`site/items.json` und `site/thumbs/` werden alle zwei Stunden vom Workflow `Linkcheck autonom` aktualisiert. Bitte nicht per Pull Request ändern, das erzeugt Konflikte.

## Pull Request

1. Branch anlegen, Änderung machen, die Prüfungen oben ausführen.
2. Pull Request gegen `main` öffnen und beschreiben, was sich sichtbar ändert.

Mit dem Pull Request stimmst du zu, dass dein Beitrag unter der [AGPL-3.0](./LICENSE) steht.
