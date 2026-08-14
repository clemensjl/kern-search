// Tests fuer den Endpreisrechner. Laeuft mit dem eingebauten Node-Testrunner:
//   npm test
// Node strippt die Typen selbst; scripts/ts-resolve.mjs ergaenzt nur die in Next
// ueblichen endungslosen Importe. Kein zusaetzliches Testpaket noetig.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  calculate, chargeableKg, parseAmount, parseWeight,
  DUTY_FREE_LIMIT_EUR, SHIP_METHODS, type CalcInput,
} from "./costs";
import { withAffiliate, affiliateActive } from "./affiliate";

const base: CalcInput = {
  goodsEur: 100,
  country: "AT",
  methodId: "air",
  category: "Schuhe",
  weightKg: 1.2,
  cnyPerEur: 7.8,
};

const line = (r: ReturnType<typeof calculate>, id: string) =>
  r.lines.find((l) => l.id === id)!;

test("genau 150 Euro Warenwert: kein Zoll, aber Einfuhrumsatzsteuer", () => {
  const r = calculate({ ...base, goodsEur: DUTY_FREE_LIMIT_EUR });
  assert.equal(r.ok, true);
  assert.equal(r.dutyApplies, false);
  assert.equal(line(r, "duty").max, 0);
  assert.ok(line(r, "vat").min > 0, "seit 01.07.2021 gibt es keine EUSt-Freigrenze");
});

test("knapp unter 150 Euro: kein Zoll", () => {
  const r = calculate({ ...base, goodsEur: 149.99 });
  assert.equal(r.dutyApplies, false);
  assert.equal(line(r, "duty").max, 0);
});

test("knapp ueber 150 Euro: Zoll faellt an", () => {
  const r = calculate({ ...base, goodsEur: 150.01 });
  assert.equal(r.dutyApplies, true);
  assert.ok(line(r, "duty").min > 0);
  // Bemessungsgrundlage ist Warenwert plus Fracht, nicht der Warenwert allein.
  const l = calculate({ ...base, goodsEur: 150.01 });
  const zoll = line(l, "duty").min;
  assert.ok(zoll > 150.01 * 0.08, "Fracht muss in der Zollbasis stecken");
});

test("Sprung ueber die Grenze kostet mehr als der Cent Warenwert", () => {
  const unten = calculate({ ...base, goodsEur: 150 }).total.min;
  const oben = calculate({ ...base, goodsEur: 150.01 }).total.min;
  assert.ok(oben - unten > 1, `Grenzsprung zu klein: ${oben - unten}`);
});

test("ohne Gewicht und ohne bekannte Kategorie wird nicht geschaetzt", () => {
  const r = calculate({ ...base, weightKg: undefined, category: undefined });
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ["Gewicht"]);
  assert.equal(r.total.min, 0);
  assert.ok(r.notes.some((n) => n.includes("Ohne Gewicht")));
});

test("ohne Gewicht greift die Kategorie-Annahme und liefert eine Spanne", () => {
  const r = calculate({ ...base, weightKg: undefined, category: "Schuhe" });
  assert.equal(r.ok, true);
  assert.equal(r.weightSource, "category");
  assert.ok(r.total.max > r.total.min);
  assert.ok(r.drivers.length > 0);
  assert.ok(Math.abs(r.drivers.reduce((a, d) => a + d.share, 0) - 1) < 1e-9);
});

test("Einfuhrumsatzsteuer 20 Prozent auf Ware plus Fracht", () => {
  const r = calculate({ ...base, goodsEur: 100, weightKg: 1 });
  const ware = line(r, "goods").min;
  const fracht = line(r, "intl").min + line(r, "domestic").min;
  assert.equal(r.vatRate, 0.2);
  assert.ok(Math.abs(line(r, "vat").min - 0.2 * (ware + fracht)) < 0.02);
});

test("Agenturgebuehr haengt an der Versandgebuehr, nicht am Warenwert", () => {
  const a = calculate({ ...base, goodsEur: 50 });
  const b = calculate({ ...base, goodsEur: 500 });
  assert.equal(line(a, "agentFee").min, line(b, "agentFee").min);
});

test("Abrechnungsgewicht wird auf den Schritt aufgerundet", () => {
  const air = SHIP_METHODS.find((m) => m.id === "air")!;
  assert.equal(chargeableKg(0.6, air), 1);
  assert.equal(chargeableKg(1.0, air), 1);
  assert.equal(chargeableKg(1.01, air), 1.5);
  const sea = SHIP_METHODS.find((m) => m.id === "sea")!;
  assert.equal(chargeableKg(1, sea), 5, "Mindestgewicht der Seefracht");
});

test("Betragseingabe: deutsche und englische Schreibweise, Muell wird NaN", () => {
  assert.equal(parseAmount("1.234,56"), 1234.56);
  assert.equal(parseAmount("1234,56"), 1234.56);
  assert.equal(parseAmount("1234.56"), 1234.56);
  assert.equal(parseAmount("1.234"), 1234);
  assert.equal(parseAmount("€ 89,90"), 89.9);
  assert.ok(Number.isNaN(parseAmount("abc")));
  assert.ok(Number.isNaN(parseAmount("12,,3")));
  assert.ok(Number.isNaN(parseAmount("")));
});

test("Gewichtseingabe: Komma wie Punkt, Unsinn wird NaN", () => {
  assert.equal(parseWeight("1,2"), 1.2);
  assert.equal(parseWeight("1.2"), 1.2);
  assert.equal(parseWeight("0,85 kg"), 0.85);
  assert.ok(Number.isNaN(parseWeight("1.2.3")));
  assert.ok(Number.isNaN(parseWeight("schwer")));
});

test("ohne gesetzte Umgebungsvariable bleibt der Link unveraendert", () => {
  assert.equal(affiliateActive(), false);
  const u = "https://kakobuy.com/item/details?url=https%3A%2F%2Fweidian.com";
  assert.equal(withAffiliate("Kakobuy", u), u);
});
