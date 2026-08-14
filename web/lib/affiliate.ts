// Zentrale Provisionskonfiguration. Einzige Stelle, an der Provisionskennungen
// definiert werden - im restlichen Code laeuft alles ueber withAffiliate().
//
// Die Kennungen selbst stehen NICHT im Repository, sondern in Umgebungsvariablen
// (.env.local / Vercel-Projektvariablen). Ohne gesetzte Variable bleibt der Link
// exakt so, wie er ohne dieses Modul waere.
//
// NEXT_PUBLIC_-Praefix ist noetig, weil die Links im Client-Bundle gebaut werden.
// Das ist kein Geheimnisverlust: eine Provisionskennung steht ohnehin sichtbar im
// Ziel-Link. Next.js inlined solche Variablen zur Buildzeit und nur bei statischem
// Zugriff - deshalb die ausgeschriebene Tabelle statt process.env[dynamisch].
//
// Format der Variable:
//   NEXT_PUBLIC_AFF_KAKOBUY=meinkuerzel          -> nutzt den Default-Parameter
//   NEXT_PUBLIC_AFF_KAKOBUY=affcode=meinkuerzel  -> Parametername mit ueberschrieben
//
// ACHTUNG: Die Default-Parameternamen unten sind der in der Szene ueblichen
// Schreibweise nachgebildet und NICHT einzeln im jeweiligen Partnerprogramm
// verifiziert. Vor dem Scharfschalten je Agent im Partner-Dashboard pruefen und
// bei Abweichung die "param=code"-Form der Variable nutzen.

/** Default-Query-Parameter je Agent. Ungeprueft, siehe Kopfkommentar. */
const PARAM: Record<string, string> = {
  Litbuy: "ref",
  Kakobuy: "affcode",
  ACBuy: "u",
  Mulebuy: "ref",
  Oopbuy: "inviteCode",
  Hoobuy: "inviteCode",
  Joyagoo: "ref",
  USFans: "ref",
  Superbuy: "partnercode",
  Sugargoo: "memberId",
  CSSBuy: "promotionCode",
  AllChinaBuy: "partnercode",
  Orientdig: "ref",
  LovegoBuy: "invite_code",
  OOTDBuy: "inviteCode",
  HipoBuy: "inviteCode",
  PonyBuy: "ref",
  LoongBuy: "ref",
  iTaoBuy: "ref",
  Basetao: "ref",
  EastMallBuy: "ref",
};

/** Rohwerte aus der Umgebung. Statischer Zugriff, sonst kein Inlining. */
const RAW: Record<string, string | undefined> = {
  Litbuy: process.env.NEXT_PUBLIC_AFF_LITBUY,
  Kakobuy: process.env.NEXT_PUBLIC_AFF_KAKOBUY,
  ACBuy: process.env.NEXT_PUBLIC_AFF_ACBUY,
  Mulebuy: process.env.NEXT_PUBLIC_AFF_MULEBUY,
  Oopbuy: process.env.NEXT_PUBLIC_AFF_OOPBUY,
  Hoobuy: process.env.NEXT_PUBLIC_AFF_HOOBUY,
  Joyagoo: process.env.NEXT_PUBLIC_AFF_JOYAGOO,
  USFans: process.env.NEXT_PUBLIC_AFF_USFANS,
  Superbuy: process.env.NEXT_PUBLIC_AFF_SUPERBUY,
  Sugargoo: process.env.NEXT_PUBLIC_AFF_SUGARGOO,
  CSSBuy: process.env.NEXT_PUBLIC_AFF_CSSBUY,
  AllChinaBuy: process.env.NEXT_PUBLIC_AFF_ALLCHINABUY,
  Orientdig: process.env.NEXT_PUBLIC_AFF_ORIENTDIG,
  LovegoBuy: process.env.NEXT_PUBLIC_AFF_LOVEGOBUY,
  OOTDBuy: process.env.NEXT_PUBLIC_AFF_OOTDBUY,
  HipoBuy: process.env.NEXT_PUBLIC_AFF_HIPOBUY,
  PonyBuy: process.env.NEXT_PUBLIC_AFF_PONYBUY,
  LoongBuy: process.env.NEXT_PUBLIC_AFF_LOONGBUY,
  iTaoBuy: process.env.NEXT_PUBLIC_AFF_ITAOBUY,
  Basetao: process.env.NEXT_PUBLIC_AFF_BASETAO,
  EastMallBuy: process.env.NEXT_PUBLIC_AFF_EASTMALLBUY,
};

export type AffRule = { param: string; code: string };

/** " QC"-Varianten der QC-Datenbanken teilen die Konfiguration des Agenten. */
function baseName(agent: string): string {
  return agent.replace(/\s+QC$/i, "");
}

export function ruleFor(agent: string): AffRule | null {
  const key = baseName(agent);
  const raw = (RAW[key] || "").trim();
  if (!raw) return null;
  const eq = raw.indexOf("=");
  const param = eq > 0 ? raw.slice(0, eq).trim() : PARAM[key];
  const code = eq > 0 ? raw.slice(eq + 1).trim() : raw;
  if (!param || !code) return null;
  return { param, code };
}

/** true, sobald mindestens eine Kennung gesetzt ist. Steuert die Kennzeichnung. */
export function affiliateActive(): boolean {
  return Object.keys(RAW).some((k) => (RAW[k] || "").trim().length > 0);
}

/** Liste der Agenten mit aktiver Kennung - fuer Doku/Debug. */
export function activeAgents(): string[] {
  return Object.keys(RAW).filter((k) => (RAW[k] || "").trim().length > 0);
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
