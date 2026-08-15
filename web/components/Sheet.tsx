"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IcClose } from "@/components/Icons";

// Feder aus DESIGN.md 6.1. Nur der Auslauf nach dem Loslassen federt,
// der Drag selbst ist Direktmanipulation ohne Easing.
const K = 320, D = 34, M = 0.9;
const CLOSE_RATIO = 0.35;   // Weg ueber 35 Prozent der Sheet-Hoehe schliesst
const CLOSE_VEL = 0.5;      // px/ms nach unten schliesst auch unter der Wegschwelle
const RESIST = 0.35;        // Widerstand ueber die obere Kante hinaus
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export type SheetProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Als Funktion aufgerufen bekommt der Footer das gefederte Schliessen. */
  footer?: React.ReactNode | ((dismiss: () => void) => React.ReactNode);
  /** Ab 768px wird derselbe Inhalt als zentrierter Dialog gerendert. */
  wide?: boolean;
};

export default function Sheet({ title, onClose, children, footer, wide }: SheetProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);
  const yRef = useRef(0);
  const vRef = useRef(0);
  const rafRef = useRef(0);
  const hRef = useRef(0);
  const deskRef = useRef(false);
  const reduceRef = useRef(false);
  const closingRef = useRef(false);
  const dragRef = useRef<{ id: number; startY: number; baseY: number; s: { t: number; y: number }[] } | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Portal am body, damit der restliche Baum inert gesetzt werden kann.
  useEffect(() => {
    const el = document.createElement("div");
    el.className = "sheet-host";
    document.body.appendChild(el);
    const others = Array.from(document.body.children).filter((c) => c !== el && c.tagName !== "SCRIPT");
    for (const o of others) o.setAttribute("inert", "");
    document.body.classList.add("is-locked");
    const opener = document.activeElement as HTMLElement | null;
    setHost(el);
    return () => {
      for (const o of others) o.removeAttribute("inert");
      document.body.classList.remove("is-locked");
      el.remove();
      opener?.focus?.();
    };
  }, []);

  const apply = useCallback(() => {
    const el = sheetRef.current;
    if (!el || deskRef.current) return;
    el.style.transform = `translate3d(0,${yRef.current}px,0)`;
    const s = scrimRef.current;
    if (s && hRef.current) s.style.opacity = String(Math.max(0, 1 - yRef.current / hRef.current));
  }, []);

  const spring = useCallback((target: number, done?: () => void) => {
    cancelAnimationFrame(rafRef.current);
    if (reduceRef.current) {
      // Reduced Motion: kein Ausschwingen, sofort auf den Zielwert.
      yRef.current = target; vRef.current = 0; apply(); done?.(); return;
    }
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const a = (-K * (yRef.current - target) - D * vRef.current) / M;
      vRef.current += a * dt;
      yRef.current += vRef.current * dt;
      if (Math.abs(yRef.current - target) < 0.5 && Math.abs(vRef.current) < 20) {
        yRef.current = target; vRef.current = 0; apply(); done?.(); return;
      }
      apply();
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [apply]);

  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (deskRef.current) { closeRef.current(); return; }
    spring(hRef.current + 48, () => closeRef.current());
  }, [spring]);

  // Oeffnen: von der Unterkante hoch, Startwert ist der tatsaechliche Bildschirmwert.
  useEffect(() => {
    if (!host) return;
    deskRef.current = window.matchMedia("(min-width:768px)").matches;
    reduceRef.current = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    const el = sheetRef.current;
    if (el && !deskRef.current) {
      hRef.current = el.offsetHeight;
      yRef.current = hRef.current;
      vRef.current = 0;
      apply();
      spring(0);
    }
    const first = el?.querySelector<HTMLElement>(FOCUSABLE);
    (first || el)?.focus?.();
    return () => cancelAnimationFrame(rafRef.current);
  }, [host, apply, spring]);

  // Escape schliesst, Tab bleibt im Sheet.
  useEffect(() => {
    if (!host) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); dismiss(); return; }
      if (e.key !== "Tab") return;
      const el = sheetRef.current;
      if (!el) return;
      const f = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [host, dismiss]);

  function onDown(e: React.PointerEvent) {
    if (deskRef.current) return;
    // Der Close-Knopf liegt im Greifbereich, darf aber nicht als Drag starten.
    if ((e.target as Element).closest("button")) return;
    cancelAnimationFrame(rafRef.current);   // laufende Feder abbrechen, greifbar bleiben
    const el = sheetRef.current;
    if (!el) return;
    const tf = getComputedStyle(el).transform;
    yRef.current = tf && tf !== "none" ? new DOMMatrixReadOnly(tf).m42 : 0;
    hRef.current = el.offsetHeight;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = { id: e.pointerId, startY: e.clientY, baseY: yRef.current, s: [{ t: e.timeStamp, y: e.clientY }] };
  }

  function onMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.id) return;
    let next = d.baseY + (e.clientY - d.startY);
    if (next < 0) next *= RESIST;
    yRef.current = next;
    d.s.push({ t: e.timeStamp, y: e.clientY });
    if (d.s.length > 3) d.s.shift();
    apply();
  }

  function onUp(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.id) return;
    dragRef.current = null;
    // Velocity aus den letzten drei Samples, nicht aus der Gesamtdistanz.
    const a = d.s[0], b = d.s[d.s.length - 1];
    const dt = b.t - a.t;
    const vms = dt > 0 ? (b.y - a.y) / dt : 0;
    vRef.current = vms * 1000;
    if (yRef.current > hRef.current * CLOSE_RATIO || vms > CLOSE_VEL) dismiss();
    else spring(0);
  }

  if (!host) return null;

  return createPortal(
    <div className="scrim" ref={scrimRef} onPointerDown={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <div className={`sheet${wide ? " sheet--wide" : ""}`} ref={sheetRef} role="dialog" aria-modal="true"
        aria-label={title} tabIndex={-1}>
        <div className="sheet__grab" onPointerDown={onDown} onPointerMove={onMove}
          onPointerUp={onUp} onPointerCancel={onUp}>
          <span className="sheet__handle" aria-hidden />
          <div className="sheet__head">
            <h2 className="sheet__title">{title}</h2>
            <button className="icon-btn" type="button" onClick={dismiss} aria-label="Schliessen">
              <IcClose />
            </button>
          </div>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__footer">{typeof footer === "function" ? footer(dismiss) : footer}</div>}
      </div>
    </div>,
    host,
  );
}
