"use client";
// Endpreisrechner als eigenstaendige Komponente. Haengt an keiner Seite fest,
// laesst sich spaeter in das Detail-Sheet einhaengen (Props category/goodsEur).
// Styling bewusst inline: globals.css bleibt unangetastet, nur Design-Tokens
// werden verwendet.
import { useMemo, useState } from "react";
import { calculate, parseAmount, parseWeight, COUNTRIES, SHIP_METHODS, type Country } from "@/lib/costs";
import { CATEGORY_WEIGHTS_KG, CATEGORY_WEIGHT_NOTES } from "@/lib/weights";
import { fmtCur } from "@/lib/data";
import type { Lang } from "@/lib/i18n";

const L = {
  de: {
    title: "Endpreis schätzen",
    lead: "Was am Ende wirklich abgebucht wird - Versand, Agenturgebühr und Einfuhrabgaben inklusive. Ergebnis ist eine Spanne, kein Versprechen.",
    goods: "Warenwert (EUR)",
    cat: "Kategorie",
    cat_none: "keine Angabe",
    weight: "Gewicht (kg, optional)",
    weight_ph: "leer = Annahme aus der Kategorie",
    country: "Zielland",
    method: "Versandart",
    ioss: "Verkäufer nutzt IOSS (bei Agenten selten)",
    vat_red: "Ermäßigter Steuersatz statt Normalsatz",
    result: "Geschätzter Endpreis",
    breakdown: "Aufschlüsselung",
    drivers: "Woher die Spanne kommt",
    notes: "Was du dazu wissen musst",
    assumption: "Annahme",
    missing: "Fehlende Angaben",
    days: "Laufzeit",
    days_unit: "Tage",
    weight_used: "Gerechnetes Gewicht",
    of_spread: "der Spanne",
    bad_number: "Zahl nicht lesbar - Beispiel: 1.234,56",
    bad_weight: "Gewicht nicht lesbar - Beispiel: 1,2",
  },
  en: {
    title: "Estimate the final price",
    lead: "What actually leaves your account - shipping, agent fee and import charges included. The result is a range, not a promise.",
    goods: "Item value (EUR)",
    cat: "Category",
    cat_none: "not specified",
    weight: "Weight (kg, optional)",
    weight_ph: "empty = assumption from category",
    country: "Destination",
    method: "Shipping line",
    ioss: "Seller uses IOSS (rare with agents)",
    vat_red: "Reduced VAT rate instead of standard",
    result: "Estimated final price",
    breakdown: "Breakdown",
    drivers: "Where the range comes from",
    notes: "What you need to know",
    assumption: "assumption",
    missing: "Missing input",
    days: "Transit",
    days_unit: "days",
    weight_used: "Weight used",
    of_spread: "of the range",
    bad_number: "Cannot read that number - example: 1234.56",
    bad_weight: "Cannot read that weight - example: 1.2",
  },
};

const box: React.CSSProperties = {
  border: "1px solid var(--line)", borderRadius: 6, background: "var(--surface-1)",
  padding: 16, display: "grid", gap: 14,
};
const label: React.CSSProperties = {
  display: "block", fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase",
  color: "var(--text-3)", marginBottom: 4,
};
const field: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 10px", fontSize: 15,
  border: "1px solid var(--line)", borderRadius: 4,
  background: "var(--surface-2)", color: "var(--text)",
};
const muted: React.CSSProperties = { fontSize: 12, lineHeight: 1.55, color: "var(--text-2)" };
const head: React.CSSProperties = {
  fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase",
  color: "var(--text-3)", borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 4,
};

export default function PriceCalc({ lang = "de", category, goodsEur, cnyPerEur }: {
  lang?: Lang; category?: string; goodsEur?: number; cnyPerEur?: number;
}) {
  const s = L[lang] ?? L.de;
  const [goods, setGoods] = useState(goodsEur ? String(goodsEur.toFixed(2)) : "");
  const [cat, setCat] = useState(category ?? "");
  const [weight, setWeight] = useState("");
  const [country, setCountry] = useState<Country>("AT");
  const [methodId, setMethodId] = useState("air");
  const [ioss, setIoss] = useState(false);
  const [reduced, setReduced] = useState(false);

  const cats = useMemo(() => Object.keys(CATEGORY_WEIGHTS_KG).sort((a, b) => a.localeCompare(b, "de")), []);
  const redRate = COUNTRIES[country].reduced[0];

  const goodsNum = parseAmount(goods);
  const weightNum = parseWeight(weight);
  // Eingabe da, aber nicht lesbar: sagen statt stillschweigend ignorieren.
  const goodsBad = goods.trim().length > 0 && !(goodsNum > 0);
  const weightBad = weight.trim().length > 0 && !(weightNum > 0);

  const res = useMemo(() => calculate({
    goodsEur: goodsNum,
    country,
    methodId,
    category: cat || undefined,
    weightKg: weightNum > 0 ? weightNum : undefined,
    vatRate: reduced ? redRate : undefined,
    ioss,
    cnyPerEur,
  }), [goodsNum, country, methodId, cat, weightNum, reduced, redRate, ioss, cnyPerEur]);

  const catNote = cat ? CATEGORY_WEIGHT_NOTES[cat] : undefined;
  const eur = (v: number) => fmtCur(v, "EUR");
  const kg = (v: number) => v.toLocaleString("de-AT", { maximumFractionDigits: 2 });

  return (
    <section style={box}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 560, letterSpacing: "-.01em", margin: "0 0 6px" }}>{s.title}</h2>
        <p style={muted}>{s.lead}</p>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        <div>
          <span style={label}>{s.goods}</span>
          <input style={field} inputMode="decimal" value={goods} placeholder="0,00"
            aria-invalid={goodsBad} onChange={(e) => setGoods(e.target.value)} />
          {goodsBad && <span style={{ ...muted, color: "var(--warn)" }}>{s.bad_number}</span>}
        </div>
        <div>
          <span style={label}>{s.cat}</span>
          <select style={field} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">{s.cat_none}</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <span style={label}>{s.weight}</span>
          <input style={field} inputMode="decimal" value={weight} placeholder={s.weight_ph}
            aria-invalid={weightBad} onChange={(e) => setWeight(e.target.value)} />
          {weightBad && <span style={{ ...muted, color: "var(--warn)" }}>{s.bad_weight}</span>}
        </div>
        <div>
          <span style={label}>{s.country}</span>
          <select style={field} value={country} onChange={(e) => setCountry(e.target.value as Country)}>
            {(Object.keys(COUNTRIES) as Country[]).map((c) => (
              <option key={c} value={c}>{COUNTRIES[c].label} · {Math.round(COUNTRIES[c].vat * 100)} %</option>
            ))}
          </select>
        </div>
        <div>
          <span style={label}>{s.method}</span>
          <select style={field} value={methodId} onChange={(e) => setMethodId(e.target.value)}>
            {SHIP_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, ...muted }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} />
          {s.vat_red} ({Math.round(redRate * 100)} %)
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={ioss} onChange={(e) => setIoss(e.target.checked)} />
          {s.ioss}
        </label>
      </div>

      {catNote && <p style={muted}>{catNote}</p>}

      {!res.ok ? (
        <div>
          <div style={head}>{s.missing}</div>
          <p style={{ ...muted, color: "var(--warn)" }}>{res.missing.join(", ")}</p>
          {res.notes.map((n, i) => <p key={i} style={muted}>{n}</p>)}
        </div>
      ) : (
        <>
          <div>
            <div style={head}>{s.result}</div>
            <div style={{ fontSize: 28, fontWeight: 560, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>
              {eur(res.total.min)} – {eur(res.total.max)}
            </div>
            <p style={muted}>
              {s.weight_used}: {res.weight!.min === res.weight!.max
                ? `${kg(res.weight!.min)} kg`
                : `${kg(res.weight!.min)} – ${kg(res.weight!.max)} kg`}
              {res.weightSource === "category" ? ` (${s.assumption})` : ""}
              {res.days ? ` · ${s.days} ${res.days.min}–${res.days.max} ${s.days_unit}` : ""}
            </p>
          </div>

          <div>
            <div style={head}>{s.breakdown}</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
              <tbody>
                {res.lines.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "7px 0", fontSize: 13 }}>
                      {l.label}
                      {l.assumption && <span style={{ ...muted, marginLeft: 6, fontSize: 11 }}>({s.assumption})</span>}
                    </td>
                    <td style={{ padding: "7px 0", fontSize: 13, textAlign: "right", whiteSpace: "nowrap" }}>
                      {l.min === l.max ? eur(l.min) : `${eur(l.min)} – ${eur(l.max)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {res.drivers.length > 0 && (
            <div>
              <div style={head}>{s.drivers}</div>
              <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                {res.drivers.map((d) => (
                  <div key={d.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10, alignItems: "center" }}>
                    <div style={{ fontSize: 13 }}>
                      {d.label}
                      <div style={{ height: 4, borderRadius: 2, background: "var(--surface-3)", marginTop: 4 }}>
                        <div style={{ height: 4, borderRadius: 2, width: `${Math.round(d.share * 100)}%`, background: "var(--accent)" }} />
                      </div>
                    </div>
                    <div style={{ ...muted, textAlign: "right", whiteSpace: "nowrap" }}>
                      {Math.round(d.share * 100)} % {s.of_spread} · {eur(d.eur)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={head}>{s.notes}</div>
            <ul style={{ ...muted, margin: "6px 0 0", paddingLeft: 18, display: "grid", gap: 4 }}>
              {res.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
