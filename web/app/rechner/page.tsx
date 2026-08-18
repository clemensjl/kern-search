// Testseite fuer den Endpreisrechner. Bewusst eigenstaendig, damit die
// Komponente unabhaengig von der Startseite geprueft werden kann.
import type { Metadata } from "next";
import PriceCalc from "@/components/PriceCalc";
import { affiliateActive } from "@/lib/affiliate";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Endpreisrechner – Kern Search",
  description:
    "Warenwert, Versand, Agenturgebühr und Einfuhrabgaben in einer Rechnung. Ergebnis als Spanne, mit offengelegten Annahmen.",
  // Die Seite ist bewusst von nirgendwo verlinkt und noch nicht beworben.
  // Ohne noindex landet sie als vermeintliche Testseite in der Suche.
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 64px", display: "grid", gap: 16 }}>
      <PriceCalc lang="de" />
      <p style={{ fontSize: 11, lineHeight: 1.6, color: "var(--text-2)", fontFamily: "var(--font-data), ui-monospace, monospace" }}>
        {t("de", "footer")}
      </p>
      {affiliateActive() && (
        <p style={{ fontSize: 11, lineHeight: 1.6, color: "var(--text-2)" }}>
          {t("de", "aff_note")}
        </p>
      )}
    </main>
  );
}
