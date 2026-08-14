import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        // Der Service Worker darf nie aus dem HTTP-Cache kommen, sonst klebt eine
        // fehlerhafte Fassung am Client fest. Empfehlung aus dem lokalen PWA-Guide.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          // Achtung: die CSP des SW-Skripts gilt auch fuer die Anfragen, die der
          // Worker selbst stellt. Das im Guide abgedruckte "default-src 'self'"
          // blockiert damit items.json von GitHub Pages und jedes Produktbild von
          // den Shop-CDNs, der Cache bliebe leer. Gesperrt bleibt, worauf es
          // ankommt: fremder ausfuehrbarer Code via importScripts.
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'; connect-src *; img-src *",
          },
        ],
      },
      {
        // Gleiches Argument fuer die Offline-Seite: sie wird vom SW vorgehalten,
        // eine veraltete Kopie im Browsercache bringt nichts.
        source: "/offline.html",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
