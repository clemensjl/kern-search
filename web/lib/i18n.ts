import { affiliateActive } from "./affiliate";

export type Lang = "de" | "en";

const S = {
  de: {
    search_ph: "Suche: Marke, Modell, Kategorie …",
    hits: "Treffer", items: "Artikel", all_cats: "Alle Kategorien",
    sort_rel: "Relevanz", sort_pa: "Preis aufsteigend", sort_pd: "Preis absteigend", sort_name: "Name A-Z",
    discover: "Entdecken", price_min: "€ min", price_max: "€ max",
    load_more: "Mehr laden", loading: "Lade Datenbank …",
    empty_title: "Nichts gefunden", empty_sub: "Andere Schreibweise oder weniger Filter versuchen.",
    footer: "Kina Search – Preise umgerechnet zum Tageskurs, ohne Gewähr. Links öffnen extern.",
    verified: "Von uns getestet", rating: "Bewertung",
    open_at: "Öffnen bei", original: "Original-Link", other_agents: "Bei anderem Agent öffnen",
    qc_photos: "QC-Fotos ansehen", copy_link: "Link kopieren", copied: "Kopiert",
    save: "Merken", saved: "Gemerkt",
    login: "Anmelden", logout: "Abmelden", submit_nav: "Einreichen", collections_nav: "Collections", admin_nav: "Admin",
    hello: "Preise anzeigen in …",
    ob_title: "Willkommen bei Kina Search", ob_sub: "Kurz einrichten – alles später oben in der Leiste änderbar.",
    ob_lang: "Sprache", ob_cur: "Währung", ob_theme: "Darstellung", ob_agent: "Dein Einkaufs-Agent",
    ob_agent_sub: "Produktlinks öffnen direkt bei deinem Agent.",
    ob_light: "Hell", ob_dark: "Dunkel", ob_done: "Los geht's",
    no_price: "Kein Preis angegeben",
    aff_note: "Werbung: Die Agenten-Links enthalten eine Provisionskennung. Bei einem Kauf erhalten wir einen Anteil der Agenturgebühr.",
    aff_footer: "Werbehinweis: Die Agenten-Links auf dieser Seite sind Provisionslinks. Bei einem Kauf über diese Links erhalten wir eine Provision vom jeweiligen Agenten.",
    calc_nav: "Endpreis",
  },
  en: {
    search_ph: "Search: brand, model, category …",
    hits: "results", items: "items", all_cats: "All categories",
    sort_rel: "Relevance", sort_pa: "Price low-high", sort_pd: "Price high-low", sort_name: "Name A-Z",
    discover: "Discover", price_min: "€ min", price_max: "€ max",
    load_more: "Load more", loading: "Loading database …",
    empty_title: "Nothing found", empty_sub: "Try a different spelling or fewer filters.",
    footer: "Kina Search – prices converted at daily rates, no guarantee. Links open externally.",
    verified: "Tested by us", rating: "Rating",
    open_at: "Open at", original: "Original link", other_agents: "Open with another agent",
    qc_photos: "View QC photos", copy_link: "Copy link", copied: "Copied",
    save: "Save", saved: "Saved",
    login: "Sign in", logout: "Sign out", submit_nav: "Submit", collections_nav: "Collections", admin_nav: "Admin",
    hello: "Show prices in …",
    ob_title: "Welcome to Kina Search", ob_sub: "Quick setup – everything can be changed later in the top bar.",
    ob_lang: "Language", ob_cur: "Currency", ob_theme: "Appearance", ob_agent: "Your shopping agent",
    ob_agent_sub: "Product links open directly at your agent.",
    ob_light: "Light", ob_dark: "Dark", ob_done: "Let's go",
    no_price: "No price listed",
    aff_note: "Advertising: agent links carry an affiliate ID. If you buy, we receive a share of the agent fee.",
    aff_footer: "Advertising notice: the agent links on this page are affiliate links. If you buy through them, the agent pays us a commission.",
    calc_nav: "Final price",
  },
} as const;

export type TKey = keyof typeof S.de;

export function t(lang: Lang, key: TKey): string {
  const v = (S[lang] as Record<string, string>)[key] ?? S.de[key];
  // Kennzeichnungspflicht: der Provisionshinweis haengt am Footer, damit er auf
  // jeder Seite steht. Erscheint nur, wenn wirklich eine Kennung gesetzt ist.
  if (key === "footer" && affiliateActive()) return `${v} ${t(lang, "aff_footer")}`;
  return v;
}
