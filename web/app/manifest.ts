import type { MetadataRoute } from "next";

// Eingebaute Konvention: Next liefert das hier unter /manifest.webmanifest aus.
// Keine Request-time-API im Rumpf, deshalb wird die Datei zur Build-Zeit statisch erzeugt.
//
// Die Icons stehen bewusst als fertige PNG in public/icons und nicht als
// app/icon.tsx: Manifest-Icons brauchen stabile, langlebig cachebare URLs, und
// Android zieht sie beim Installieren mehrfach. Erzeugt von scripts/gen-icons.mjs.
// app/icon.tsx wuerde bei jedem Cache-Miss neu gerendert werden, ohne Gegenwert.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kina Search",
    short_name: "Kina",
    description:
      "Durchsuchbare Datenbank ueber 100.000+ Finds aus 75 Spreadsheets, mit Agent-Link-Converter, QC-Suche und Collections.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Dark ist der Default der Oberflaeche, also auch Splash- und Statusleistenfarbe.
    background_color: "#0A0A0B",
    theme_color: "#0A0A0B",
    lang: "de",
    dir: "ltr",
    categories: ["shopping", "utilities"],
    // Kein Zwang zu Hochformat: die Suche ist im Querformat auf Tablets nutzbar.
    orientation: "any",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Motiv auf 70 Prozent geschrumpft, damit Androids adaptive Maske nichts abschneidet.
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
