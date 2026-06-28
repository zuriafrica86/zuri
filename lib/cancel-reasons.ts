// Motifs d'annulation et règle du délai. Module sans dépendance serveur
// (importable depuis composants client ET server actions).

export interface CancelReason {
  key: string;
  label: string;
}

export const CANCEL_REASONS_CLIENTE: CancelReason[] = [
  { key: "empechement", label: "Empêchement de dernière minute" },
  { key: "indispo", label: "Je ne suis plus disponible à cet horaire" },
  { key: "changement", label: "J'ai changé d'avis" },
  { key: "budget", label: "Souci de budget" },
  {
    key: "erreur",
    label: "Erreur dans ma réservation (mauvais créneau ou prestation)",
  },
  { key: "sante", label: "Raison de santé" },
  { key: "autre", label: "Autre" },
];

export const CANCEL_REASONS_PRESTATAIRE: CancelReason[] = [
  { key: "empechement", label: "Empêchement / je ne suis plus disponible" },
  { key: "sante", label: "Souci de santé" },
  { key: "complet", label: "Mon agenda est déjà complet" },
  { key: "prestation_arretee", label: "Je ne propose plus cette prestation" },
  { key: "materiel", label: "Produits ou matériel indisponibles" },
  { key: "injoignable", label: "Cliente injoignable" },
  { key: "autre", label: "Autre" },
];

export function reasonsFor(role: "cliente" | "prestataire"): CancelReason[] {
  return role === "prestataire"
    ? CANCEL_REASONS_PRESTATAIRE
    : CANCEL_REASONS_CLIENTE;
}

// Délai minimum : pas d'annulation à moins de 2h du rendez-vous (heure du Gabon, UTC+1).
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

// true = on peut encore annuler (assez tôt). false = trop tard (< 2h).
export function canCancelByDelay(
  date_souhaitee: string,
  heure_souhaitee: string | null
): boolean {
  if (!heure_souhaitee) {
    // Pas d'heure précise : annulable tant que la date est strictement dans le futur.
    const todayGabon = new Date(Date.now() + 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    return date_souhaitee > todayGabon;
  }
  const appt = new Date(
    `${date_souhaitee}T${heure_souhaitee.slice(0, 5)}:00+01:00`
  ).getTime();
  if (Number.isNaN(appt)) return true;
  return appt - Date.now() >= TWO_HOURS_MS;
}

// Un RDV est annulable s'il est encore à venir (en attente ou confirmé) et dans les délais.
export function isCancellable(
  status: string,
  date_souhaitee: string,
  heure_souhaitee: string | null
): boolean {
  return (
    (status === "en_attente" || status === "confirme") &&
    canCancelByDelay(date_souhaitee, heure_souhaitee)
  );
}

export type CancelResult = { ok?: boolean; error?: string };
