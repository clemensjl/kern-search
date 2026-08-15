// ANNAHMEN zum Versandgewicht je Kategorie. Keine Messwerte, keine Anbieterdaten.
//
// Das Gewicht ist die groesste Unbekannte der ganzen Rechnung und genau der
// Punkt, an dem Nutzer regelmaessig ueberrascht werden ("600 g wurden 1000 g").
// Deshalb: immer eine Spanne, nie ein Punktwert, und die Spanne bewusst breit.
//
// Die Spannen verstehen sich als Versandgewicht ab Lager des Agenten, also
// inklusive Umkarton und Polstermaterial (rund 100 bis 300 g). Agenten wiegen
// nach dem Umpacken - das reine Produktgewicht ist fuer die Rechnung wertlos.
//
// Kategorienamen entsprechen 1:1 den Werten aus items.json (meta.cats).

export type WeightRange = { min: number; max: number };

export const CATEGORY_WEIGHTS_KG: Record<string, WeightRange> = {
  "Elektronik": { min: 0.3, max: 2.5 },
  "Home & Deko": { min: 0.4, max: 3.0 },
  "Hoodies & Sweater": { min: 0.7, max: 1.2 },
  "Hosen & Shorts": { min: 0.4, max: 0.9 },
  "Jacken": { min: 0.8, max: 2.0 },
  "Kleider & Röcke": { min: 0.3, max: 0.8 },
  "Parfum": { min: 0.4, max: 0.9 },
  "Schmuck & Accessoires": { min: 0.1, max: 0.4 },
  "Schuhe": { min: 1.0, max: 2.0 },
  "Shirts & Tees": { min: 0.25, max: 0.5 },
  "Sonstiges": { min: 0.3, max: 2.0 },
  "Taschen": { min: 0.6, max: 1.8 },
  "Trikots": { min: 0.25, max: 0.5 },
  "Uhren": { min: 0.3, max: 0.8 },
};

/** Zusatzhinweise, wo die Spanne allein in die Irre fuehrt. */
export const CATEGORY_WEIGHT_NOTES: Record<string, string> = {
  "Schuhe": "Der Originalkarton wiegt oft mehr als das Paar. Ohne Karton liegt das Gewicht am unteren Rand.",
  "Parfum": "Fluessigkeiten sind auf vielen Luftfrachtlinien gesperrt. Versandart vorher beim Agenten klaeren.",
  "Elektronik": "Akkus schliessen einzelne Linien aus und veraendern den Preis staerker als das Gewicht.",
  "Sonstiges": "Sammelkategorie ohne verwertbares Muster - die Spanne ist entsprechend grob.",
  "Home & Deko": "Sperrige Ware wird meist nach Volumengewicht abgerechnet, nicht nach Waage.",
};

/** Gewichtsspanne fuer eine Kategorie. null, wenn nichts hinterlegt ist. */
export function weightForCategory(cat: string | undefined): WeightRange | null {
  if (!cat) return null;
  return CATEGORY_WEIGHTS_KG[cat] ?? null;
}
