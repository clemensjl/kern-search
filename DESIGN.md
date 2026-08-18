# DESIGN.md: kern-search

Verbindliche Design-Spezifikation. Quelle: Design-DNA-Analyse (11 Referenzen, Grailed / SSENSE / Depop / StockX / Vinted / Are.na / Discord / Linear / GOAT / Reddit / Poizon).
Diese Datei ersetzt `web/app/page.module.css` und `web/app/globals.css` vollständig.
Alle Werte sind entschieden, nicht verhandelbar, und ohne Rückfrage umsetzbar.

Dials: `VARIANCE: mittel` · `MOTION: niedrig` · `DENSITY: hoch`

---

## 1. Haltung

kern-search ist kein Shop, sondern ein Terminal, mit dem jemand nachts im Bett ein Item aus 102.000 Datensätzen zieht, es gegen QC-Bilder prüft und den Link in seinen Agent kippt. Dark ist der Default und nicht die Option, weil die Zielgruppe Discord-sozialisiert ist und auf OLED liest. Die UI ist monochrom, weil die Ware die einzige Farbquelle sein darf, und dicht, weil die Alternative Scrollen heißt. Tiefe entsteht ausschließlich über tonale Flächen und 1px-Hairlines, niemals über Schatten, weil Weichspüler-Elevation das Gegenteil der Fundstück-Härte transportiert, die diese Nische feiert. Ein einziger Akzent, ein Vermilion aus dem chinesischen Kaufrot, trägt jede Aktion, und alles Numerische läuft in Mono, weil das die Sprache der Nische ist.

---

## 2. Farb-Tokens

### 2.1 Mechanik (load-bearing, exakt so übernehmen)

Das Projekt schaltet das Theme über `document.documentElement.dataset.theme` (`components/Prefs.tsx:57` plus Inline-Script in `layout.tsx`). Prefs schreibt **immer** einen expliziten Wert, `"dark"` oder `"light"`. Die Token-Struktur muss deshalb in beide Richtungen gewinnen:

1. `:root` definiert das komplette **Light**-Set als Basis.
2. `@media (prefers-color-scheme: dark)` mit dem Guard `:root:not([data-theme="light"])` liefert Dark für den Zustand vor der Hydration und ohne JavaScript.
3. `:root[data-theme="dark"]` liefert Dark bei expliziter Wahl.

**Reihenfolge ist Pflicht:** Block 3 hat dieselbe Spezifität wie der Selektor in Block 2 (jeweils 0,2,0). Er muss deshalb **nach** dem Media-Block stehen, sonst gewinnt bei Systemeinstellung Dark und expliziter Wahl Dark zufällig der Media-Block. Bei expliziter Wahl Light greift Block 2 durch den `:not()`-Guard gar nicht erst, damit gewinnt automatisch das Basis-Set aus Block 1.

Die konkreten Farbwerte stehen genau einmal als `--lt-*` und `--dk-*` auf `:root`. Die Override-Blöcke enthalten nur Zuweisungen. Damit ist Wertedrift zwischen den beiden Dark-Blöcken strukturell unmöglich.

### 2.2 Der Block (fertig zum Einsetzen, Kopf von `globals.css`)

```css
:root{
  /* ---- Rohwerte Light ---- */
  --lt-bg:#FBFBFA; --lt-bg-sunk:#F2F2F0;
  --lt-surface-1:#FFFFFF; --lt-surface-2:#F6F6F4; --lt-surface-3:#EDEDEA;
  --lt-line:#E2E2DE; --lt-line-strong:#C9C9C3;
  --lt-text:#111112; --lt-text-2:#5A5A5E; --lt-text-3:#8A8A8E;
  --lt-accent:#E33A16; --lt-accent-strong:#C7300F; --lt-accent-press:#B22B0D;
  --lt-accent-ink:#FFFFFF; --lt-accent-dim:#FFE7E0;
  --lt-verified:#1F7A5A; --lt-verified-dim:rgba(31,122,90,.10); --lt-verified-line:rgba(31,122,90,.40);
  --lt-warn:#A96A0C; --lt-danger:#C0392B;
  --lt-scrim:rgba(17,17,18,.40);
  --lt-shadow-sheet:0 -8px 32px rgba(17,17,18,.14);
  --lt-shadow-pop:0 4px 16px rgba(17,17,18,.12);

  /* ---- Rohwerte Dark ---- */
  --dk-bg:#0A0A0B; --dk-bg-sunk:#060607;
  --dk-surface-1:#131315; --dk-surface-2:#1B1B1E; --dk-surface-3:#242428;
  --dk-line:#2A2A2F; --dk-line-strong:#3A3A41;
  --dk-text:#F2F2F0; --dk-text-2:#A3A3A8; --dk-text-3:#6E6E75;
  --dk-accent:#FF4A24; --dk-accent-strong:#FF4A24; --dk-accent-press:#E63F1B;
  --dk-accent-ink:#0A0A0B; --dk-accent-dim:#3A1A12;
  --dk-verified:#5FBF97; --dk-verified-dim:rgba(95,191,151,.14); --dk-verified-line:rgba(95,191,151,.40);
  --dk-warn:#E8A33D; --dk-danger:#E2574B;
  --dk-scrim:rgba(0,0,0,.60);
  --dk-shadow-sheet:0 -8px 32px rgba(0,0,0,.50);
  --dk-shadow-pop:0 4px 16px rgba(0,0,0,.40);

  /* ---- Semantische Zuweisung: Light ist die Basis ---- */
  color-scheme:light;
  --bg:var(--lt-bg); --bg-sunk:var(--lt-bg-sunk);
  --surface-1:var(--lt-surface-1); --surface-2:var(--lt-surface-2); --surface-3:var(--lt-surface-3);
  --line:var(--lt-line); --line-strong:var(--lt-line-strong);
  --text:var(--lt-text); --text-2:var(--lt-text-2); --text-3:var(--lt-text-3);
  --accent:var(--lt-accent); --accent-strong:var(--lt-accent-strong); --accent-press:var(--lt-accent-press);
  --accent-ink:var(--lt-accent-ink); --accent-dim:var(--lt-accent-dim);
  --verified:var(--lt-verified); --verified-dim:var(--lt-verified-dim); --verified-line:var(--lt-verified-line);
  --warn:var(--lt-warn); --danger:var(--lt-danger);
  --focus:var(--lt-accent-strong);
  --scrim:var(--lt-scrim);
  --shadow-sheet:var(--lt-shadow-sheet); --shadow-pop:var(--lt-shadow-pop);

  /* ---- Konstant in beiden Themes (sitzt auf Bildern) ---- */
  --on-image:#F2F2F0;
  --on-image-ground:rgba(0,0,0,.72);
}

/* Dark vor der Hydration und ohne JS. Guard sorgt dafuer,
   dass eine explizite Light-Wahl das Basis-Set behaelt. */
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    color-scheme:dark;
    --bg:var(--dk-bg); --bg-sunk:var(--dk-bg-sunk);
    --surface-1:var(--dk-surface-1); --surface-2:var(--dk-surface-2); --surface-3:var(--dk-surface-3);
    --line:var(--dk-line); --line-strong:var(--dk-line-strong);
    --text:var(--dk-text); --text-2:var(--dk-text-2); --text-3:var(--dk-text-3);
    --accent:var(--dk-accent); --accent-strong:var(--dk-accent-strong); --accent-press:var(--dk-accent-press);
    --accent-ink:var(--dk-accent-ink); --accent-dim:var(--dk-accent-dim);
    --verified:var(--dk-verified); --verified-dim:var(--dk-verified-dim); --verified-line:var(--dk-verified-line);
    --warn:var(--dk-warn); --danger:var(--dk-danger);
    --focus:var(--dk-accent-strong);
    --scrim:var(--dk-scrim);
    --shadow-sheet:var(--dk-shadow-sheet); --shadow-pop:var(--dk-shadow-pop);
  }
}

/* MUSS nach dem Media-Block stehen. Gleiche Spezifitaet, Quellreihenfolge entscheidet. */
:root[data-theme="dark"]{
  color-scheme:dark;
  --bg:var(--dk-bg); --bg-sunk:var(--dk-bg-sunk);
  --surface-1:var(--dk-surface-1); --surface-2:var(--dk-surface-2); --surface-3:var(--dk-surface-3);
  --line:var(--dk-line); --line-strong:var(--dk-line-strong);
  --text:var(--dk-text); --text-2:var(--dk-text-2); --text-3:var(--dk-text-3);
  --accent:var(--dk-accent); --accent-strong:var(--dk-accent-strong); --accent-press:var(--dk-accent-press);
  --accent-ink:var(--dk-accent-ink); --accent-dim:var(--dk-accent-dim);
  --verified:var(--dk-verified); --verified-dim:var(--dk-verified-dim); --verified-line:var(--dk-verified-line);
  --warn:var(--dk-warn); --danger:var(--dk-danger);
  --focus:var(--dk-accent-strong);
  --scrim:var(--dk-scrim);
  --shadow-sheet:var(--dk-shadow-sheet); --shadow-pop:var(--dk-shadow-pop);
}
```

### 2.3 Rollen und Regeln

| Token | Rolle |
|---|---|
| `--bg` | Seiten-Ground |
| `--bg-sunk` | Bildplatzhalter, Chart-Ground, Galerie-Ground |
| `--surface-1` | Karte, Sheet, App-Bar, Tab-Bar |
| `--surface-2` | Chip, Input, Hover-Fläche |
| `--surface-3` | Press-State, aktiver Nicht-Akzent-Zustand |
| `--line` | 1px Hairline, Standardtrenner |
| `--line-strong` | aktive Border, Drag-Handle, Outline-Button |
| `--text` | Primärtext, Preise |
| `--text-2` | Sekundärzeile, Metadaten |
| `--text-3` | Timestamps, Disabled |
| `--accent` | Border, Icons, Indikatoren, aktive Zustände ohne Text darauf |
| `--accent-strong` | jede Akzentfläche, die Text trägt, und jeder Akzent-**Text** |
| `--accent-press` | Press-State der Primäraktion |
| `--accent-ink` | Text auf Akzentfläche |
| `--accent-dim` | Badge-Ground, Akzentfläche ohne Aktion |
| `--verified` | QC-verifiziert, In-Stock |
| `--warn` | wenig QC-Bilder, Preis veraltet |
| `--danger` | nicht mehr gelistet, toter Link |
| `--focus` | `outline: 2px solid var(--focus); outline-offset: 2px` |

Harte Regeln:

- `--verified`, `--warn`, `--danger` sind **Status**. Nie Dekoration, nie Aktion.
- `--accent` ist **Aktion**. Nie Status. Der alte `--stamp` war beides gleichzeitig, das wird beim Umbau aufgetrennt.
- Genau ein Akzent im gesamten Produkt. Kein zweiter Markenton.
- Farbe darf nie die einzige Information sein. Status immer Farbe plus Icon plus Text.
- **Kontrast-Ausnahmen, dokumentiert:** `--text-3` liegt bei 3,9:1 (Dark) beziehungsweise 3,4:1 (Light). Nur für Disabled-Zustände und redundante Metadaten verwenden, nie für Information, die gelesen werden muss. `--warn` liegt in Light bei 4,3:1, dort die Farbe auf Icon und Border beschränken und den Meldungstext in `--text` setzen.
- Alle anderen Textkombinationen liegen über 4,5:1 und sind AA-konform.

---

## 3. Typografie

### 3.1 Familien

| Variable | Familie | Einsatz |
|---|---|---|
| `--font-ui` | Geist, dahinter `-apple-system, "Segoe UI", sans-serif` | gesamte Oberfläche, Fließtext, Kartentitel |
| `--font-data` | Geist Mono, dahinter `ui-monospace, "SF Mono", monospace` | jede Zahl: Preis, CNY, EUR, Gewicht, Fee, QC-Zähler, Item-ID, Trefferzahl, Timestamp |
| `--font-display` | Archivo, Breitenachse `wdth` | Wortmarke, Sektionstitel im Sheet, Empty-State-Titel |

Regeln:

- `--font-data` bekommt global `font-variant-numeric: tabular-nums`. Zahlen dürfen bei Re-Render nicht springen.
- `--font-display` läuft immer als `font-variation-settings: "wdth" 80, "wght" 780`, `text-transform: uppercase`, `letter-spacing: -0.01em`. Nur dort, nie in Fließtext.
- Weights: **400 / 460 / 560 / 700**. Bewusst keine runden 500 und 600, damit die UI kein Default-Gefühl bekommt. Alle drei Familien werden variabel geladen, die Zwischenwerte sind also echt.
- Keine Serife irgendwo in der UI. Keine Kursive.

### 3.2 Skala

| Token | rem | px | line-height | letter-spacing | Familie / Weight | Einsatz |
|---|---|---|---|---|---|---|
| `--fs-display` | 2.0 | 32 | 1.02 | -0.02em | display 780 | Wortmarke, Sheet-Sektionstitel |
| `--fs-h1` | 1.375 | 22 | 1.15 | -0.015em | ui 700 | Detailseiten-Titel |
| `--fs-h2` | 1.125 | 18 | 1.25 | -0.01em | ui 560 | Sektionsköpfe, Sheet-Header |
| `--fs-body` | 0.9375 | 15 | 1.45 | 0 | ui 400 | Fließtext, Sheet-Copy, Button-Label |
| `--fs-card` | 0.8125 | 13 | 1.3 | 0 | ui 460 | Kartentitel, zweizeilig geklemmt |
| `--fs-price` | 1.0 | 16 | 1.1 | -0.01em | data 560 | Primärpreis auf Karte |
| `--fs-price-lg` | 1.75 | 28 | 1.05 | -0.02em | data 560 | Preis auf Detailseite |
| `--fs-meta` | 0.75 | 12 | 1.35 | 0.01em | data 400 | Agent, Fee, Zeit, IDs, QC-Zähler |
| `--fs-micro` | 0.6875 | 11 | 1.2 | 0.04em | ui 560, uppercase | Badges, Chip-Labels, Tab-Labels |
| `--fs-input` | 1.0 | 16 | 1.2 | 0 | ui 400 | **jedes** Eingabefeld |

`--fs-input` ist keine Stilentscheidung: iOS Safari zoomt bei Fokus auf jedes Feld unter 16px. Alle `input`, `select` und `textarea` laufen auf `1rem`, ohne Ausnahme, auch die schmalen Preisfelder.

Line-height und Tracking gehören immer zur Größe. Deshalb als Klassenpaare umsetzen, nicht als lose `font-size`-Zuweisung:

```css
.t-card{font:460 var(--fs-card)/1.3 var(--font-ui);letter-spacing:0}
.t-price{font:560 var(--fs-price)/1.1 var(--font-data);letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.t-meta{font:400 var(--fs-meta)/1.35 var(--font-data);letter-spacing:.01em;font-variant-numeric:tabular-nums}
.t-micro{font:560 var(--fs-micro)/1.2 var(--font-ui);letter-spacing:.04em;text-transform:uppercase}
```

Fließtext maximal 65 Zeichen pro Zeile (`max-width: 65ch`). Betrifft nur Sheet-Copy und Rechtstexte, nicht Kartentitel.

### 3.3 Einbindung in Next 16

**Verifiziert gegen die installierte Version**, nicht geraten:

- `web/node_modules/next/package.json` → Next **16.2.10**.
- `web/node_modules/next/dist/compiled/@next/font/dist/google/index.d.ts` enthält `declare function Geist` (Zeile 5515) und `declare function Geist_Mono` (Zeile 5525).
- `font-data.json` derselben Version: `Geist` und `Geist Mono` jeweils `weights: [100..900, "variable"]`, `axes: [{tag:"wght",min:100,max:900}]`, `subsets: ["cyrillic","latin","latin-ext"]`.
- `Archivo` ebendort: `axes: [{tag:"wdth",min:62,max:125},{tag:"wght",min:100,max:900}]`, im Typing als `axes?: 'wdth'[]` exponiert.

**Ergebnis: alle drei Familien kommen über `next/font/google`. Kein `next/font/local`, keine Font-Dateien im Repo, kein `@fontsource`-Paket.** Geist wird von Google Fonts ausgeliefert und ist in der Font-Liste dieser Next-Version enthalten. Die Design-DNA-Notiz "self-hostbar via `@fontsource-variable/geist`" ist damit überholt und wird nicht umgesetzt.

Weitere geprüfte Details aus `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`:

- `weight` ist nur bei nicht-variablen Fonts Pflicht. Wird es weggelassen, lädt Next die variable Version. Deshalb steht unten nirgends ein `weight`, und deshalb funktionieren die Weights 460 und 560 überhaupt.
- `axes` fordert zusätzliche Achsen an. Ohne `axes: ["wdth"]` liefert Archivo nur `wght`, und `font-variation-settings: "wdth" 80` bliebe wirkungslos.
- `display` ist standardmäßig `swap`, wird hier trotzdem explizit gesetzt.

Fertiger Block für `web/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const ui = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
  fallback: ["-apple-system", "Segoe UI", "sans-serif"],
});

const data = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-data",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-display",
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  title: "Kern Search",
  description:
    "Durchsuchbare Datenbank ueber 100.000+ Finds aus 75 Spreadsheets, mit Agent-Link-Converter, QC-Suche und Collections.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230A0A0B'/%3E%3Crect x='4' y='24' width='24' height='3' fill='%23FF4A24'/%3E%3Ctext x='16' y='21' font-family='sans-serif' font-size='19' font-weight='800' fill='%23F2F2F0' text-anchor='middle'%3EK%3C/text%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${ui.variable} ${data.variable} ${display.variable}`}>
      <body>
        {/* Dark ist der Default. Nur eine explizite Light-Wahl weicht ab. */}
        <script dangerouslySetInnerHTML={{ __html:
          `try{var p=JSON.parse(localStorage.getItem("prefs")||"{}");document.documentElement.dataset.theme=p.theme==="light"?"light":"dark";if(p.lang)document.documentElement.lang=p.lang}catch(e){document.documentElement.dataset.theme="dark"}` }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Zwingend dazu: `components/Prefs.tsx:10` von `theme: "light"` auf `theme: "dark"` ändern. Sonst überschreibt Prefs beim ersten Effect-Lauf das Dark-Default und die Seite blitzt hell auf.

Archivo ist der einzige Font, der gestrichen werden darf, wenn das Ladebudget knapp wird. Dann übernimmt Geist 700 in Caps mit `letter-spacing: .04em`. Geist Sans und Geist Mono sind nicht verhandelbar.

---

## 4. Spacing, Radien, Border, Schatten

### 4.1 Spacing

4er-Basis. Zwischenwerte werden nicht erfunden.

```css
--s-1:.25rem;  /*  4 */
--s-2:.5rem;   /*  8 */
--s-3:.75rem;  /* 12 */
--s-4:1rem;    /* 16 */
--s-5:1.5rem;  /* 24 */
--s-6:2rem;    /* 32 */
--s-7:3rem;    /* 48 */
```

Feste Anwendungen: Seitenrand mobil `--s-3`. Grid-Gutter mobil `--s-2`. Karten-Innenpadding `--s-2`. Sektionsabstand `--s-5`. Sheet-Innenpadding `--s-3`.

Container: `max-width: 1400px; margin-inline: auto`. Unterseiten mit Formularen `max-width: 680px`.

Vollhöhe immer `min-height: 100dvh`, nie `100vh`.

### 4.2 Radien

```css
--r-img:4px;
--r-card:6px;
--r-control:6px;
--r-sheet:12px 12px 0 0;
--r-pill:999px;
```

`--r-pill` ausschließlich für Filterchips und Zähler-Badges. Obergrenze für alles andere ist 12px. Nichts darüber, nie.

### 4.3 Border und Schatten

- **Grundregel: Border, nicht Schatten.** Jede Fläche trennt sich über `1px solid var(--line)`.
- Tiefe entsteht durch tonale Schichtung `--bg` → `--surface-1` → `--surface-2` → `--surface-3`. Das ist das Discord-Prinzip und ersetzt Elevation vollständig.
- Karten, Chips, Inputs, Buttons, Badges, Tab-Bar: **kein** `box-shadow`. Ausnahmslos.
- Genau zwei Schatten existieren im gesamten Produkt:
  - `--shadow-sheet` für Bottom-Sheets und die sticky Aktionsleiste. Er markiert, dass darunter noch Inhalt liegt.
  - `--shadow-pop` für Dropdowns und Toasts.
- Trust-Ausnahme statt Elevation: QC-verifizierte Karten bekommen `border-color: var(--verified-line)`. Sie schweben nicht, sie leuchten eine Spur.
- Borderbreite ist immer 1px. Die 1.5px und 2px aus dem Bestand entfallen komplett.

---

## 5. Komponenten

Globale Regel: jedes interaktive Element hat mindestens **44 mal 44 CSS-Pixel** Trefferfläche. Wo die sichtbare Fläche kleiner ist, wird sie über ein Pseudo-Element vergrößert, nicht über Padding, damit das Layout unangetastet bleibt:

```css
.hit-44{position:relative}
.hit-44::after{content:"";position:absolute;inset:-6px;/* passt 32px auf 44px */}
```

Globale Fokus-Regel für alle Komponenten: `:focus-visible{outline:2px solid var(--focus);outline-offset:2px}`. Nie `outline:none` ohne Ersatz. `:focus` ohne `-visible` wird nirgends gestylt.

Globale Hover-Regel: alle Hover-Zustände stehen in `@media (hover:hover) and (pointer:fine)`. Auf Touch gibt es keinen Hover, nur Press.

### 5.1 Produktkarte

Grid mobil: `grid-template-columns: repeat(2,1fr); gap: var(--s-2)`, Seitenrand `--s-3`. Ab 640px `repeat(auto-fill,minmax(180px,1fr))`, Gutter `--s-3`.

| Eigenschaft | Wert |
|---|---|
| Fläche | `--surface-1`, `1px solid var(--line)`, `--r-card`, `overflow:hidden` |
| Medium | `aspect-ratio:1`, `object-fit:cover`, Ground `--bg-sunk`, feste `width`/`height` gegen CLS |
| Preis-Pille | im Bild, `bottom:6px; left:6px`, Padding `3px 7px`, Radius `--r-img`, Ground `--on-image-ground`, `backdrop-filter:blur(8px)`, Text `--on-image`, `--fs-meta` |
| Body | Padding `--s-2`, Spalte, Gap `--s-1` |
| Zeile 1 | EUR-Näherung `--fs-meta` `--text-2`, rechts QC-Badge |
| Zeile 2 | Titel `--fs-card`, `-webkit-line-clamp:2`, `min-height:2.6em` |
| Zeile 3 | Quelle und QC-Zahl, `--fs-meta` `--text-3`, Trenner Mittelpunkt `·` |
| Trefferfläche | gesamte Karte, weit über 44px |

Zustände:

- default: `border-color: var(--line)`
- hover: `border-color: var(--line-strong)`. Kein Zoom, kein Lift, kein Schatten.
- active: `background: var(--surface-2)`. Keine Skalierung.
- focus-visible: globale Fokus-Regel auf der Karte selbst
- verifiziert: `border-color: var(--verified-line)`
- disabled: existiert nicht. Eine nicht mehr verfügbare Karte bleibt klickbar und trägt ein `--danger`-Badge.

Bildbudget: maximal 40 KB pro Thumbnail, AVIF mit WebP-Fallback, `loading="lazy"` ab der zweiten Reihe, `decoding="async"`.

### 5.2 Kompaktzeile

Power-User-Modus, umschaltbar per Dichte-Toggle in der Ergebniszeile.

| Eigenschaft | Wert |
|---|---|
| Höhe | 64px, `border-bottom:1px solid var(--line)` |
| Thumbnail | 48 mal 48, `--r-img`, Ground `--bg-sunk`, `object-fit:cover` |
| Layout | `grid-template-columns:48px 1fr auto`, Gap `--s-3`, Padding-inline `--s-3` |
| Titel | `--fs-card`, einzeilig, `text-overflow:ellipsis` |
| Metazeile | `--fs-meta` `--text-2`, Format `¥328 · ≈42 € · weidian · 24 QC` |
| Trefferfläche | ganze Zeile, 64px |

Zustände: hover `background: var(--surface-2)`, active `background: var(--surface-3)`, focus-visible global, kein disabled.

### 5.3 Filter-Chip

Sitzt in einer sticky horizontal scrollbaren Leiste direkt unter dem Suchfeld. Leiste: `overflow-x:auto`, `scrollbar-width:none`, `padding-block:6px`, `overscroll-behavior-x:contain`, Gap `--s-2`.

| Eigenschaft | Wert |
|---|---|
| Höhe sichtbar | 32px, Trefferfläche 44px über `::after{inset:-6px}` |
| Padding | `0 var(--s-3)` |
| Radius | `--r-pill` |
| Typo | `--fs-micro` |
| Zahl im Chip | `--font-data`, `tabular-nums` |

| Zustand | Fläche | Border | Text |
|---|---|---|---|
| default | `--surface-2` | `--line` | `--text-2` |
| hover | `--surface-2` | `--line-strong` | `--text` |
| active (gedrückt) | `--surface-3` | `--line-strong` | `--text` |
| ausgewählt | `--accent-strong` | `--accent-strong` | `--accent-ink` |
| ausgewählt, gedrückt | `--accent-press` | `--accent-press` | `--accent-ink` |
| focus-visible | unverändert | unverändert | plus globaler Outline |
| disabled | `--surface-2` | `--line` | `--text-3`, `pointer-events:none` |

Semantik: `<button type="button" aria-pressed>`. Kein `role="tab"`, das ist im Bestand falsch verwendet.
Ein Chip mit Optionen trägt ein Chevron-Icon und öffnet das Bottom-Sheet. Ein Chip ohne Optionen schaltet direkt um.
Der Verified-Chip ist der einzige Chip, der im nicht ausgewählten Zustand farbig ist: `border-color: var(--verified-line)`, `color: var(--verified)`.

### 5.4 Suchfeld

| Eigenschaft | Wert |
|---|---|
| Höhe | 44px |
| Breite | volle Spaltenbreite |
| Fläche | `--surface-2`, `1px solid var(--line)`, `--r-control` |
| Padding | `0 40px 0 38px` (Lupe links 12px, 18px Icon; Clear rechts) |
| Typo | `--fs-input` (16px, Pflicht) |
| Placeholder | `--text-3` |
| Clear-Button | 32 mal 32 sichtbar, 44px Trefferfläche, nur wenn Wert vorhanden |

Zustände: hover `border-color: var(--line-strong)`, focus-visible `border-color: var(--line-strong)` plus globaler Outline, disabled `--text-3` und `--surface-2`.
`type="search"`, `autoComplete="off"`, `enterKeyHint="search"`, `inputMode="search"`.
Debounce bleibt bei 90ms. Kein Spinner während der Suche, kein Zurücksetzen der Scrollposition.

Alle anderen Formularfelder erben Höhe 44px, `--fs-input`, `--r-control` und dieselben Zustände. Label steht immer über dem Feld (`--fs-micro`, `--text-2`), Fehlertext darunter (`--fs-meta`, `--danger`, mit Icon). Keine Floating Labels.

### 5.5 Bottom-Sheet

Ersetzt auf Mobil jedes Modal. Ab 768px wird derselbe Inhalt als zentrierter Dialog mit `--r-card`, `--shadow-pop` und `max-width:880px` gerendert.

| Bereich | Spezifikation |
|---|---|
| Scrim | `--scrim`, deckt die volle Fläche, Tap schließt |
| Fläche | `--surface-1`, `--r-sheet`, `border-top:1px solid var(--line)`, `--shadow-sheet` |
| Höhe | `max-height:85dvh`, Inhalt scrollt innen |
| Drag-Handle | 36 mal 4, `--r-pill`, `--line-strong`, 8px Abstand oben, zentriert |
| Header | 44px, Titel `--fs-h2` links, Close 44 mal 44 rechts |
| Optionszeile | 44px, Label links, Zahl rechtsbündig in `--font-data` `tabular-nums`, Checkbox oder Radio links |
| Footer | sticky im Sheet, `border-top:1px solid var(--line)`, `--surface-1`, Padding `--s-3`, unten `calc(var(--s-3) + env(safe-area-inset-bottom))` |
| Footer-Buttons | 48px hoch, links "Zurücksetzen" als Ghost, rechts "Anwenden" in `--accent-strong`, Verhältnis 1 zu 1.4 |

Zustände Optionszeile: hover `--surface-2`, active `--surface-3`, ausgewählt Häkchen in `--accent-strong` plus `color: var(--text)`, focus-visible global.

Verhalten: `aria-modal="true"`, Fokusfalle im Sheet, Escape schließt, Fokus kehrt beim Schließen auf das auslösende Element zurück, Hintergrund bekommt `inert`. Body-Scroll wird gesperrt, ohne dass die Scrollposition verloren geht.

### 5.6 Bottom-Tab-Bar

Die einzige permanente Daumenzone. Vier Items: Suche, Feed, Saved, Konto.

| Eigenschaft | Wert |
|---|---|
| Position | `position:fixed; inset-inline:0; bottom:0`, über allem außer Sheet und Scrim |
| Höhe | 56px plus `env(safe-area-inset-bottom)` als Padding |
| Fläche | `--surface-1`, `border-top:1px solid var(--line)`, **kein** Schatten |
| Item | `flex:1`, mindestens 44 mal 44, Spalte, Gap 2px, zentriert |
| Icon | 22px, 1.5px Stroke, `currentColor` |
| Label | `--fs-micro` |

Zustände: default `--text-3`, hover `--text-2`, active `--text`, ausgewählt `--accent-strong` für Icon und Label plus `aria-current="page"`, focus-visible global mit `outline-offset:-2px`, damit die Outline nicht aus der Leiste ragt.
Kein Badge-Punkt außer bei Saved mit ungelesenem Zustand, dann 6px Punkt in `--accent`.
Der Seiteninhalt bekommt `padding-bottom: calc(56px + env(safe-area-inset-bottom))`, damit nichts unter der Leiste verschwindet.

### 5.7 Agent-Link-Button

Die einzige Aktion, die zählt. Sitzt permanent in der sticky Aktionsleiste unten rechts auf der Detailseite.

Aktionsleiste: `position:sticky; bottom:0`, `--surface-1`, `border-top:1px solid var(--line)`, `--shadow-sheet`, Padding `--s-3`, unten plus `env(safe-area-inset-bottom)`, zwei Buttons mit Gap `--s-2`.

| Eigenschaft | Primär (Agent öffnen) | Sekundär (Link kopieren) |
|---|---|---|
| Höhe | 52px | 52px |
| Flex | 1.2 | 1 |
| Radius | `--r-control` | `--r-control` |
| Fläche | `--accent-strong` | transparent |
| Border | keine | `1px solid var(--line-strong)` |
| Text | `--accent-ink`, `--fs-body` 560 | `--text`, `--fs-body` 460 |
| Label | `→ CNFans`, Agentname aus der Auswahl oben | `Link kopieren` |

Zustände Primär: hover `--accent-press`, active `--accent-press` plus `transform: translateY(1px)`, focus-visible global, disabled `--surface-2` mit `--text-3` und `pointer-events:none`.
Zustände Sekundär: hover `border-color: var(--text-3)` und `background: var(--surface-2)`, active `--surface-3`, Erfolgszustand nach dem Kopieren: Label wird für 1600ms zu `Kopiert` mit Häkchen-Icon in `--verified`, ohne Animation und ohne Toast.

Die Agent-Auswahl weiter oben auf der Seite schreibt das Label des Primärbuttons um. Unten wird nie geraten.
Die Agentliste selbst ist ein Chip-Grid nach 5.3, der aktive Agent trägt den Chip-Zustand "ausgewählt". Bei mehr als acht Agents wandert die Liste in ein Bottom-Sheet.

### 5.8 QC-Badge

Zeigt die Anzahl vorhandener QC-Bilder. Nicht interaktiv auf der Karte, interaktiv auf der Detailseite (springt zur Galerie).

| Eigenschaft | Wert |
|---|---|
| Höhe | 20px |
| Padding | `0 6px` |
| Radius | `--r-img` |
| Fläche | `--surface-2`, `1px solid var(--line)` |
| Typo | Zahl in `--font-data` `--fs-meta` `tabular-nums`, Einheit "QC" in `--fs-micro` |
| Farbe | `--text-2` |

Schwellen: 0 Bilder `--text-3` und Label `keine QC`, 1 bis 4 Bilder `--warn` für Border und Icon, ab 5 Bildern `--text-2`, ab 15 Bildern zusätzlich Häkchen-Icon in `--verified`.
Interaktive Variante: 44px Trefferfläche über `::after{inset:-12px}`, hover `border-color: var(--line-strong)`, active `--surface-3`, focus-visible global.

### 5.9 Verified-Badge

Zwei Erscheinungsformen.

**Auf der Karte**, oben links über dem Bild:

| Eigenschaft | Wert |
|---|---|
| Höhe | 22px |
| Padding | `0 8px` |
| Radius | `--r-img` |
| Fläche | `--verified-dim` über `--on-image-ground`, `backdrop-filter:blur(8px)` |
| Border | `1px solid var(--verified-line)` |
| Inhalt | Schild-Icon 12px 1.5px Stroke plus Bewertung in `--font-data` `--fs-micro` |
| Farbe | `--verified` |

Nicht interaktiv, kein Touch-Minimum. Die Karte darunter trägt `border-color: var(--verified-line)`.

**Auf der Detailseite**, als Block:

| Eigenschaft | Wert |
|---|---|
| Fläche | `--verified-dim`, `1px solid var(--verified-line)`, `--r-card` |
| Padding | `--s-3` |
| Titel | `--fs-body` 560, `--verified`, mit Schild-Icon |
| Untertitel | `--fs-meta`, `--text-2`, zum Beispiel `24 Bilder aus 6 Bestellungen` |
| Schatten | keiner |

Der Bestand nutzt `★` als Glyph. Das wird durch ein Schild-Icon aus dem 1.5px-Stroke-Set ersetzt. Symbolzeichen aus dem Zeichensatz sind kein Icon-System.

---

## 6. Motion

### 6.1 Tokens

```css
--dur-instant:90ms;   /* Chip-Toggle, Checkbox, Press-Feedback */
--dur-fast:140ms;     /* Hover, Fokus, Farbwechsel, Badge-Update */
--dur-base:200ms;     /* Sheet oeffnen, Tab-Wechsel, Galerie-Snap */
--dur-slow:280ms;     /* Detailuebergang, Sheet schliessen */
--ease-out:cubic-bezier(.16,1,.3,1);    /* alles, was hereinkommt */
--ease-in:cubic-bezier(.4,0,1,1);       /* alles, was verschwindet */
--ease-move:cubic-bezier(.32,.72,0,1);  /* getriebene Bewegung */
```

Spring für gestengetriebene Flächen: `stiffness 320, damping 34, mass 0.9`. Als Konstante im JS-Modul, nicht in CSS.

### 6.2 Regeln

1. **Die Liste bewegt sich nie.** Kein Stagger, kein Fade-in beim Nachladen, kein Skeleton-Shimmer, kein Mount-Transform. Neue Items erscheinen sofort und hart. Die bestehende `.card{animation:in .18s}` in `globals.css` wird ersatzlos gestrichen, sie ist der prominenteste Verstoß im Bestand.
2. Bewegung ist ausschließlich Reaktion auf eine Berührung. Nichts animiert von selbst, es gibt keine Loop-Animationen, keinen Pulse, kein Float.
3. Bilder animieren nicht. Kein Ken Burns, kein Zoom on Hover, kein Fade beim Laden. Platzhalter ist eine ruhige Fläche in `--bg-sunk`, das Bild ersetzt sie hart.
4. Nur `transform` und `opacity` werden animiert. Jede Animation auf `width`, `height`, `top`, `left`, `margin` oder `filter` ist ein Bug.
5. Ladezustand: Platzhalterblöcke in den exakten Kartenmaßen, Fläche `--bg-sunk`, **ohne** Shimmer, ohne Puls, ohne Farbwechsel. Ein statischer Platz reserviert Layout, mehr soll er nicht tun.

### 6.3 Gesten

Betrifft Bottom-Sheet-Drag und QC-Galerie-Swipe. Hier gelten andere Gesetze als für Zustandsübergänge.

- Eine Geste ist Direktmanipulation, keine Animation. Die Fläche folgt dem Finger 1 zu 1, ohne Verzögerung und ohne Easing.
- **Keine CSS-Transitions und keine `@keyframes` für Gesten.** Umsetzung über Pointer Events plus `requestAnimationFrame`, Position wird pro Frame direkt als `transform: translate3d()` gesetzt.
- Die Bewegung startet immer beim **aktuellen Bildschirmwert**, nie bei einem Sollwert. Vor jedem neuen Drag wird die tatsächliche Transform-Matrix ausgelesen.
- Beim Loslassen erbt die Fläche die **Velocity** des Fingers. Velocity wird aus den letzten drei Pointer-Samples berechnet, nicht aus der Gesamtdistanz. Der Auslauf ist der Spring aus 6.1 auf den nächsten Snap-Punkt.
- Jede laufende Bewegung ist **jederzeit greifbar und umkehrbar**. Ein `pointerdown` mitten im Spring bricht ihn ab und übernimmt Position und Velocity als Startwerte. Kein Warten auf das Ende einer Transition.
- Sheet-Schwellen: schließen bei Verschiebung über 35 Prozent der Sheet-Höhe **oder** bei Loslass-Velocity über 0.5 px/ms nach unten. Sonst zurück in die offene Position.
- Über die obere Kante hinaus wird der Widerstand progressiv gedämpft (Faktor 0.35), das Sheet gibt nach, geht aber nicht mit.
- QC-Galerie: horizontales natives Scrolling mit `scroll-snap-type: x mandatory`, `scroll-snap-align: center` und `overscroll-behavior-x: contain`. Das ist die eine Stelle, an der der Browser Momentum, Unterbrechbarkeit und Velocity bereits korrekt liefert. Eigene Swipe-Logik dort ist eine Verschlechterung. Der Zähler `n/m` aktualisiert per `IntersectionObserver`, nicht per Scroll-Handler.

### 6.4 prefers-reduced-motion

```css
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.01ms!important;
    animation-iteration-count:1!important;
    transition-duration:.01ms!important;
    scroll-behavior:auto!important;
  }
}
```

Präzisierung, die die Pauschalregel nicht abdeckt:

- Sheets erscheinen und verschwinden hart, ohne Slide. Der Scrim schaltet ebenfalls hart.
- Der **Drag selbst bleibt aktiv**. Direktmanipulation ist keine Animation, und ein Sheet, das dem Finger nicht mehr folgt, ist kaputt, nicht barrierearm. Reduziert wird nur der Spring beim Loslassen: statt auszuschwingen springt die Fläche sofort auf den Zielwert.
- Scroll-Snap in der Galerie bleibt, `scroll-behavior` wird auf `auto` gesetzt.
- `.01ms` statt `0ms`, damit `transitionend` weiterhin feuert und Zustandsautomaten nicht hängen bleiben.

---

## 7. Mapping der Bestands-Klassen

Mechanisch abarbeitbar. Links der Ist-Zustand aus `globals.css` und `page.tsx`, rechts das Ziel.

### 7.1 Tokens

| Alt | Neu | Anmerkung |
|---|---|---|
| `--paper` | `--bg` | Werte komplett neu |
| `--card` | `--surface-1` | |
| `--ink` | `--text` | war auch Button-Fläche, dort jetzt `--surface-3` oder `--accent-strong` |
| `--muted` | `--text-2` | |
| `--stamp` | `--accent` / `--accent-strong` / `--danger` | **auftrennen**: Aktion, Akzenttext, Fehler waren dieselbe Variable |
| `--line` | `--line` | Name bleibt, Wert neu |
| `--line-strong` | `--line-strong` | Name bleibt, Wert neu |
| `--thumb-bg` | `--bg-sunk` | |
| `--shadow` | entfällt | nur `--shadow-sheet` und `--shadow-pop` existieren noch |
| `--font-body` | `--font-ui` | IBM Plex Sans → Geist |
| `--font-mono` | `--font-data` | IBM Plex Mono → Geist Mono |
| `--font-disp` | `--font-display` | Barlow Condensed → Archivo mit `wdth` 80 |

### 7.2 Klassen

| Alt | Neu | Komponente / Regel |
|---|---|---|
| `header.site` | `.app-bar` | 44px, sticky, `--surface-1`, `border-bottom:1px solid var(--line)` (statt 2px `--ink`) |
| `.head-inner` | `.app-bar__inner` | Seitenrand `--s-3` |
| `.head-top` | `.app-bar__row` | |
| `h1.logo` | `.wordmark` | `--font-display`, `wdth` 80, `wght` 780, `--fs-display` |
| `.logo .tick` | `.wordmark__mark` | `color: var(--accent)` |
| `.manifest` | `.app-bar__count` | `--font-data` `--fs-meta` `--text-2`, Zahl `tabular-nums` |
| `.userbar`, `.you` | `.app-bar__user`, `.app-bar__user-name` | wandert auf Mobil in den Konto-Tab (5.6) |
| `.searchrow` | **aufgelöst** | 7 Controls in einer Zeile werden zu: Suchfeld (5.4) plus Chip-Leiste (5.3) plus Ergebniszeile |
| `#q` | `.search__input` | 44px, `--fs-input` 16px |
| `.pricefld` | `.sheet-row__input` | wandert ins Preis-Sheet, 44px, 16px |
| `select` (Währung, Sprache, Sort) | `.segmented__btn` bzw. `.sheet-row` | Währung und Sprache ins Konto-Sheet, Sort in die Ergebniszeile |
| `.iconbtn` | `.icon-btn` | 44 mal 44, Stroke-Icon statt Glyph |
| `.iconbtn.wide` | `.btn.btn--ghost` | |
| `.chips` | `.chip-strip` | sticky unter der Suche, horizontal scrollbar |
| `.chip` | `.chip` | 5.3, Radius `--r-pill`, `--fs-micro` |
| `.chip.on` | `.chip[aria-pressed="true"]` | `role="tablist"` im Bestand ist falsch, ersatzlos |
| `.chip.vchip` | `.chip--verified` | `--verified-line` |
| `main.wrap` | `.page` | Seitenrand `--s-3`, `padding-bottom: calc(56px + env(safe-area-inset-bottom))` |
| `#grid` | `.grid` | mobil `repeat(2,1fr)`, Gutter `--s-2` |
| `.card` | `.card` | 5.1, `border-top:2px` entfällt, Mount-Animation entfällt |
| `.thumb` | `.card__media` | |
| `.thumb .ph` | `.card__media-fallback` | statische Fläche `--bg-sunk`, Initialen in `--text-3`, kein Shimmer |
| `.vbadge` | `.badge--verified` | 5.9, `★` wird Schild-Icon, Fläche nicht mehr `--stamp` |
| `.savebtn` / `.savebtn.saved` | `.save-btn` / `[aria-pressed="true"]` | 32px sichtbar, 44px Trefferfläche, `+`/`✓` werden Stroke-Icons |
| `.card-body` | `.card__body` | Padding `--s-2` |
| `.name` | `.card__title` | `--fs-card`, 2 Zeilen |
| `.meta` | `.card__meta` | |
| `.price` | `.card__price-pill` | wandert als Pille ins Bild (5.1) |
| `.src`, `.cny` | `.card__source`, `.card__price-sub` | `--font-data` |
| `.morebtn` | entfällt | Infinite Scroll per `IntersectionObserver`, Fallback-Button als `.btn--ghost` volle Breite 48px |
| `.empty`, `.empty .big` | `.empty`, `.empty__title` | Titel `--font-display` |
| `.loading` | `.grid-placeholder` | statische Blöcke in Kartenmaßen, kein Text, kein Shimmer |
| `footer.site` | `.site-footer` | |
| `.modal-back` | `.scrim` | `--scrim`, Tap schließt |
| `.modal` | `.sheet` mobil / `.dialog` ab 768px | 5.5 |
| `.modal-close` | `.icon-btn` | 44 mal 44 |
| `.modal-grid` | `.detail` | mobil eine Spalte, Galerie oben |
| `.modal-img` | `.gallery` | QC-Galerie, `object-fit:contain`, Scroll-Snap, Zähler `n/m` |
| `.modal-info` | `.detail__body` | Padding `--s-3` |
| `.modal-brand` | `.detail__eyebrow` | `--fs-micro`, `--text-2` (nicht mehr `--stamp`) |
| `.modal-name` | `.detail__title` | `--fs-h1` |
| `.modal-price .eur` | `.detail__price` | `--fs-price-lg`, `--text` (nicht mehr Akzent) |
| `.modal-price .cny` | `.detail__price-sub` | `--fs-body`, `--text-2` |
| `.modal-meta` | `.detail__meta` | `--font-data` `--fs-meta` |
| `.vnote`, `.vr` | `.verified-block`, `.verified-block__title` | 5.9, `--verified` statt `--stamp` |
| `.mod-sec` | `.section-title` | `--fs-h2` |
| `.linkgrid` | `.agent-grid` | Chip-Grid |
| `.linkgrid a` | `.chip` | 5.3, 44px Trefferfläche |
| `.linkgrid a.fav` | entfällt hier | wird zur Primäraktion in `.action-bar` (5.7) |
| `.orig-btn` | `.action-bar .btn--primary` | 52px, sticky unten |
| `.btn`, `.btn.ghost` | `.btn`, `.btn--ghost` | 44px Minimum, `--r-control`, Border 1px |
| `.smallbtn`, `.smallbtn.primary` | `.btn--sm`, `.btn--primary` | `--fs-meta`, Trefferfläche trotzdem 44px |
| `.notice`, `.ok`, `.err` | `.notice`, `.notice--ok`, `.notice--err` | `--verified` / `--danger`, jeweils mit Icon |
| `.rowcard` | `.row` | 5.2, 64px |
| `.rowcard img` | `.row__thumb` | 48 mal 48 |
| `.rowcard .nm`, `.mt` | `.row__title`, `.row__meta` | |
| `.rowcard .grow` | entfällt | Grid statt Flex-Grow |
| `.rowcard .actions` | `.row__actions` | |
| `.page` (Unterseiten) | `.page--narrow` | `max-width:680px` |
| `.page h2`, `.sub` | `.page__title`, `.page__sub` | |
| `.field`, `.field label`, `.field input` | `.field`, `.field__label`, `.field__input` | Label `--fs-micro`, Input 16px |
| `.ob-row`, `.ob-label` | `.sheet-row`, `.sheet-row__label` | Onboarding wird ein Bottom-Sheet |
| `.seg`, `.segbtn`, `.segbtn.on` | `.segmented`, `.segmented__btn`, `[aria-pressed="true"]` | 44px hoch |
| `.agentgrid` | `.agent-grid` | mobil 2 Spalten, ab 8 Agents ins Sheet |
| `body.modal-open` | `.is-locked` | Scroll-Sperre ohne Positionsverlust, plus `inert` auf dem Hintergrund |

### 7.3 Dateien

- `web/app/page.module.css` **löschen**. Kein Modul importiert sie (verifiziert per Grep über `app/` und `components/`). Sie ist unverändertes create-next-app-Boilerplate und enthält mit `#fafafa`, `#000`, `#666`, `border-radius:128px` und `letter-spacing:-2.4px` ausschließlich Werte, die diese Spezifikation verbietet.
- `web/app/globals.css` vollständig neu schreiben, Reihenfolge: Tokens (Abschnitt 2.2) → Reset → Typo-Klassen (3.2) → Layout → Komponenten (5) → Motion (6.4).

### 7.4 Bugs im Bestand, die beim Umbau mit erledigt werden

1. `globals.css:11-12` · `:root[data-theme="dark"] html` kann nie greifen, weil `html` und `:root` dasselbe Element sind. `color-scheme` gehört direkt auf `:root`, wie in 2.2 umgesetzt.
2. `globals.css:126-129` · `.card{animation:in .18s ease both}` animiert bei einer Batch-Größe von 120 jede Karte beim Mount. Genau das verbietet Regel 6.2.1. Ersatzlos streichen.
3. `Prefs.tsx:10` · `theme: "light"` als Default widerspricht der Dark-first-Haltung und überschreibt nach der Hydration das Inline-Script. Auf `"dark"` ändern.
4. `page.tsx:264` · `role="tablist"` auf der Chip-Leiste, ohne dass es Tabs oder Tabpanels gibt. Screenreader melden eine Struktur, die nicht existiert. Ersatzlos entfernen, Chips sind `<button aria-pressed>`.
5. `page.tsx:235-262` · sieben Controls in einer Zeile. Auf Mobil ergibt das eine unbedienbare Wurst. Auflösung nach 7.2.
6. Glyphen als Icons: `☀`, `☾`, `⚄`, `★`, `✓`, `+`, `×`, `→`. Alle durch das 1.5px-Stroke-Icon-Set ersetzen. Nur `·` bleibt als Trenner in Metazeilen.

---

## 8. Verbotsliste

Diese Punkte sind Ausschlusskriterien im Review. Ein Diff, der einen davon enthält, wird nicht freigegeben.

**Typografie**
- `Inter` in jeder Form, auch als Fallback.
- `Fraunces` und jede andere Serife in der UI. Keine der elf Referenzen nutzt Serifen im Interface.
- Generische Serifen (`Times New Roman`, `Georgia`, `Garamond`, `Palatino`).
- Runde Weights 500 und 600. Es gilt 400 / 460 / 560 / 700.
- Eingabefelder unter 16px.

**Farbe**
- AI-Purple `#6366f1`, `#8b5cf6` und die gesamte Familie dazwischen. Auch Discord-Blurple `#5865F2` ist gesperrt, es liegt zu nah daran und zu nah am Original.
- Beige und Brass als Fashion-Editorial-Reflex.
- Reines Schwarz `#000000` als Fläche.
- Ein zweiter Akzent. Es gibt genau einen.
- Farbe als einzige Informationsquelle.
- `--accent` als Status oder `--verified` / `--warn` / `--danger` als Dekoration.

**Form und Fläche**
- Radien über 12px. Insbesondere die 24px-Tailwind-Default-Watte und die 128px aus dem Boilerplate.
- `box-shadow` auf Karten, Chips, Inputs, Buttons, Badges, Tab-Bar. Es existieren nur `--shadow-sheet` und `--shadow-pop`.
- Gradient-Blobs, Mesh-Gradients, Noise-Overlays, Glassmorphism-Panels. `backdrop-filter` ist ausschließlich für Pillen über Bildern zugelassen.
- Verlaufs-Overlays auf Bildern. Text auf Bild sitzt auf einer harten Pille.
- Neon- und Outer-Glow-Effekte, farbige Fokus-Schatten.
- Ein Hero. Die App startet in der Suche.
- Drei gleich große Karten nebeneinander als Feature-Reihe.
- Überlappende Elemente. Jedes Element hat seine eigene Fläche.

**Motion**
- Skeleton-Shimmer in jeder Form.
- Stagger- und Cascade-Animationen auf Listen.
- Mount-Animationen auf Karten, Zeilen oder Grid-Items.
- Endlos-Loops: Pulse, Float, Typewriter, Breathing.
- Zoom oder Fade auf Bildern.
- Animation von `width`, `height`, `top`, `left`, `margin`, `filter`.
- CSS-Transitions oder `@keyframes` für gestengetriebene Flächen.
- Bouncing Chevrons, Scroll-Indikatoren, "nach unten wischen"-Hinweise.
- Custom Mouse Cursors.

**Text und Inhalt**
- Emoji im Interface. Symbole aus dem Zeichensatz sind ebenfalls kein Icon-System, es gilt das 1.5px-Stroke-Set.
- Em-Dash im Fließtext. Es gibt Punkt, Komma und den Mittelpunkt `·` als Trenner in Metazeilen.
- Marketing-Vokabular: "Elevate", "Seamless", "Unleash", "Next-Gen", "Supercharge", "Unlock".
- Erfundene Rundzahlen wie "99,99 Prozent" oder "50 Prozent schneller".
- Platzhalternamen wie "John Doe", "Acme", "Nexus".
- Kaputte Unsplash-Links in Platzhaltern.

---

## 9. Reihenfolge für den Umbau

1. `globals.css` Kopf durch Abschnitt 2.2 ersetzen, `layout.tsx` durch den Font-Block aus 3.3, `Prefs.tsx:10` auf `"dark"`. Danach beide Themes durchschalten und prüfen, dass explizite Light-Wahl bei Systemeinstellung Dark wirklich hell bleibt.
2. `page.module.css` löschen.
3. Typo-Klassen und Spacing-Tokens anlegen, dann Karte und Grid nach 5.1 umbauen. Mount-Animation streichen.
4. Suchfeld und Chip-Leiste nach 5.3 und 5.4, `searchrow` auflösen.
5. Bottom-Tab-Bar nach 5.6, Seiten-Padding anpassen.
6. Modal zu Bottom-Sheet nach 5.5, Gestenlogik nach 6.3.
7. Detailseite: Galerie, Verified-Block, Aktionsleiste nach 5.7 bis 5.9.
8. Kompaktliste nach 5.2 plus Dichte-Toggle.
9. Unterseiten und Formulare nach 5.4 angleichen.
10. Gegen Abschnitt 8 prüfen, dann `web-quality-audit` und `review-animations`.
