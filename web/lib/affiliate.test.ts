// Prueft, dass jeder der sechs Agenten seine Kennung mit dem richtigen
// Parameternamen anhaengt - und dass Sonderfaelle nicht stillschweigend
// danebengehen (Hash-Router, pfadbasierte Links, entfernte Agenten).
import test from "node:test";
import assert from "node:assert/strict";
import { AGENTS, agentLink, type Item } from "./agents";
import { ruleFor, withAffiliate, activeAgents, affiliateActive } from "./affiliate";

const wd: Item = { n: "Testartikel", c: "Schuhe", pf: "wd", pid: "7768248045" };

const ERWARTET: Record<string, string> = {
  Litbuy: "inviteCode=N6FK31DOX",
  Superbuy: "partnercode=8a2y6u",
  Sugargoo: "memberId=3603566243831828669",
  CSSBuy: "inviter=clemenswatan",
  Joyagoo: "ref=301060507",
  HipoBuy: "inviteCode=ZQMDNIBAR",
};

test("genau sechs Agenten, alle mit Kennung", () => {
  assert.equal(AGENTS.length, 6);
  assert.deepEqual(
    AGENTS.map((a) => a.n).sort(),
    Object.keys(ERWARTET).sort(),
  );
  assert.equal(activeAgents().length, 6);
  assert.equal(affiliateActive(), true);
});

test("jeder Agent haengt seine Kennung an einen Weidian-Link", () => {
  for (const a of AGENTS) {
    const href = agentLink(a, wd);
    assert.ok(href, `${a.n} liefert keinen Link`);
    assert.ok(
      href.includes(ERWARTET[a.n]),
      `${a.n}: erwartet "${ERWARTET[a.n]}" in ${href}`,
    );
  }
});

test("Sugargoo haengt im Fragment an, nicht davor", () => {
  const href = agentLink(AGENTS.find((a) => a.n === "Sugargoo")!, wd)!;
  const hash = href.slice(href.indexOf("#"));
  assert.ok(hash.includes("memberId=3603566243831828669"));
  assert.ok(!href.slice(0, href.indexOf("#")).includes("memberId"));
});

test("CSSBuy: pfadbasierter Link bekommt die Kennung als erste Query", () => {
  const href = agentLink(AGENTS.find((a) => a.n === "CSSBuy")!, wd)!;
  assert.ok(href.includes("item-micro-7768248045.html?inviter=clemenswatan"));
});

test("Superbuy: zweite Query wird mit & angehaengt", () => {
  const href = agentLink(AGENTS.find((a) => a.n === "Superbuy")!, wd)!;
  assert.ok(href.includes("&partnercode=8a2y6u"));
  assert.equal(href.split("?").length, 2, "nur ein Fragezeichen erlaubt");
});

test("entfernte Agenten haben keine Regel mehr", () => {
  for (const weg of ["Kakobuy", "ACBuy", "Oopbuy", "Hoobuy", "OOTDBuy", "Basetao"]) {
    assert.equal(ruleFor(weg), null, `${weg} hat noch eine Regel`);
    assert.equal(withAffiliate(weg, "https://example.com/x"), "https://example.com/x");
  }
});

test("QC-Variante erbt die Kennung des Agenten", () => {
  const r = ruleFor("Litbuy QC");
  assert.deepEqual(r, { param: "inviteCode", code: "N6FK31DOX" });
});

test("kein doppeltes Anhaengen, wenn der Parameter schon dasteht", () => {
  const einmal = withAffiliate("Joyagoo", "https://joyagoo.com/p?id=1&ref=301060507");
  assert.equal(einmal, "https://joyagoo.com/p?id=1&ref=301060507");
});

test("ohne Produkt-ID entsteht kein kaputter Link", () => {
  const leer: Item = { n: "Ohne", c: "Sonstiges" };
  for (const a of AGENTS) {
    const href = agentLink(a, leer);
    assert.ok(href === null || !href.includes("undefined"), `${a.n}: ${href}`);
  }
});
