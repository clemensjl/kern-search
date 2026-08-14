"use client";
import { useEffect, useState } from "react";
import Sheet from "@/components/Sheet";
import { IcMoon, IcSun } from "@/components/Icons";
import { AGENTS } from "@/lib/agents";
import type { Cur } from "@/lib/data";
import { t, type Lang, type TKey } from "@/lib/i18n";
import type { Theme } from "@/components/Prefs";

export type Draft = { pmin: string; pmax: string; cur: Cur; lang: Lang; theme: Theme; agent: string };

export default function FilterSheet({ init, countFor, onApply, onClose }: {
  init: Draft;
  countFor: (pmin: string, pmax: string, cur: Cur) => number;
  onApply: (d: Draft) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<Draft>(init);
  const [hits, setHits] = useState(() => countFor(init.pmin, init.pmax, init.cur));
  const tr = (k: TKey) => t(d.lang, k);
  const set = (p: Partial<Draft>) => setD((o) => ({ ...o, ...p }));

  // Trefferzahl live, aber entprellt: die Zaehlung laeuft ueber alle Items.
  useEffect(() => {
    const id = setTimeout(() => setHits(countFor(d.pmin, d.pmax, d.cur)), 120);
    return () => clearTimeout(id);
  }, [d.pmin, d.pmax, d.cur, countFor]);

  const locale = d.lang === "en" ? "en-GB" : "de-AT";
  const seg = (on: boolean) => `segbtn${on ? " on" : ""}`;

  return (
    <Sheet title={d.lang === "en" ? "Filter" : "Filter"} onClose={onClose}
      footer={(dismiss) => (
        <>
          <button className="btn btn--ghost sheet__footer-reset" type="button"
            onClick={() => set({ pmin: "", pmax: "" })}>
            {d.lang === "en" ? "Reset" : "Zurücksetzen"}
          </button>
          <button className="btn sheet__footer-apply" type="button"
            onClick={() => { onApply(d); dismiss(); }}>
            {d.lang === "en" ? "Show" : "Anzeigen"} <b>{hits.toLocaleString(locale)}</b>{" "}
            {tr("hits")}
          </button>
        </>
      )}>
      <div className="sheet-sec">
        <div className="sheet-sec__title">{d.lang === "en" ? "Price range" : "Preisbereich"}</div>
        <div className="sheet-row sheet-row--price">
          <label className="field" style={{ margin: 0, flex: 1 }}>
            <span className="field__label">{d.cur === "EUR" ? tr("price_min") : "$ min"}</span>
            <input className="sheet-row__input" inputMode="decimal" value={d.pmin}
              onChange={(e) => set({ pmin: e.target.value })} />
          </label>
          <label className="field" style={{ margin: 0, flex: 1 }}>
            <span className="field__label">{d.cur === "EUR" ? tr("price_max") : "$ max"}</span>
            <input className="sheet-row__input" inputMode="decimal" value={d.pmax}
              onChange={(e) => set({ pmax: e.target.value })} />
          </label>
        </div>
      </div>

      <div className="sheet-sec">
        <div className="sheet-sec__title">{tr("ob_cur")}</div>
        <div className="seg">
          <button className={seg(d.cur === "EUR")} type="button" aria-pressed={d.cur === "EUR"}
            onClick={() => set({ cur: "EUR" })}>€ EUR</button>
          <button className={seg(d.cur === "USD")} type="button" aria-pressed={d.cur === "USD"}
            onClick={() => set({ cur: "USD" })}>$ USD</button>
        </div>
      </div>

      <div className="sheet-sec">
        <div className="sheet-sec__title">{tr("ob_lang")}</div>
        <div className="seg">
          <button className={seg(d.lang === "de")} type="button" aria-pressed={d.lang === "de"}
            onClick={() => set({ lang: "de" })}>Deutsch</button>
          <button className={seg(d.lang === "en")} type="button" aria-pressed={d.lang === "en"}
            onClick={() => set({ lang: "en" })}>English</button>
        </div>
      </div>

      <div className="sheet-sec">
        <div className="sheet-sec__title">{tr("ob_theme")}</div>
        <div className="seg">
          <button className={seg(d.theme === "light")} type="button" aria-pressed={d.theme === "light"}
            onClick={() => set({ theme: "light" })}><IcSun size={16} /> {tr("ob_light")}</button>
          <button className={seg(d.theme === "dark")} type="button" aria-pressed={d.theme === "dark"}
            onClick={() => set({ theme: "dark" })}><IcMoon size={16} /> {tr("ob_dark")}</button>
        </div>
      </div>

      <div className="sheet-sec">
        <div className="sheet-sec__title">{tr("ob_agent")}</div>
        <p className="sheet-sec__hint">{tr("ob_agent_sub")}</p>
        <div className="agent-grid">
          {AGENTS.map((a) => {
            const key = a.n.toLowerCase();
            return (
              <button key={a.n} type="button" className="chip" aria-pressed={d.agent === key}
                onClick={() => set({ agent: key })}>{a.n}</button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}
