"use client";
import { usePathname } from "next/navigation";
import { IcBookmark, IcSearch, IcUpload, IcUser } from "@/components/Icons";
import type { Lang } from "@/lib/i18n";

// Ziele sind die Seiten, die es wirklich gibt: /, /collections, /submit, /login.
const TABS = [
  { href: "/", de: "Suche", en: "Search", Icon: IcSearch },
  { href: "/collections", de: "Sammlungen", en: "Collections", Icon: IcBookmark },
  { href: "/submit", de: "Einreichen", en: "Submit", Icon: IcUpload },
  { href: "/login", de: "Konto", en: "Account", Icon: IcUser },
];

export default function TabBar({ lang }: { lang: Lang }) {
  const path = usePathname();
  return (
    <nav className="tab-bar" aria-label={lang === "en" ? "Main" : "Hauptnavigation"}>
      {TABS.map(({ href, de, en, Icon }) => {
        const on = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <a key={href} className="tab-bar__item" href={href} aria-current={on ? "page" : undefined}>
            <Icon size={22} />
            <span className="tab-bar__label">{lang === "en" ? en : de}</span>
          </a>
        );
      })}
    </nav>
  );
}
