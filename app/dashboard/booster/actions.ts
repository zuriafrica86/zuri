"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyWalletTx } from "@/lib/wallet";
import {
  boostPrice,
  BOOST_DURATIONS,
  BOOST_LABEL,
  type BoostType,
} from "@/lib/boost";
import { notifyBoostActivated } from "@/lib/notify";

export type BoostResult = { ok?: boolean; error?: string } | null;

const VALID_TYPES: BoostType[] = [
  "profil",
  "realisation",
  "service",
  "categorie",
];

export async function purchaseBoost(
  _prev: BoostResult,
  formData: FormData
): Promise<BoostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé." };

  const { data: prov } = await supabase
    .from("providers")
    .select("id, business_name, credit_balance, user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prov) return { error: "Profil introuvable." };

  const type = String(formData.get("type") || "") as BoostType;
  const days = parseInt(String(formData.get("days") || ""), 10);
  const targetId = String(formData.get("target_id") || "").trim() || null;
  const targetLabel =
    String(formData.get("target_label") || "").trim() || null;

  if (!VALID_TYPES.includes(type)) return { error: "Type de boost invalide." };
  if (!BOOST_DURATIONS.includes(days as (typeof BOOST_DURATIONS)[number]))
    return { error: "Durée invalide." };
  if ((type === "realisation" || type === "service") && !targetId)
    return { error: "Choisis d'abord l'élément à mettre en avant." };

  const cost = boostPrice(type, days);
  if (cost <= 0) return { error: "Tarif indisponible pour cette durée." };

  const balance = prov.credit_balance ?? 0;
  if (balance < cost)
    return {
      error: `Crédit insuffisant : il te faut ${cost.toLocaleString(
        "fr-FR"
      )} Zuri (solde actuel : ${balance.toLocaleString("fr-FR")}).`,
    };

  const admin = createAdminClient();
  const endsAt = new Date(Date.now() + days * 86_400_000).toISOString();

  // 1) Créer la mise en avant (active immédiatement).
  const { error: insErr } = await admin.from("boosts").insert({
    provider_id: prov.id,
    type,
    target_id: targetId,
    target_label: targetLabel,
    ends_at: endsAt,
    status: "active",
    cost,
  });
  if (insErr) return { error: "Impossible de créer la mise en avant." };

  // 2) Débiter le Crédit Zuri + écrire l'historique.
  await applyWalletTx(prov.id, -cost, "boost", `${BOOST_LABEL[type]} · ${days} j`);

  // 3) Email de confirmation (best effort, jamais bloquant).
  if (prov.user_id) {
    const { data: prof } = await admin
      .from("profiles")
      .select("email")
      .eq("id", prov.user_id)
      .maybeSingle();
    if (prof?.email) {
      try {
        await notifyBoostActivated(prof.email, {
          label: BOOST_LABEL[type],
          days,
          endsAt,
        });
      } catch {
        // une notif ratée ne doit pas annuler l'achat
      }
    }
  }

  revalidatePath("/dashboard/booster");
  revalidatePath("/dashboard/credit");
  return { ok: true };
}
