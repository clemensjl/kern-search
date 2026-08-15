// Zentrale Provisionskonfiguration. Einzige Stelle, an der Provisionskennungen
// definiert werden - im restlichen Code laeuft alles ueber withAffiliate().
//
// Die Kennungen stehen bewusst hier im Code und nicht nur in Umgebungsvariablen:
// eine Referral-Kennung ist kein Geheimnis, sie steht ohnehin sichtbar in jedem
// Ziel-Link, den ein Nutzer anklickt. Im Code stehend wirken sie auf jeder
// Umgebung sofort, auch auf einer frischen Vercel-Bereitstellung ohne gesetzte
// Variablen. Ueberschreiben geht weiterhin per NEXT_PUBLIC_AFF_<AGENT>.
//
// NEXT_PUBLIC_-Praefix ist noetig, weil die Links im Client-Bundle gebaut werden.
// Next.js inlined solche Variablen zur Buildzeit und nur bei statischem Zugriff -
// deshalb die ausgeschriebene Tabelle statt process.env[dynamisch].
//
// Format der Variable:
//   NEXT_PUBLIC_AFF_LITBUY=meinkuerzel             -> nutzt den Parameter unten
//   NEXT_PUBLIC_AFF_LITBUY=inviteCode=meinkuerzel  -> Parametername mit ueberschrieben
//
// Herkunft der Parameternamen: aus den echten Einladungslinks von Clemens
// abgelesen, nicht geraten. Zwei wichen von der szeneueblichen Schreibweise ab -
// Litbuy nutzt inviteCode statt ref, CSSBuy nutzt inviter statt promotionCode.
// CSSBuys Kurzlink cssb.uy/1RHT loest ueber drei Spruenge auf
// www.cssbuy.com/login/register?pageType=create&inviter=clemenswatan auf.
//
// OFFEN, vor dem Scharfschalten je Agent einmal pruefen: alle sechs Kennungen
// stammen aus Registrierungs-Einladungslinks. Ob der jeweilige Agent den
// Parameter auch auf einer Produkt-Detailseite auswertet und einem Konto
// zuschreibt, ist nicht verifiziert. Test: Link im privaten Fenster oeffnen und
// im Partnerbereich nachsehen, ob der Klick gezaehlt wird.

/** Query-Parameter je Agent, aus den echten Einladungslinks abgelesen. */
const PARAM: Record<string, string> = {
  Litbuy: "inviteCode",
  Superbuy: "partnercode",
  Sugargoo: "memberId",
  CSSBuy: "inviter",
  Joyagoo: "ref",
  HipoBuy: "inviteCode",
};

/** Kennungen von Clemens. Oeffentliche Werte, siehe Kopfkommentar. */
const CODE: Record<string, string> = {
  Litbuy: "N6FK31DOX",
  Superbuy: "8a2y6u",
  Sugargoo: "3603566243831828669",
  CSSBuy: "clemenswatan",
  Joyagoo: "301060507",
  HipoBuy: "ZQMDNIBAR",
};

/** Ueberschreibung aus der Umgebung. Statischer Zugriff, sonst kein Inlining. */
const ENV: Record<string, string | undefined> = {
  Litbuy: process.env.NEXT_PUBLIC_AFF_LITBUY,
  Superbuy: process.env.NEXT_PUBLIC_AFF_SUPERBUY,
  Sugargoo: process.env.NEXT_PUBLIC_AFF_SUGARGOO,
  CSSBuy: process.env.NEXT_PUBLIC_AFF_CSSBUY,
  Joyagoo: process.env.NEXT_PUBLIC_AFF_JOYAGOO,
  HipoBuy: process.env.NEXT_PUBLIC_AFF_HIPOBUY,
};

export type AffRule = { param: string; code: string };

/** " QC"-Varianten der QC-Datenbanken teilen die Konfiguration des Agenten. */
function baseName(agent: string): string {
  return agent.replace(/\s+QC$/i, "");
}

export function ruleFor(agent: string): AffRule | null {
  const key = baseName(agent);
  const raw = (ENV[key] || "").trim();
  if (raw) {
    // Leerstring in der Umgebung schaltet den Agenten NICHT ab, dafuer gibt es
    // die Sonderform "off" - sonst waere ein versehentlich leeres Feld in der
    // Vercel-Oberflaeche ein stiller Umsatzausfall.
    if (raw.toLowerCase() === "off") return null;
    const eq = raw.indexOf("=");
    const param = eq > 0 ? raw.slice(0, eq).trim() : PARAM[key];
    const code = eq > 0 ? raw.slice(eq + 1).trim() : raw;
    return param && code ? { param, code } : null;
  }
  const param = PARAM[key];
  const code = CODE[key];
  return param && code ? { param, code } : null;
}

/** true, sobald mindestens eine Kennung wirkt. Steuert die Kennzeichnung. */
export function affiliateActive(): boolean {
  return Object.keys(PARAM).some((k) => ruleFor(k) !== null);
}

/** Liste der Agenten mit wirkender Kennung - fuer Doku/Debug. */
export function activeAgents(): string[] {
  return Object.keys(PARAM).filter((k) => ruleFor(k) !== null);
}

/**
 * Haengt die Provisionskennung an einen fertigen Agenten-Link.
 * Ohne Konfiguration wird der Link unveraendert zurueckgegeben.
 */
export function withAffiliate(agent: string, url: string): string {
  const r = ruleFor(agent);
  if (!r || !url) return url;
  // Hash-Router (Sugargoo) fuehrt seine Query im Fragment - dort anhaengen,
  // sonst sieht die Anwendung den Parameter nie.
  const h = url.indexOf("#");
  const scope = h >= 0 ? url.slice(h) : url;
  if (new RegExp(`[?&]${r.param}=`).test(scope)) return url;
  return url + (scope.includes("?") ? "&" : "?") + `${r.param}=${encodeURIComponent(r.code)}`;
}
