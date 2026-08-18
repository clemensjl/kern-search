"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/* Registrierung des Service Workers plus zurueckhaltender Installationshinweis.
 *
 * FLUCHTWEG: Seite mit "?sw=off" oeffnen. Der Service Worker laesst Anfragen mit
 * diesem Parameter am Cache vorbei, dieser Effekt meldet danach jede Registrierung
 * ab, loescht alle Caches und merkt sich die Abschaltung dauerhaft in localStorage
 * ("kern.pwa.off"). Solange die Marke gesetzt ist, wird nie wieder registriert.
 * Rueckgaengig mit "?sw=on". Damit laesst sich ein fehlerhaft ausgelieferter
 * Service Worker ohne Deploy und ohne DevTools loswerden.
 */

const OFF_KEY = "kern.pwa.off";
const VISITS_KEY = "kern.pwa.visits";
const DISMISS_KEY = "kern.pwa.hint-dismissed";
const MIN_VISITS = 3;

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Privatmodus ohne Speicher: Hinweis erscheint dann eben erneut. */
  }
}

// Einmalige Uebernahme der alten kina.*-Schluessel nach dem Rebranding zu Kern.
// Ohne sie verloere ein Bestandsnutzer sein PWA-Opt-out und saehe den Hinweis erneut.
function migrateLegacyKeys() {
  const pairs: Array<[string, string]> = [
    ["kina.pwa.off", OFF_KEY],
    ["kina.pwa.visits", VISITS_KEY],
    ["kina.pwa.hint-dismissed", DISMISS_KEY],
  ];
  try {
    for (const [oldKey, newKey] of pairs) {
      const v = localStorage.getItem(oldKey);
      if (v !== null) {
        if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, v);
        localStorage.removeItem(oldKey);
      }
    }
  } catch {
    /* Ohne Speicherzugriff gibt es auch nichts zu migrieren. */
  }
}

// Notausschalter: alles abmelden, alle Caches leeren, danach ohne Parameter neu laden.
// Der Reload ist wichtig, weil die gerade sichtbare Seite noch vom alten Worker
// ausgeliefert wurde. Erst der Neuladevorgang danach ist garantiert unbeeinflusst.
async function killSwitch(reload: boolean) {
  let removed = 0;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    removed = regs.length;
    await Promise.all(regs.map((r) => r.unregister()));
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch {
    /* Nichts zu tun, es gab nichts abzumelden. */
  }
  if (reload && removed > 0) location.replace(location.pathname);
}

export default function Pwa() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const started = useRef(false);

  // Service Worker registrieren, aber nur in Produktion. In der Entwicklung
  // debuggt man sonst gegen Caches eines alten Builds.
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    migrateLegacyKeys();

    const params = new URLSearchParams(window.location.search);
    if (params.get("sw") === "on") {
      try {
        localStorage.removeItem(OFF_KEY);
      } catch {}
    }
    const off = params.get("sw") === "off";
    if (off) write(OFF_KEY, "1");

    if (!("serviceWorker" in navigator)) return;
    if (off || read(OFF_KEY) === "1") {
      void killSwitch(off);
      return;
    }
    if (process.env.NODE_ENV !== "production") return;

    // updateViaCache "none" haelt den HTTP-Cache vom SW-Skript fern, sonst kann
    // eine kaputte Fassung bis zu 24 Stunden kleben bleiben.
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      /* Registrierung darf die Seite nie mitreissen. */
    });
  }, []);

  // Besuche zaehlen. Der Hinweis erscheint fruehestens beim dritten Aufruf.
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || read(DISMISS_KEY) === "1") return;

    const visits = Number(read(VISITS_KEY) || "0") + 1;
    write(VISITS_KEY, String(visits));

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    if (visits < MIN_VISITS) return;
    // Auf iOS gibt es kein beforeinstallprompt, dort zeigen wir direkt die Anleitung.
    if (ios) setShowHint(true);
  }, []);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
      if (
        read(DISMISS_KEY) !== "1" &&
        Number(read(VISITS_KEY) || "0") >= MIN_VISITS &&
        !window.matchMedia("(display-mode: standalone)").matches
      ) {
        setShowHint(true);
      }
    };
    const onInstalled = () => {
      write(DISMISS_KEY, "1");
      setShowHint(false);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    write(DISMISS_KEY, "1");
    setShowHint(false);
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    write(DISMISS_KEY, "1");
    setShowHint(false);
    setPrompt(null);
  }, [prompt]);

  if (!showHint) return null;

  return (
    <aside
      aria-label="Installationshinweis"
      style={{
        position: "fixed",
        insetInline: 0,
        bottom: "calc(56px + env(safe-area-inset-bottom))",
        zIndex: 60,
        margin: "0 auto",
        maxWidth: "34rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--s-3, .75rem)",
        padding: "var(--s-3, .75rem)",
        background: "var(--surface-1, #131315)",
        border: "1px solid var(--line, #2A2A2F)",
        borderRadius: "var(--r-card, 6px)",
        color: "var(--text, #F2F2F0)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, font: "560 .8125rem/1.3 var(--font-ui, sans-serif)" }}>
          Kern Search installieren
        </p>
        {isIos && !prompt ? (
          <p
            style={{
              margin: ".25rem 0 0",
              font: "400 .75rem/1.35 var(--font-data, monospace)",
              color: "var(--text-2, #A3A3A8)",
            }}
          >
            In Safari das Teilen-Menue oeffnen, dann Zum Home-Bildschirm.
          </p>
        ) : (
          <p
            style={{
              margin: ".25rem 0 0",
              font: "400 .75rem/1.35 var(--font-data, monospace)",
              color: "var(--text-2, #A3A3A8)",
            }}
          >
            Startet ohne Browserleiste und haelt die Datenbank offline bereit.
          </p>
        )}
      </div>

      {prompt ? (
        <button
          type="button"
          onClick={install}
          style={{
            minHeight: 44,
            padding: "0 var(--s-3, .75rem)",
            border: 0,
            borderRadius: "var(--r-control, 6px)",
            background: "var(--accent-strong, #FF4A24)",
            color: "var(--accent-ink, #0A0A0B)",
            font: "560 .9375rem/1.2 var(--font-ui, sans-serif)",
            cursor: "pointer",
          }}
        >
          Installieren
        </button>
      ) : null}

      <button
        type="button"
        onClick={dismiss}
        aria-label="Hinweis dauerhaft ausblenden"
        style={{
          width: 44,
          height: 44,
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: 0,
          borderRadius: "var(--r-control, 6px)",
          background: "transparent",
          color: "var(--text-2, #A3A3A8)",
          cursor: "pointer",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </aside>
  );
}
