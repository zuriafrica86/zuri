// Paramètres du Crédit Zuri — ajustables ici.
// (Fichier sans dépendance serveur : importable partout.)

export const COMMISSION_RATE = 0.1; // 10 % du prix de la prestation
export const WELCOME_BONUS = 5000; // Zuri offerts à la validation
export const DEFAULT_COMMISSION = 1000; // si la prestation n'a pas de prix connu

export const ALERT_HIGH = 2000; // seuil "il te reste quelques prestations"
export const ALERT_LOW = 1000; // seuil "pense à recharger"

// Commission (en Zuri) pour un prix de prestation donné.
export function commissionFor(price: number | null | undefined): number {
  if (!price || price <= 0) return DEFAULT_COMMISSION;
  return Math.round(price * COMMISSION_RATE);
}

export function formatZuri(n: number): string {
  return `${n.toLocaleString("fr-FR")} Zuri`;
}

// Niveau d'alerte d'un solde : "ok" | "high" | "low" | "empty".
export function creditLevel(balance: number): "ok" | "high" | "low" | "empty" {
  if (balance <= 0) return "empty";
  if (balance <= ALERT_LOW) return "low";
  if (balance <= ALERT_HIGH) return "high";
  return "ok";
}
