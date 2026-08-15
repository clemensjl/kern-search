"use client";
import { useState } from "react";
import Sheet from "@/components/Sheet";
import { IcArrow, IcBookmark, IcCheck, IcShield } from "@/components/Icons";
import { AGENTS, QCDBS, agentLink, itemKey, rawUrl, type Agent, type Item } from "@/lib/agents";
import { affiliateActive } from "@/lib/affiliate";
import { curOf, eurOf, fmtCNY, fmtCur, type Cur, type Rates } from "@/lib/data";
import { t, type Lang, type TKey } from "@/lib/i18n";

function agentByKey(key: string): Agent {
  return AGENTS.find((a) => a.n.toLowerCase() === key) || AGENTS[0];
}

export default function DetailSheet({ it, rates, cur, lang, agentKey, saved, onSave, onClose }: {
  it: Item; rates: Rates; cur: Cur; lang: Lang; agentKey: string; saved: boolean;
  onSave: () => void; onClose: () => void;
}) {
  const tr = (k: TKey) => t(lang, k);
  const [copied, setCopied] = useState(false);

  const eur = eurOf(it, rates);
  const val = curOf(it, rates, cur);
  const raw = rawUrl(it);
  const favAgent = agentByKey(agentKey);
  const favHref = agentLink(favAgent, it) || raw;
  const platLabel = it.pf === "wd" ? "Original (Weidian)" : it.pf === "tb" ? "Original (Taobao)"
    : it.pf === "al" ? "Original (1688)" : tr("original");

  function share() {
    const url = new URL(window.location.origin);
    url.searchParams.set("item", itemKey(it));
    navigator.clipboard?.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Sheet title={it.n} onClose={onClose} wide
      footer={
        <>
          <button className="btn btn--ghost action-bar__save" type="button" aria-pressed={saved} onClick={onSave}>
            {saved ? <IcCheck size={18} /> : <IcBookmark size={18} />}
            <span>{saved ? tr("saved") : tr("save")}</span>
          </button>
          <a className="btn action-bar__primary" href={favHref} target="_blank" rel="noopener noreferrer">
            <IcArrow size={18} /> <span>{favAgent.n}</span>
          </a>
        </>
      }>
      <div className="detail">
        <div className="gallery">
          {it.i ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={it.i} alt="" referrerPolicy="no-referrer" decoding="async" />
          ) : (
            <div className="gallery__fallback">{(it.b || it.n).slice(0, 2).toUpperCase()}</div>
          )}
        </div>
        <div className="detail__body">
          <div className="detail__eyebrow">{it.b || (it.verified ? tr("verified") : it.c)}</div>
          <h3 className="detail__title">{it.n}</h3>
          <div className="detail__price-row">
            {!isNaN(eur) ? (
              <>
                <span className="detail__price">{fmtCur(val, cur)}</span>
                <span className="detail__price-sub">{fmtCNY(eur * rates.CNY)}</span>
              </>
            ) : it.p ? (
              <span className="detail__price-sub">{it.p}</span>
            ) : (
              <span className="detail__price-sub">{tr("no_price")}</span>
            )}
          </div>
          <div className="detail__meta">{it.c}</div>

          {it.verified && (
            <div className="verified-block">
              <div className="verified-block__title">
                <IcShield size={16} /> {it.verified.rating.toFixed(1)} / 10 · {tr("verified")}
              </div>
              {it.verified.note && <p>{it.verified.note}</p>}
            </div>
          )}

          <div className="detail__actions">
            <button className="btn--sm" type="button" onClick={share}>
              {copied ? <><IcCheck size={14} /> {tr("copied")}</> : tr("copy_link")}
            </button>
            {raw && <a className="btn--sm" href={raw} target="_blank" rel="noopener noreferrer">{platLabel}</a>}
          </div>

          <div className="section-title">{tr("other_agents")}</div>
          {/* Kennzeichnung der Provisionslinks, dauerhaft sichtbar */}
          {affiliateActive() && (
            <p className="detail__meta" style={{ marginTop: 0, marginBottom: 10, lineHeight: 1.5 }}>
              {tr("aff_note")}
            </p>
          )}
          <div className="agent-grid">
            {AGENTS.map((ag) => {
              if (ag.n === favAgent.n) return null;
              const href = agentLink(ag, it);
              if (!href) return null;
              return <a key={ag.n} className="chip" href={href} target="_blank" rel="noopener noreferrer">{ag.n}</a>;
            })}
          </div>

          {raw && (
            <>
              <div className="section-title">{tr("qc_photos")}</div>
              <div className="agent-grid">
                {QCDBS.map((qc) => {
                  const href = agentLink(qc, it);
                  if (!href) return null;
                  return <a key={qc.n} className="chip" href={href} target="_blank" rel="noopener noreferrer">{qc.n}</a>;
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}
