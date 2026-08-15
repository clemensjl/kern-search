// Erzeugt die statischen App-Icons einmalig zur Autorenzeit: node scripts/gen-icons.mjs
// Bewusst statisch statt app/icon.tsx zur Laufzeit, siehe Kommentar in app/manifest.ts.
// Das Motiv ist reine Vektorgeometrie, damit kein Font-Fallback die Strichstaerke bestimmt.
import mod from "next/og.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { ImageResponse } = mod;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Tokens aus DESIGN.md, Dark-Set: --dk-bg, --dk-text, --dk-accent.
const BG = "#0A0A0B";
const INK = "#F2F2F0";
const ACCENT = "#FF4A24";

// Kondensiertes, schweres K als Polygon im 32er-Raster (Archivo wdth 80 / wght 780 nachgebaut).
const K_PATH =
  "M9.5 5.5 H13.2 V11.7 L18.2 5.5 H22.5 L16.4 13.1 L22.9 21.5 H18.4 L13.2 15.1 V21.5 H9.5 Z";

// scale < 1 schrumpft das Motiv um den Mittelpunkt, der Grund bleibt randlos.
function artwork(scale) {
  const g =
    scale === 1
      ? ""
      : ` transform="translate(16 16) scale(${scale}) translate(-16 -16)"`;
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
    `<rect width="32" height="32" fill="${BG}"/>` +
    `<g${g}><path d="${K_PATH}" fill="${INK}"/>` +
    `<rect x="4" y="24" width="24" height="3" fill="${ACCENT}"/></g></svg>`
  );
}

async function png(size, scale) {
  const src =
    "data:image/svg+xml;base64," + Buffer.from(artwork(scale)).toString("base64");
  const el = {
    type: "div",
    props: {
      style: { width: "100%", height: "100%", display: "flex" },
      children: { type: "img", props: { src, width: size, height: size } },
    },
  };
  const res = new ImageResponse(el, { width: size, height: size });
  return Buffer.from(await res.arrayBuffer());
}

// ICO mit eingebettetem PNG: 6 Byte ICONDIR + 16 Byte ICONDIRENTRY + Nutzdaten.
function ico(pngBuf, size) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(1, 4);
  head.writeUInt8(size >= 256 ? 0 : size, 6);
  head.writeUInt8(size >= 256 ? 0 : size, 7);
  head.writeUInt8(0, 8);
  head.writeUInt8(0, 9);
  head.writeUInt16LE(1, 10);
  head.writeUInt16LE(32, 12);
  head.writeUInt32LE(pngBuf.length, 14);
  head.writeUInt32LE(22, 18);
  return Buffer.concat([head, pngBuf]);
}

function out(rel, buf) {
  const p = resolve(ROOT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, buf);
  console.log(rel, buf.length, "B");
}

// Maskable bei 0.70: das Motiv liegt damit rund 21 Prozent vom Rand entfernt
// und vollstaendig in Androids Safe-Zone-Kreis (Durchmesser 80 Prozent).
const MASK = 0.7;

out("public/icons/icon-192.png", await png(192, 1));
out("public/icons/icon-512.png", await png(512, 1));
out("public/icons/maskable-192.png", await png(192, MASK));
out("public/icons/maskable-512.png", await png(512, MASK));
out("app/apple-icon.png", await png(180, 1));
out("app/favicon.ico", ico(await png(32, 1), 32));
