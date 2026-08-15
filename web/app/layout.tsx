import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

// Kein weight -> Next laedt die variable Version, erst damit gibt es 460 und 560.
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

// axes wdth ist Pflicht, sonst bleibt font-variation-settings:"wdth" 80 wirkungslos.
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-display",
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  title: "Kina Search",
  description:
    "Durchsuchbare Datenbank ueber 100.000+ Finds aus 75 Spreadsheets, mit Agent-Link-Converter, QC-Suche und Collections.",
  // Kein icons-Feld mehr: dateibasierte Metadaten haben in Next hoehere Prioritaet
  // und wuerden es ohnehin ueberschreiben. app/favicon.ico und app/apple-icon.png
  // liefern jetzt beide echten Marken (erzeugt von scripts/gen-icons.mjs).
  // Die Manifest-Icons haengen davon unabhaengig in app/manifest.ts.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFBFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0B" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${ui.variable} ${data.variable} ${display.variable}`}>
      <body>
        {/* Nur eine ausdrueckliche Wahl setzt das Attribut. Ohne Wahl entscheidet
            prefers-color-scheme in globals.css, damit bleibt die Systemvorgabe gueltig. */}
        <script dangerouslySetInnerHTML={{ __html:
          `try{var p=JSON.parse(localStorage.getItem("prefs")||"{}");if(p.theme==="dark"||p.theme==="light")document.documentElement.dataset.theme=p.theme;if(p.lang)document.documentElement.lang=p.lang}catch(e){}` }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
