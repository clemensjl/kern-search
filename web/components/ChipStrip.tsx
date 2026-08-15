"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { IcChevronLeft, IcChevronRight, IcShield } from "@/components/Icons";

// Die Leiste war immer schon scrollbar (overflow-x:auto). Was fehlte, war der
// Hinweis darauf: scrollbar-width:none blendet die Bildlaufleiste aus, die
// Leiste schnitt hart an der Containerkante ab, und ein Mausrad scrollt nicht
// horizontal. Sichtbar wird der Weg jetzt ueber drei Dinge, die alle denselben
// Zustand lesen: eine verblassende Kante auf der Seite, auf der noch Inhalt
// liegt, zwei Pfeilknoepfe auf Zeigergeraeten, und Pfeiltasten-Navigation.

// Etwas mehr als die 36px der Fade-Kante in globals.css: ein herangeholtes
// Chip soll vollstaendig frei stehen, nicht halb unter dem Verlauf, sonst
// verliert der Fokusring am Rand seine Deutlichkeit.
const PAD = 44;
const LAP = 80;    // Ueberlappung zweier Seitenspruenge, damit nichts uebersprungen wird

function reduced() {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
}

export type ChipStripProps = {
  /** Kategorien in Anzeigereihenfolge, ohne den "Alle"-Chip. */
  cats: string[];
  /** Aktive Kategorie, leerer String bedeutet "Alle". */
  cat: string;
  onPick: (c: string) => void;
  /** Uebersetzung eines Kategorienamens. */
  label: (c: string) => string;
  /** Name der Verifiziert-Kategorie, bekommt als einzige ein Icon. */
  verified: string;
};

export default function ChipStrip({ cats, cat, onPick, label, verified }: ChipStripProps) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const mounted = useRef(false);
  const [edge, setEdge] = useState({ of: false, l: false, r: false });

  const keys = ["", ...cats];
  const active = Math.max(0, keys.indexOf(cat));
  // Rovierender Tabindex: die Leiste ist ein Tabstopp, nicht fuenfzehn.
  const [cursor, setCursor] = useState(active);
  const at = Math.min(cursor, keys.length - 1);

  useEffect(() => { setCursor(active); }, [active]);

  const measure = useCallback(() => {
    const s = stripRef.current;
    if (!s) return;
    const max = s.scrollWidth - s.clientWidth;
    const next = { of: max > 1, l: s.scrollLeft > 1, r: s.scrollLeft < max - 1 };
    setEdge((p) => (p.of === next.of && p.l === next.l && p.r === next.r ? p : next));
  }, []);

  // Holt ein Chip vollstaendig in den Sichtbereich, ohne die Seite zu scrollen.
  // Deshalb keine scrollIntoView: das wuerde auch vertikal mitziehen.
  const reveal = useCallback((el: HTMLElement | null, smooth: boolean) => {
    const s = stripRef.current;
    if (!s || !el) return;
    const sr = s.getBoundingClientRect(), er = el.getBoundingClientRect();
    const dl = er.left - sr.left, dr = er.right - sr.right;
    let x = s.scrollLeft;
    if (dl < PAD) x += dl - PAD;
    else if (dr > -PAD) x += dr + PAD;
    else return;
    // scrollTo klemmt selbst auf [0, max].
    s.scrollTo({ left: x, behavior: smooth && !reduced() ? "smooth" : "auto" });
  }, []);

  // Seitensprung, buendig an einer Chipkante. Ohne die Ausrichtung landet man
  // wieder mitten in einem Wort, und genau das war die Beschwerde.
  const page = useCallback((dir: 1 | -1) => {
    const s = stripRef.current;
    if (!s) return;
    const sr = s.getBoundingClientRect();
    const goal = s.scrollLeft + dir * Math.max(120, s.clientWidth - LAP);
    let best = dir === 1 ? s.scrollWidth : 0, bd = Infinity;
    for (const c of btns.current) {
      // Schrumpft die Kategorieliste, koennen abgehaengte Knoten im Array
      // stehenbleiben. Deren Rechteck ist durchgehend 0 und wuerde den
      // Zielvergleich verfaelschen.
      if (!c || !c.isConnected) continue;
      const l = c.getBoundingClientRect().left - sr.left + s.scrollLeft;
      const d = Math.abs(l - goal);
      if (d < bd) { bd = d; best = l; }
    }
    s.scrollTo({ left: best, behavior: reduced() ? "auto" : "smooth" });
  }, []);

  function onKey(e: React.KeyboardEvent) {
    const last = keys.length - 1;
    let next = at;
    if (e.key === "ArrowRight") next = at >= last ? 0 : at + 1;
    else if (e.key === "ArrowLeft") next = at <= 0 ? last : at - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setCursor(next);
    const el = btns.current[next];
    // preventScroll, damit der Browser nicht gegen reveal() arbeitet.
    el?.focus({ preventScroll: true });
    reveal(el, true);
  }

  // Nach jedem Render neu messen, nicht nur wenn sich die Anzahl der Chips
  // aendert: ein Sprachwechsel tauscht bloss die Beschriftungen aus und
  // veraendert die Gesamtbreite trotzdem. measure() setzt nur dann Zustand,
  // wenn sich eine Kante wirklich verschoben hat, das laeuft also nicht rund.
  useLayoutEffect(measure);

  // Die aktive Kategorie ins Bild holen, vor dem Paint und ohne Animation,
  // damit beim Laden niemand auf eine Auswahl blickt, die er nicht sieht.
  useLayoutEffect(() => {
    reveal(btns.current[active], mounted.current);
    mounted.current = true;
  }, [reveal, active, cats.length]);

  useEffect(() => {
    const s = stripRef.current;
    if (!s) return;
    s.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(s);
    // Chipbreiten aendern sich, sobald Geist geladen ist.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => { s.removeEventListener("scroll", measure); ro.disconnect(); };
  }, [measure]);

  return (
    <div className="chip-rail" data-of={edge.of ? "1" : "0"}
      data-l={edge.l ? "1" : "0"} data-r={edge.r ? "1" : "0"}>
      {/* Zeigergeraet-Zubehoer. Auf Touch wischt man, dort sind die Knoepfe
          per Media Query weg. Fuer die Tastatur uebernehmen die Pfeiltasten,
          deshalb liegen sie ausserhalb der Tabreihenfolge. onMouseDown haelt
          den Fokus dort, wo er war: ein Klick auf den Pfeil soll blaettern und
          nicht die Tastaturposition aus der Leiste ziehen. */}
      <button className="chip-rail__nav" type="button" tabIndex={-1}
        aria-label="Kategorien zurück" disabled={!edge.l}
        onMouseDown={(e) => e.preventDefault()} onClick={() => page(-1)}>
        <IcChevronLeft size={18} />
      </button>

      <div className="chip-scroll">
        <div className="chip-strip" ref={stripRef} role="toolbar"
          aria-orientation="horizontal" aria-label="Kategorie" onKeyDown={onKey}>
          {keys.map((c, i) => (
            <button key={c || "_all"} type="button" aria-pressed={cat === c}
              ref={(el) => { btns.current[i] = el; }}
              tabIndex={i === at ? 0 : -1}
              className={`chip${c === verified ? " chip--verified" : ""}`}
              onClick={() => onPick(cat === c && c !== "" ? "" : c)}>
              {c === verified && <IcShield size={13} />}{label(c || "Alle")}
            </button>
          ))}
        </div>
      </div>

      <button className="chip-rail__nav" type="button" tabIndex={-1}
        aria-label="Kategorien weiter" disabled={!edge.r}
        onMouseDown={(e) => e.preventDefault()} onClick={() => page(1)}>
        <IcChevronRight size={18} />
      </button>
    </div>
  );
}
