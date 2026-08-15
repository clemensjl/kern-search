// Endpreisrechner: Warenwert -> Inlandsversand China -> Agenturgebuehr ->
// internationaler Versand -> Einfuhrabgaben.
//
// Grundsatz des Moduls: Ehrlichkeit vor Genauigkeit. Es gibt keine Punktzahl,
// sondern eine Spanne, jede Annahme ist benannt, und der Rechner weist aus,
// welche Annahme wie viel zur Spanne beitraegt. Fehlt eine Angabe, sagt er das,
// statt zu raten.
//
// Alle Stellschrauben stehen im Konstantenblock ganz oben. Was nicht sicher
// belegt ist, traegt den Marker UNSICHER und ist im Zweifel vor dem naechsten
// Livegang zu pruefen.

import { weightForCategory, type WeightRange } from "./weights";

export type Range = { min: number; max: number };

// ---------------------------------------------------------------------------
// Steuer- und Zollkonstanten
// ---------------------------------------------------------------------------

// Einfuhrumsatzsteuer-Normalsaetze. AT ist der Hauptmarkt und laufend geprueft.
// UNSICHER: die uebrigen Saetze sind Kenntnisstand und nicht laufend
// nachgefuehrt - vor Nutzung fuer ein anderes Zielland bestaetigen.
export const COUNTRIES = {
  AT: { label: "Österreich", vat: 0.20, reduced: [0.10, 0.13] },
  DE: { label: "Deutschland", vat: 0.19, reduced: [0.07] },
  NL: { label: "Niederlande", vat: 0.21, reduced: [0.09] },
  FR: { label: "Frankreich", vat: 0.20, reduced: [0.055, 0.10] },
  IT: { label: "Italien", vat: 0.22, reduced: [0.04, 0.10] },
} as const;

export type Country = keyof typeof COUNTRIES;

// Seit 01.07.2021 gibt es keine Freigrenze fuer die Einfuhrumsatzsteuer mehr:
// jede Sendung aus einem Drittland ist steuerpflichtig, auch die 5-Euro-Socke.
export const VAT_FREE_LIMIT_EUR = 0;

// Zollfreigrenze fuer Kleinsendungen. Massgeblich ist der Warenwert (Eigenwert)
// ohne Fracht- und Versicherungskosten. Bis einschliesslich dieser Grenze faellt
// kein Zoll an, die Einfuhrumsatzsteuer aber sehr wohl.
// UNSICHER: Die EU arbeitet an der Abschaffung dieser Grenze im Zuge der
// Zollreform. Datum und Ausgestaltung sind hier bewusst nicht eingebaut - wenn
// die Regel faellt, nur diese Konstante und DUTY_FREE_ACTIVE anfassen.
export const DUTY_FREE_LIMIT_EUR = 150;
export const DUTY_FREE_ACTIVE = true;

// IOSS betrifft nur Sendungen bis 150 Euro Warenwert. Dabei kassiert der
// Verkaeufer die Umsatzsteuer schon beim Kauf, an der Grenze faellt dann keine
// Einfuhrumsatzsteuer und kein Verzollungsentgelt mehr an - der Steuerbetrag
// selbst verschwindet nicht. Einkaufsagenten nutzen IOSS praktisch nie, deshalb
// ist die Annahme standardmaessig aus.
export const IOSS_LIMIT_EUR = 150;

// UNSICHER (Rechtsauslegung): Einkaufsprovisionen zaehlen nach EU-Zollwertrecht
// nicht zum Zollwert, Transportkosten bis zur EU-Grenze dagegen schon. Der
// Rechner haelt sich daran: Agenturgebuehr bleibt aus der Bemessungsgrundlage
// draussen, Inlands- und Auslandsfracht sind drin.
export const AGENT_FEE_IN_CUSTOMS_VALUE = false;

// Verzollungs-/Bearbeitungsentgelt des Zustellers. UNSICHER: haengt am Zusteller
// und schwankt stark; Post guenstiger als die Expressdienste.
export const CLEARANCE_FEE_EUR: Record<string, Range> = {
  post: { min: 3, max: 15 },
  express: { min: 12, max: 25 },
};

// Zollsaetze je Kategorie als Spanne. ANNAHME und bewusst grob: der exakte Satz
// haengt an der Zolltarifnummer der konkreten Ware. Es werden hier absichtlich
// keine Tarifnummern behauptet - wer es genau braucht, schlaegt die Ware im
// Gebrauchszolltarif nach.
export const DUTY_RATES: Record<string, Range> = {
  "Elektronik": { min: 0.0, max: 0.14 },
  "Home & Deko": { min: 0.0, max: 0.12 },
  "Hoodies & Sweater": { min: 0.12, max: 0.12 },
  "Hosen & Shorts": { min: 0.12, max: 0.12 },
  "Jacken": { min: 0.12, max: 0.12 },
  "Kleider & Röcke": { min: 0.12, max: 0.12 },
  "Parfum": { min: 0.0, max: 0.0 },
  "Schmuck & Accessoires": { min: 0.025, max: 0.04 },
  "Schuhe": { min: 0.08, max: 0.17 },
  "Shirts & Tees": { min: 0.12, max: 0.12 },
  "Sonstiges": { min: 0.0, max: 0.17 },
  "Taschen": { min: 0.03, max: 0.097 },
  "Trikots": { min: 0.12, max: 0.12 },
  "Uhren": { min: 0.045, max: 0.045 },
};
export const DUTY_RATE_FALLBACK: Range = { min: 0.0, max: 0.17 };

// ---------------------------------------------------------------------------
// Versand- und Gebuehrenkonstanten
// ---------------------------------------------------------------------------

export type ShipMethod = {
  id: string;
  label: string;
  stepKg: number;      // Abrechnungsschritt, wird immer aufgerundet
  minKg: number;       // Mindestgewicht der Linie
  perKg: Range;        // Euro je Kilogramm, ANNAHME
  handlingEur: number; // Fixanteil je Sendung, ANNAHME
  days: Range;
  clearance: keyof typeof CLEARANCE_FEE_EUR;
  note?: string;
};

// ANNAHME: Marktueblicher Rahmen Mitte 2026, keine Tariftabelle eines Anbieters.
// Die Linien der Agenten wechseln staendig; hier zaehlt die Groessenordnung.
export const SHIP_METHODS: ShipMethod[] = [
  {
    id: "eco", label: "Economy Luftfracht", stepKg: 0.5, minKg: 0.5,
    perKg: { min: 5, max: 8 }, handlingEur: 0, days: { min: 12, max: 25 },
    clearance: "post",
    note: "Guenstigste Linie, dafuer die unzuverlaessigste Laufzeit.",
  },
  {
    id: "air", label: "Standard Luftfracht", stepKg: 0.5, minKg: 0.5,
    perKg: { min: 7, max: 12 }, handlingEur: 0, days: { min: 8, max: 16 },
    clearance: "post",
  },
  {
    id: "express", label: "Express (DHL, FedEx, UPS)", stepKg: 0.5, minKg: 0.5,
    perKg: { min: 12, max: 20 }, handlingEur: 0, days: { min: 4, max: 9 },
    clearance: "express",
    note: "Expressdienste verrechnen das Verzollungsentgelt deutlich hoeher.",
  },
  {
    id: "sea", label: "Seefracht", stepKg: 1, minKg: 5,
    perKg: { min: 3, max: 5 }, handlingEur: 0, days: { min: 35, max: 60 },
    clearance: "post",
    note: "Erst ab etwa 5 kg sinnvoll, darunter zahlt man das Mindestgewicht.",
  },
];

// Agenturgebuehr. Belegt auf den Anbieterseiten: die Provision wird auf die
// Versandgebuehr gerechnet, nicht auf den Warenwert (iTaoBuy 4-8 %,
// Superbuy 5,5-8,5 %, Joyagoo 4-8 %, ACBuy 1-7,5 %).
export const AGENT_FEE_RATE: Range = { min: 0.04, max: 0.085 };
export type AgentFeeBase = "shipping" | "goods";

// Inlandsversand innerhalb Chinas je Bestellung, in CNY. ANNAHME.
export const DOMESTIC_SHIP_CNY: Range = { min: 8, max: 20 };
export const CNY_PER_EUR_FALLBACK = 7.8;

// ---------------------------------------------------------------------------
// Rechnung
// ---------------------------------------------------------------------------

/**
 * Betragseingabe lesen: "1.234,56", "1234,56", "1234.56", "1.234".
 * Deutsch gedacht - ein Komma ist immer das Dezimalzeichen, Punkte sind dann
 * Tausendertrenner. Ohne Komma gilt ein Punkt mit genau drei Folgeziffern als
 * Tausendertrenner, sonst als Dezimalpunkt. Alles, was nicht in dieses Schema
 * passt, ergibt NaN - lieber nachfragen als still eine falsche Zahl rechnen.
 */
export function parseAmount(raw: string): number {
  const s = raw.trim().replace(/[\s€]/g, "");
  if (!s) return NaN;
  if (s.includes(",")) {
    if (!/^\d{1,3}(\.\d{3})*,\d+$/.test(s) && !/^\d+,\d+$/.test(s)) return NaN;
    return parseFloat(s.replace(/\./g, "").replace(",", "."));
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return parseFloat(s.replace(/\./g, ""));
  return /^\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
}

/** Gewicht: kein Tausendertrenner, "1,2" und "1.2" sind dasselbe. */
export function parseWeight(raw: string): number {
  const s = raw.trim().replace(/[\s]|kg/gi, "").replace(",", ".");
  if (!s) return NaN;
  return /^\d*\.?\d+$/.test(s) ? parseFloat(s) : NaN;
}

export type CalcInput = {
  goodsEur: number;
  country: Country;
  methodId: string;
  category?: string;
  /** Manuelle Gewichtsangabe in kg. Schlaegt die Kategorie-Annahme. */
  weightKg?: number;
  /** Ermaessigter Steuersatz statt Normalsatz. */
  vatRate?: number;
  /** Verkaeufer nutzt IOSS (bei Agenten die Ausnahme). */
  ioss?: boolean;
  /** Tageskurs CNY je EUR. */
  cnyPerEur?: number;
  agentFeeBase?: AgentFeeBase;
};

export type CostLine = {
  id: string;
  label: string;
  min: number;
  max: number;
  assumption: boolean;
  note?: string;
};

export type Driver = { id: string; label: string; share: number; eur: number };

export type CalcResult = {
  ok: boolean;
  /** Was fehlt, damit gerechnet werden kann. */
  missing: string[];
  lines: CostLine[];
  total: Range;
  weight: Range | null;
  weightSource: "input" | "category" | null;
  dutyApplies: boolean;
  vatRate: number;
  days: Range | null;
  drivers: Driver[];
  notes: string[];
};

/** Ein vollstaendiger Satz Annahmen - einmal fuer das guenstige, einmal fuer das teure Ende. */
type Scenario = {
  weightKg: number;
  shipPerKg: number;
  agentFeeRate: number;
  dutyRate: number;
  domesticCny: number;
  clearanceEur: number;
};

const r2 = (v: number) => Math.round(v * 100) / 100;

/** Abrechnungsgewicht: Mindestgewicht der Linie, dann auf den Schritt aufgerundet. */
export function chargeableKg(weightKg: number, m: ShipMethod): number {
  const w = Math.max(weightKg, m.minKg);
  return Math.ceil(w / m.stepKg - 1e-9) * m.stepKg;
}

function runScenario(inp: CalcInput, m: ShipMethod, vatRate: number, s: Scenario) {
  const goods = inp.goodsEur;
  const cny = inp.cnyPerEur && inp.cnyPerEur > 0 ? inp.cnyPerEur : CNY_PER_EUR_FALLBACK;
  const domestic = s.domesticCny / cny;
  const intl = chargeableKg(s.weightKg, m) * s.shipPerKg + m.handlingEur;
  const feeBase = (inp.agentFeeBase ?? "shipping") === "goods" ? goods : intl;
  const agentFee = feeBase * s.agentFeeRate;

  // Zollwert: Ware plus Transport bis zur EU-Grenze. Einkaufsprovision bleibt
  // draussen, sofern AGENT_FEE_IN_CUSTOMS_VALUE nicht umgestellt wird.
  const customsValue = goods + domestic + intl + (AGENT_FEE_IN_CUSTOMS_VALUE ? agentFee : 0);

  const iossActive = !!inp.ioss && goods <= IOSS_LIMIT_EUR;
  const dutyApplies = DUTY_FREE_ACTIVE ? goods > DUTY_FREE_LIMIT_EUR : true;
  const duty = !iossActive && dutyApplies ? customsValue * s.dutyRate : 0;

  // Bemessungsgrundlage der Einfuhrumsatzsteuer: Zollwert plus Zoll, nicht der
  // Warenwert allein. Mit IOSS faellt die Steuer schon beim Kauf an, auf
  // derselben Basis ohne Zoll und ohne Verzollungsentgelt.
  const vat = vatRate * (iossActive ? goods + domestic + intl : customsValue + duty);
  const clearance = iossActive ? 0 : s.clearanceEur;

  const parts = [
    { id: "goods", value: goods },
    { id: "domestic", value: domestic },
    { id: "intl", value: intl },
    { id: "agentFee", value: agentFee },
    { id: "duty", value: duty },
    { id: "vat", value: vat },
    { id: "clearance", value: clearance },
  ];
  const total = parts.reduce((a, p) => a + p.value, 0);
  return { parts, total, dutyApplies, iossActive };
}

const LABELS: Record<string, string> = {
  goods: "Warenwert",
  domestic: "Inlandsversand China",
  intl: "Internationaler Versand",
  agentFee: "Agenturgebühr",
  duty: "Zoll",
  vat: "Einfuhrumsatzsteuer",
  clearance: "Verzollungsentgelt Zusteller",
};

const ASSUMPTION_LINES = new Set(["domestic", "intl", "agentFee", "duty", "clearance"]);

const DRIVER_LABELS: Record<keyof Scenario, string> = {
  weightKg: "Gewicht",
  shipPerKg: "Versandtarif je Kilo",
  agentFeeRate: "Satz der Agenturgebühr",
  dutyRate: "Zollsatz",
  domesticCny: "Inlandsversand China",
  clearanceEur: "Verzollungsentgelt",
};

export function calculate(inp: CalcInput): CalcResult {
  const missing: string[] = [];
  const notes: string[] = [];

  const method = SHIP_METHODS.find((m) => m.id === inp.methodId);
  if (!method) missing.push("Versandart");
  if (!(inp.goodsEur > 0) || !isFinite(inp.goodsEur)) missing.push("Warenwert");

  const country = COUNTRIES[inp.country];
  if (!country) missing.push("Zielland");

  // Gewicht: eigene Angabe schlaegt die Kategorie-Annahme. Fehlt beides, wird
  // hier bewusst nicht geschaetzt.
  let weight: Range | null = null;
  let weightSource: "input" | "category" | null = null;
  if (inp.weightKg && inp.weightKg > 0) {
    weight = { min: inp.weightKg, max: inp.weightKg };
    weightSource = "input";
    notes.push("Gewicht selbst angegeben. Agenten wiegen nach dem Umpacken neu, das Ergebnis liegt oft darüber.");
  } else {
    const cw: WeightRange | null = weightForCategory(inp.category);
    if (cw) {
      weight = { ...cw };
      weightSource = "category";
      notes.push(`Gewicht aus der Kategorie-Annahme "${inp.category}" (${cw.min} bis ${cw.max} kg inklusive Umverpackung). Kein Messwert.`);
    } else {
      missing.push("Gewicht");
    }
  }

  const empty: CalcResult = {
    ok: false, missing, lines: [], total: { min: 0, max: 0 },
    weight, weightSource, dutyApplies: false,
    vatRate: country ? country.vat : 0, days: null, drivers: [], notes,
  };
  if (missing.length || !method || !country || !weight) {
    if (missing.includes("Gewicht")) {
      notes.push("Ohne Gewicht keine Rechnung: der Versand ist der groesste variable Posten. Gewicht schätzen oder eine Kategorie mit hinterlegter Spanne wählen.");
    }
    return empty;
  }

  const vatRate = inp.vatRate ?? country.vat;
  const duty = (inp.category && DUTY_RATES[inp.category]) || DUTY_RATE_FALLBACK;
  if (!inp.category || !DUTY_RATES[inp.category]) {
    notes.push("Kein Zollsatz für diese Kategorie hinterlegt, gerechnet wird mit der vollen Bandbreite 0 bis 17 Prozent.");
  }
  const clearance = CLEARANCE_FEE_EUR[method.clearance];

  const lo: Scenario = {
    weightKg: weight.min, shipPerKg: method.perKg.min, agentFeeRate: AGENT_FEE_RATE.min,
    dutyRate: duty.min, domesticCny: DOMESTIC_SHIP_CNY.min, clearanceEur: clearance.min,
  };
  const hi: Scenario = {
    weightKg: weight.max, shipPerKg: method.perKg.max, agentFeeRate: AGENT_FEE_RATE.max,
    dutyRate: duty.max, domesticCny: DOMESTIC_SHIP_CNY.max, clearanceEur: clearance.max,
  };

  const rLo = runScenario(inp, method, vatRate, lo);
  const rHi = runScenario(inp, method, vatRate, hi);

  const lines: CostLine[] = rLo.parts.map((p, i) => ({
    id: p.id,
    label: LABELS[p.id],
    min: r2(p.value),
    max: r2(rHi.parts[i].value),
    assumption: ASSUMPTION_LINES.has(p.id),
  }));

  // Sensitivitaet: jede unsichere Groesse einzeln vom guenstigen auf das teure
  // Ende ziehen, alles andere guenstig lassen. Zeigt, welche Annahme die Spanne
  // treibt. Die Beitraege ueberlappen sich leicht (Zoll und Steuer haengen am
  // Versand), deshalb wird auf 100 Prozent normiert.
  const keys = Object.keys(lo) as (keyof Scenario)[];
  const raw = keys.map((k) => {
    const s = { ...lo, [k]: hi[k] };
    return { id: k, label: DRIVER_LABELS[k], eur: r2(runScenario(inp, method, vatRate, s).total - rLo.total) };
  });
  const sum = raw.reduce((a, d) => a + Math.max(0, d.eur), 0);
  const drivers: Driver[] = raw
    .map((d) => ({ ...d, share: sum > 0 ? Math.max(0, d.eur) / sum : 0 }))
    .filter((d) => d.eur > 0.005)
    .sort((a, b) => b.share - a.share);

  if (rLo.iossActive) {
    notes.push("IOSS angenommen: die Umsatzsteuer wird bereits beim Kauf eingehoben, dafür entfällt das Verzollungsentgelt. Einkaufsagenten nutzen IOSS selten.");
  }
  if (!rLo.dutyApplies) {
    notes.push(`Kein Zoll: der Warenwert liegt bei höchstens ${DUTY_FREE_LIMIT_EUR} Euro. Die Einfuhrumsatzsteuer fällt trotzdem an, seit 01.07.2021 gibt es dafür keine Freigrenze.`);
  } else {
    notes.push(`Zoll fällt an: der Warenwert übersteigt ${DUTY_FREE_LIMIT_EUR} Euro. Bemessungsgrundlage ist Warenwert plus Fracht, die Einfuhrumsatzsteuer läuft danach auf Warenwert plus Fracht plus Zoll.`);
  }
  notes.push("Nicht enthalten: Zahlungsgebühren, Versicherung, Zusatzfotos, Lagergebühren, Rücksendungen.");
  notes.push("Volumengewicht ist nicht modelliert. Sperrige, leichte Ware wird nach Volumen abgerechnet und kann deutlich teurer werden als hier gezeigt.");

  return {
    ok: true, missing: [], lines,
    total: { min: r2(rLo.total), max: r2(rHi.total) },
    weight, weightSource,
    dutyApplies: rLo.dutyApplies, vatRate,
    days: method.days, drivers, notes,
  };
}
