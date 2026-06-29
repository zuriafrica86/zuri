// Paramètres des mises en avant (boosts) — sans dépendance serveur.
// 👉 POUR CHANGER LES PRIX, c'est ICI (en Zuri).

export type BoostType = "profil" | "realisation" | "service" | "categorie";

export const BOOST_DURATIONS = [3, 7, 30] as const;
export type BoostDuration = (typeof BOOST_DURATIONS)[number];

// Grille de prix en Zuri : [type][durée].
export const BOOST_PRICES: Record<BoostType, Record<BoostDuration, number>> = {
  profil: { 3: 1000, 7: 2000, 30: 6000 },
  realisation: { 3: 700, 7: 1500, 30: 4500 },
  service: { 3: 700, 7: 1500, 30: 4500 },
  categorie: { 3: 1500, 7: 3000, 30: 9000 },
};

export function boostPrice(type: BoostType, days: number): number {
  const row = BOOST_PRICES[type];
  if (!row) return 0;
  return row[days as BoostDuration] ?? 0;
}

export const BOOST_LABEL: Record<BoostType, string> = {
  profil: "Profil boosté",
  realisation: "Réalisation mise en avant",
  service: "Service mis en avant",
  categorie: "Top de la catégorie",
};

export function durationLabel(days: number): string {
  return `${days} jours`;
}

// Jours restants avant l'échéance (au moins 0).
export function daysLeft(endsAt: string): number {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

// "encore 4 j" / "dernier jour"
export function remainingLabel(endsAt: string): string {
  const d = daysLeft(endsAt);
  if (d <= 0) return "terminé";
  if (d === 1) return "dernier jour";
  return `encore ${d} j`;
}
