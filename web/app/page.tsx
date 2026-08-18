"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AGENTS, itemKey, rawUrl, type Item } from "@/lib/agents";
import { curOf, eurOf, fmtCNY, fmtCur, fold, loadDb, type Cur, type Rates } from "@/lib/data";
import { t, type Lang, type TKey } from "@/lib/i18n";
import { usePrefs, type Theme } from "@/components/Prefs";
import UserBar from "@/components/UserBar";
import TabBar from "@/components/TabBar";
import Sheet from "@/components/Sheet";
import ChipStrip from "@/components/ChipStrip";
import FilterSheet, { type Draft } from "@/components/FilterSheet";
import DetailSheet from "@/components/DetailSheet";
import { IcCheck, IcClose, IcFilter, IcGrid, IcPlus, IcRows, IcSearch, IcShield } from "@/components/Icons";

// 40 statt 120: auf 390px sind 6 Karten sichtbar, 120 zogen 33 Bilder mit 230 KB nach.
const BATCH = 40;
const VERIFIED = "Von uns verifiziert";
const CAT_ORDER = [
  VERIFIED, "Schuhe", "Shirts & Tees", "Hoodies & Sweater", "Jacken", "Hosen & Shorts",
  "Kleider & Röcke", "Trikots", "Taschen", "Uhren", "Schmuck & Accessoires", "Parfum",
  "Elektronik", "Home & Deko", "Sonstiges",
];
const CAT_EN: Record<string, string> = {
  [VERIFIED]: "Verified by us", "Schuhe": "Shoes", "Shirts & Tees": "Shirts & Tees",
  "Hoodies & Sweater": "Hoodies & Sweaters", "Jacken": "Jackets", "Hosen & Shorts": "Pants & Shorts",
  "Kleider & Röcke": "Dresses & Skirts", "Trikots": "Jerseys", "Taschen": "Bags", "Uhren": "Watches",
  "Schmuck & Accessoires": "Jewelry & Accessories", "Parfum": "Fragrance",
  "Elektronik": "Electronics", "Home & Deko": "Home & Decor", "Sonstiges": "Other", "Alle": "All",
};

// grobe clientseitige Variante von parse.extract_ref fuer eingereichte URLs
function parseRef(u: string): { pf?: Item["pf"]; pid?: string } {
  try {
    const url = new URL(u);
    const q = url.searchParams;
    const inner = q.get("url") || q.get("productLink");
    if (inner && /^https?:/.test(inner)) return parseRef(decodeURIComponent(inner));
    const host = url.hostname;
    if (host.includes("weidian.com")) {
      const id = q.get("itemID") || q.get("itemId") || q.get("id");
      if (id) return { pf: "wd", pid: id };
    }
    if (host.includes("taobao.com") || host.includes("tmall.com")) {
      const id = q.get("id");
      if (id) return { pf: "tb", pid: id };
    }
    if (host.includes("1688.com")) {
      const m = url.pathname.match(/\/offer\/(\d+)/);
      if (m) return { pf: "al", pid: m[1] };
    }
    const id = q.get("id");
    const plat = (q.get("shop_type") || q.get("platform") || q.get("channel") || q.get("source") || "").toLowerCase();
    if (id && plat) {
      if (plat.startsWith("weidian") || plat.startsWith("wd")) return { pf: "wd", pid: id };
      if (plat.startsWith("taobao") || plat.startsWith("tb")) return { pf: "tb", pid: id };
      if (plat.includes("1688") || plat.startsWith("al")) return { pf: "al", pid: id };
    }
  } catch { /* keine URL */ }
  return {};
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Home() {
  const { prefs, setPrefs, needsOnboarding, finishOnboarding } = usePrefs();
  const { cur, lang } = prefs;
  const tr = useCallback((k: TKey) => t(lang, k), [lang]);
  const catLabel = useCallback(
    (c: string) => (lang === "en" ? CAT_EN[c] || c : c), [lang]);

  const [items, setItems] = useState<Item[]>([]);
  const [rates, setRates] = useState<Rates>({ CNY: 7.8, USD: 1.08, GBP: 0.85, EUR: 1 });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [qLive, setQLive] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState("rel");
  const [pmin, setPmin] = useState("");
  const [pmax, setPmax] = useState("");
  const [dense, setDense] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [shown, setShown] = useState(BATCH);
  const [modal, setModal] = useState<Item | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const debRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const db = await loadDb();
        let extra: Item[] = [];
        try {
          type VerRow = { name: string; url: string; price?: string; category?: string; image_url?: string; rating: number; note?: string };
          type SubRow = { name: string; url: string; price?: string; category: string; image_url?: string };
          const [ver, subs] = await Promise.all([
            fetch("/api/verified").then((r) => (r.ok ? (r.json() as Promise<VerRow[]>) : [])),
            fetch("/api/submissions?scope=approved").then((r) => (r.ok ? (r.json() as Promise<SubRow[]>) : [])),
          ]);
          extra = [
            ...ver.map((v) => ({
              n: v.name, b: "", c: v.category || VERIFIED, i: v.image_url || "",
              p: v.price || "", u: v.url, ...parseRef(v.url),
              verified: { rating: Number(v.rating), note: v.note || "" },
            })),
            ...subs.map((s) => ({
              n: s.name, b: "", c: s.category, i: s.image_url || "",
              p: s.price || "", u: s.url, ...parseRef(s.url),
            })),
          ];
          for (const it of extra) it._h = fold(`${it.n} ${it.c}`);
          const col = await fetch("/api/collections");
          if (col.ok) {
            const { items: ci } = (await col.json()) as { items: { item_key: string }[] };
            setSavedKeys(new Set(ci.map((r) => r.item_key)));
          }
        } catch { /* User-Daten optional - statische Daten reichen */ }
        const all = [...extra, ...db.items];
        setItems(all);
        setRates(db.rates);
        setLoaded(true);
        // Deep-Link ?item=<key> oeffnet das Item direkt
        const want = new URLSearchParams(window.location.search).get("item");
        if (want) {
          const hit = all.find((it) => itemKey(it) === want);
          if (hit) setModal(hit);
        }
      } catch (e) {
        setError(String(e));
      }
    })();
  }, []);

  const view = useMemo(() => {
    const toks = fold(qLive.trim()).split(/\s+/).filter(Boolean);
    const lo = parseFloat(pmin), hi = parseFloat(pmax);
    const hasLo = !isNaN(lo), hasHi = !isNaN(hi);
    let v = items.filter((it) => {
      if (cat === VERIFIED) { if (!it.verified) return false; }
      else if (cat && it.c !== cat) return false;
      if (toks.length) {
        const hay = it._h || "";
        for (const tk of toks) if (!hay.includes(tk)) return false;
      }
      if (hasLo || hasHi) {
        const p = curOf(it, rates, cur);
        if (isNaN(p)) return false;
        if (hasLo && p < lo) return false;
        if (hasHi && p > hi) return false;
      }
      return true;
    });
    if (sort === "name") v = [...v].sort((a, b) => a.n.localeCompare(b.n, lang));
    else if (sort === "pa" || sort === "pd") {
      const dir = sort === "pa" ? 1 : -1;
      v = [...v].sort((a, b) => {
        const x = eurOf(a, rates), y = eurOf(b, rates);
        if (isNaN(x) && isNaN(y)) return 0;
        if (isNaN(x)) return 1;
        if (isNaN(y)) return -1;
        return (x - y) * dir;
      });
    } else if (sort === "shuffle") v = shuffled(v);
    return v;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, qLive, cat, sort, rates, pmin, pmax, cur, lang, shuffleSeed]);

  // Trefferzahl fuer einen Filter-Entwurf, ohne die sichtbare Liste anzufassen.
  const countFor = useCallback((mn: string, mx: string, c: Cur) => {
    const toks = fold(qLive.trim()).split(/\s+/).filter(Boolean);
    const lo = parseFloat(mn), hi = parseFloat(mx);
    const hasLo = !isNaN(lo), hasHi = !isNaN(hi);
    let n = 0;
    outer: for (const it of items) {
      if (cat === VERIFIED) { if (!it.verified) continue; }
      else if (cat && it.c !== cat) continue;
      const hay = it._h || "";
      for (const tk of toks) if (!hay.includes(tk)) continue outer;
      if (hasLo || hasHi) {
        const p = curOf(it, rates, c);
        if (isNaN(p)) continue;
        if (hasLo && p < lo) continue;
        if (hasHi && p > hi) continue;
      }
      n++;
    }
    return n;
  }, [items, qLive, cat, rates]);

  useEffect(() => { setShown(BATCH); }, [qLive, cat, sort, pmin, pmax, shuffleSeed]);

  // Nachladen per Beobachter am Listenende. Der Knopf darunter bleibt als
  // Rueckfall fuer Tastaturbedienung erreichbar.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || shown >= view.length) return;
    const io = new IntersectionObserver(
      (es) => { if (es[0].isIntersecting) setShown((s) => s + BATCH); },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, view.length]);

  const onSearch = useCallback((val: string) => {
    setQ(val);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setQLive(val), 90);
  }, []);

  const priceLabel = useCallback((it: Item): string => {
    const v = curOf(it, rates, cur);
    return isNaN(v) ? it.p || "" : fmtCur(v, cur);
  }, [rates, cur]);

  const cnyLabel = useCallback((it: Item): string => {
    const eur = eurOf(it, rates);
    return isNaN(eur) ? "" : fmtCNY(eur * rates.CNY);
  }, [rates]);

  async function toggleSave(it: Item) {
    const key = itemKey(it);
    const r = await fetch("/api/collections/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        item_key: key, item_name: it.n, item_image: it.i || "", item_price: priceLabel(it),
      }),
    });
    if (r.status === 401) { window.location.href = "/login"; return; }
    if (!r.ok) return;
    const { saved } = await r.json();
    setSavedKeys((p) => {
      const n = new Set(p);
      if (saved) n.add(key); else n.delete(key);
      return n;
    });
  }

  function openModal(it: Item | null) {
    setModal(it);
    const url = new URL(window.location.href);
    if (it) url.searchParams.set("item", itemKey(it));
    else url.searchParams.delete("item");
    window.history.replaceState(null, "", url.toString());
  }

  function applyFilter(d: Draft) {
    setPmin(d.pmin);
    setPmax(d.pmax);
    setPrefs({ cur: d.cur, lang: d.lang, theme: d.theme, agent: d.agent });
  }

  const cats = useMemo(() => {
    const present = new Set(items.map((i) => i.c));
    const hasVerified = items.some((i) => i.verified);
    return CAT_ORDER.filter((c) => (c === VERIFIED ? hasVerified : present.has(c)));
  }, [items]);

  const filterCount = (pmin ? 1 : 0) + (pmax ? 1 : 0);
  const locale = lang === "en" ? "en-GB" : "de-AT";
  return (
    <>
      <header className="app-bar">
        <div className="app-bar__inner">
          <div className="app-bar__row">
            <h1 className="wordmark"><a href="/">Kern<span className="wordmark__mark">/</span>Search</a></h1>
            <div className="app-bar__count">
              {items.length.toLocaleString(locale)} {tr("items")}
            </div>
            <UserBar />
          </div>

          {/* Suchfeld ueber die volle Breite, danach Chips, danach Ergebniszeile. */}
          <div className="search">
            <span className="search__icon" aria-hidden><IcSearch size={18} /></span>
            <input ref={searchRef} className="search__input" id="q" type="search" placeholder={tr("search_ph")}
              autoComplete="off" enterKeyHint="search" inputMode="search"
              value={q} onChange={(e) => onSearch(e.target.value)} aria-label={tr("search_ph")} />
            {q && (
              <button className="search__clear" type="button" aria-label="Suche leeren"
                onClick={() => { onSearch(""); searchRef.current?.focus(); }}>
                <IcClose size={18} />
              </button>
            )}
          </div>

          <ChipStrip cats={cats} cat={cat} onPick={setCat} label={catLabel} verified={VERIFIED} />

          <div className="result-bar">
            <span className="result-bar__count" aria-live="polite">
              <b>{view.length.toLocaleString(locale)}</b> {tr("hits")}
            </span>
            <button className="result-bar__btn" type="button" onClick={() => setFilterOpen(true)}>
              <IcFilter size={18} />
              <span>Filter</span>
              {filterCount > 0 && <span className="result-bar__dot" aria-hidden />}
            </button>
            <label className="result-bar__sort">
              <span className="vh">{tr("sort_rel")}</span>
              <select value={sort} onChange={(e) => {
                const v = e.target.value;
                setSort(v);
                if (v === "shuffle") setShuffleSeed((s) => s + 1);
              }} aria-label="Sort">
                <option value="rel">{tr("sort_rel")}</option>
                <option value="pa">{tr("sort_pa")}</option>
                <option value="pd">{tr("sort_pd")}</option>
                <option value="name">{tr("sort_name")}</option>
                <option value="shuffle">{tr("discover")}</option>
              </select>
            </label>
            <button className="result-bar__btn result-bar__btn--icon" type="button"
              aria-pressed={dense} aria-label={dense ? "Rasteransicht" : "Kompaktansicht"}
              onClick={() => setDense((d) => !d)}>
              {dense ? <IcGrid size={18} /> : <IcRows size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="page page--wide">
        {!loaded && !error && <div className="loading">{tr("loading")}</div>}
        {error && <div className="notice err">Error: {error}</div>}
        {loaded && view.length === 0 && (
          <div className="empty">
            <div className="empty__title">{tr("empty_title")}</div>
            {tr("empty_sub")}
          </div>
        )}
        {loaded && view.length > 0 && (
          dense ? (
            <div className="rows">
              {view.slice(0, shown).map((it, i) => (
                <Row key={itemKey(it) + i} it={it} price={priceLabel(it)} cny={cnyLabel(it)}
                  onOpen={() => openModal(it)} />
              ))}
            </div>
          ) : (
            <div className="grid" id="grid">
              {view.slice(0, shown).map((it, i) => (
                <Card key={itemKey(it) + i} it={it} price={priceLabel(it)} cny={cnyLabel(it)}
                  saved={savedKeys.has(itemKey(it))} priority={i < 2}
                  onOpen={() => openModal(it)} onSave={() => toggleSave(it)} />
              ))}
            </div>
          )
        )}
        <div ref={sentinelRef} className="sentinel" aria-hidden />
        {loaded && shown < view.length && (
          <button className="btn btn--ghost more-btn" onClick={() => setShown((s) => s + BATCH)}>
            {tr("load_more")}
          </button>
        )}
      </main>

      <footer className="site-footer">{tr("footer")}</footer>

      <TabBar lang={lang} />

      {filterOpen && (
        <FilterSheet
          init={{ pmin, pmax, cur, lang, theme: prefs.theme, agent: prefs.agent }}
          countFor={countFor}
          onApply={applyFilter}
          onClose={() => setFilterOpen(false)} />
      )}

      {needsOnboarding && <Onboarding onDone={finishOnboarding} />}

      {modal && <DetailSheet it={modal} rates={rates} cur={cur} lang={lang} agentKey={prefs.agent}
        saved={savedKeys.has(itemKey(modal))}
        onSave={() => toggleSave(modal)} onClose={() => openModal(null)} />}
    </>
  );
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const { prefs, setPrefs } = usePrefs();
  const [lang, setLang] = useState<Lang>(prefs.lang);
  const [cur, setCur] = useState<Cur>(prefs.cur);
  const [theme, setTheme] = useState<Theme>(prefs.theme);
  const [agent, setAgent] = useState(prefs.agent);
  const tr = (k: TKey) => t(lang, k);
  const seg = (on: boolean) => `segbtn${on ? " on" : ""}`;

  return (
    <Sheet title={tr("ob_title")} onClose={onDone}
      footer={(dismiss) => (
        <button className="btn sheet__footer-apply" type="button"
          onClick={() => { setPrefs({ lang, cur, theme, agent }); dismiss(); }}>
          {tr("ob_done")}
        </button>
      )}>
      <div className="sheet-sec">
        <p className="sheet-sec__hint">{tr("ob_sub")}</p>
      </div>
      <div className="sheet-sec">
        <div className="sheet-sec__title">{tr("ob_lang")}</div>
        <div className="seg">
          <button className={seg(lang === "de")} type="button" onClick={() => setLang("de")}>Deutsch</button>
          <button className={seg(lang === "en")} type="button" onClick={() => setLang("en")}>English</button>
        </div>
      </div>
      <div className="sheet-sec">
        <div className="sheet-sec__title">{tr("ob_cur")}</div>
        <div className="seg">
          <button className={seg(cur === "EUR")} type="button" onClick={() => setCur("EUR")}>€ EUR</button>
          <button className={seg(cur === "USD")} type="button" onClick={() => setCur("USD")}>$ USD</button>
        </div>
      </div>
      <div className="sheet-sec">
        <div className="sheet-sec__title">{tr("ob_theme")}</div>
        <div className="seg">
          <button className={seg(theme === "light")} type="button" onClick={() => setTheme("light")}>{tr("ob_light")}</button>
          <button className={seg(theme === "dark")} type="button" onClick={() => setTheme("dark")}>{tr("ob_dark")}</button>
        </div>
      </div>
      <div className="sheet-sec">
        <div className="sheet-sec__title">{tr("ob_agent")}</div>
        <p className="sheet-sec__hint">{tr("ob_agent_sub")}</p>
        <div className="agent-grid">
          {AGENTS.map((a) => {
            const key = a.n.toLowerCase();
            return (
              <button key={a.n} type="button" className="chip" aria-pressed={agent === key}
                onClick={() => setAgent(key)}>{a.n}</button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

function Card({ it, price, cny, saved, priority, onOpen, onSave }: {
  it: Item; price: string; cny: string; saved: boolean; priority?: boolean;
  onOpen: () => void; onSave: () => void;
}) {
  const initials = (it.b || it.n).replace(/[^A-Za-z0-9 ]/g, "").split(" ")
    .filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  return (
    <a className="card" href={rawUrl(it)} target="_blank" rel="noopener noreferrer"
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault(); onOpen();
      }}>
      <div className="thumb">
        <div className="ph">{initials}</div>
        {it.verified && (
          <span className="vbadge"><IcShield size={12} /> {it.verified.rating.toFixed(1)}</span>
        )}
        <button className={`savebtn${saved ? " saved" : ""}`} aria-label="Speichern" aria-pressed={saved} type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(); }}>
          {saved ? <IcCheck size={16} /> : <IcPlus size={16} />}
        </button>
        {it.i && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={it.i} alt="" decoding="async" referrerPolicy="no-referrer"
            loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"}
            onError={(e) => e.currentTarget.remove()}
            onLoad={(e) => e.currentTarget.parentElement?.querySelector(".ph")?.remove()} />
        )}
      </div>
      <div className="card-body">
        <div className="name">{it.n}</div>
        <div className="meta">
          <span className="price">{price}</span>
          <span className="src">{cny}</span>
        </div>
      </div>
    </a>
  );
}

// Kompaktzeile nach DESIGN.md 5.2, 64px hoch, ganze Zeile ist Trefferflaeche.
function Row({ it, price, cny, onOpen }: { it: Item; price: string; cny: string; onOpen: () => void }) {
  return (
    <a className="row" href={rawUrl(it)} target="_blank" rel="noopener noreferrer"
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault(); onOpen();
      }}>
      <span className="row__thumb">
        {it.i && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={it.i} alt="" decoding="async" loading="lazy" referrerPolicy="no-referrer"
            onError={(e) => e.currentTarget.remove()} />
        )}
      </span>
      <span className="row__main">
        <span className="row__title">{it.n}</span>
        <span className="row__meta">{[price, cny, it.c].filter(Boolean).join(" · ")}</span>
      </span>
      {it.verified && <span className="row__flag"><IcShield size={16} /></span>}
    </a>
  );
}
