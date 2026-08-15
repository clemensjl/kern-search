"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AGENTS } from "@/lib/agents";
import type { Lang } from "@/lib/i18n";
import type { Cur } from "@/lib/data";

export type Theme = "light" | "dark";
export type Prefs = { cur: Cur; lang: Lang; theme: Theme; agent: string };

const DEFAULTS: Prefs = { cur: "EUR", lang: "de", theme: "dark", agent: "litbuy" };

// Ohne gespeicherte Wahl folgt das Theme dem System, nicht einem festen Wert.
function systemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return DEFAULTS.theme;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

const Ctx = createContext<{
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  needsOnboarding: boolean;
  finishOnboarding: () => void;
}>({ prefs: DEFAULTS, setPrefs: () => {}, needsOnboarding: false, finishOnboarding: () => {} });

export const usePrefs = () => useContext(Ctx);

// Die Agentenliste ist von 21 auf 6 geschrumpft. Ein Bestandsnutzer mit einem
// gestrichenen Agenten (z. B. "mulebuy") bekommt seine Links ueber AGENTS[0],
// waehrend Filter- und Onboarding-Sheet nur auf Gleichheit vergleichen und
// deshalb keinen Eintrag als gewaehlt zeigen. Kein Absturz, aber ein
// widerspruechlicher Zustand - deshalb einmal beim Laden geradeziehen.
function normalizeAgent(agent: string): string {
  return AGENTS.some((a) => a.n.toLowerCase() === agent) ? agent : DEFAULTS.agent;
}

function load(): Prefs {
  if (typeof window === "undefined") return DEFAULTS;
  // Gespeicherte Wahl steht hinter der Systemvorgabe und gewinnt deshalb.
  const base: Prefs = { ...DEFAULTS, theme: systemTheme() };
  try {
    const p: Prefs = { ...base, ...JSON.parse(localStorage.getItem("prefs") || "{}") };
    return { ...p, agent: normalizeAgent(p.agent) };
  } catch {
    return base;
  }
}

export default function PrefsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULTS);
  const [needsOnboarding, setNeeds] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = load();
    setPrefsState(p);
    setReady(true);
    if (status !== "authenticated") return;
    (async () => {
      const r = await fetch("/api/prefs");
      if (!r.ok) return;
      const d = await r.json();
      if (d.currency) {
        const merged: Prefs = {
          cur: d.currency ?? p.cur, lang: d.language ?? p.lang,
          theme: d.theme ?? p.theme, agent: normalizeAgent(d.agent ?? p.agent),
        };
        setPrefsState(merged);
        localStorage.setItem("prefs", JSON.stringify(merged));
      } else if (!localStorage.getItem("prefs")) {
        setNeeds(true);
      }
    })();
  }, [status]);

  // Erst nach load() schreiben, sonst blitzt der Startwert ueber die Systemvorgabe.
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.lang = prefs.lang;
  }, [ready, prefs.theme, prefs.lang]);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((old) => {
      const next = { ...old, ...patch };
      localStorage.setItem("prefs", JSON.stringify(next));
      if (status === "authenticated") {
        fetch("/api/prefs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ currency: next.cur, language: next.lang, theme: next.theme, agent: next.agent }),
        });
      }
      return next;
    });
  }, [status]);

  const finishOnboarding = useCallback(() => setNeeds(false), []);

  return (
    <Ctx.Provider value={{ prefs, setPrefs, needsOnboarding, finishOnboarding }}>
      {children}
    </Ctx.Provider>
  );
}
