# kern-search: App

Next.js-App (App Router, TypeScript) mit Suche, Filtern und Sammlungen. Die Produktdaten kommen aus `site/items.json` im Wurzelverzeichnis des Repos, ausgeliefert über GitHub Pages.

```bash
npm ci
npm run dev      # http://localhost:3000
npm test         # Unit-Tests in lib/
npm run build
```

Anmeldung, Sammlungen und Einreichungen brauchen eine Datenbank und Auth-Einstellungen, siehe `.env.local.example`. Ohne sie startet die App trotzdem, nur diese Funktionen fehlen.

Einrichtung, Pipeline und Regeln für Beiträge: [CONTRIBUTING.md](../CONTRIBUTING.md).
