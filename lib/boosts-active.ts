import { createAdminClient } from "@/lib/supabase/admin";

export interface ActiveBoosts {
  profiles: Set<string>; // provider_ids avec un boost "profil" actif
  realisations: Set<string>; // photo ids avec un boost "realisation" actif
}

// Lit toutes les mises en avant actives (status=active ET pas expirées).
// Service role : la recherche publique doit voir TOUS les boosts, pas seulement
// ceux de l'utilisateur. En cas d'erreur (ex. table absente), renvoie du vide
// pour ne jamais casser la page publique.
export async function getActiveBoosts(): Promise<ActiveBoosts> {
  const profiles = new Set<string>();
  const realisations = new Set<string>();
  try {
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data } = await admin
      .from("boosts")
      .select("type, provider_id, target_id")
      .eq("status", "active")
      .gt("ends_at", nowIso)
      .in("type", ["profil", "realisation"]);
    for (const b of (data as
      | { type: string; provider_id: string; target_id: string | null }[]
      | null) ?? []) {
      if (b.type === "profil") profiles.add(b.provider_id);
      else if (b.type === "realisation" && b.target_id)
        realisations.add(b.target_id);
    }
  } catch {
    // silencieux : pas de boost plutôt qu'une page cassée
  }
  return { profiles, realisations };
}

// Mélange (Fisher-Yates) — rotation équitable entre éléments mis en avant.
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
