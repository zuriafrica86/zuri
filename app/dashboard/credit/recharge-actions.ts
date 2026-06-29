"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  singpayConfigured,
  createHostedPayment,
} from "@/lib/singpay";

export type RechargeResult = { error?: string } | null;

const MIN = 500;
const MAX = 1_000_000;

function appBase(): string {
  return process.env.APP_URL || "https://zuriafrica.app";
}

export async function startRecharge(
  _prev: RechargeResult,
  formData: FormData
): Promise<RechargeResult> {
  if (!singpayConfigured())
    return { error: "La recharge par Mobile Money n'est pas encore activée." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé." };

  const { data: prov } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prov) return { error: "Profil introuvable." };

  const amount = Math.round(Number(formData.get("amount")));
  if (!Number.isFinite(amount) || amount < MIN)
    return { error: `Montant minimum : ${MIN.toLocaleString("fr-FR")} FCFA.` };
  if (amount > MAX)
    return { error: `Montant maximum : ${MAX.toLocaleString("fr-FR")} FCFA.` };

  const reference = `R-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`.toUpperCase();

  const admin = createAdminClient();
  const { error: insErr } = await admin.from("recharges").insert({
    provider_id: prov.id,
    reference,
    amount,
    status: "pending",
  });
  if (insErr) return { error: "Impossible de démarrer la recharge." };

  let redirectUrl = "";
  try {
    const created = await createHostedPayment({
      amount,
      reference,
      successUrl: `${appBase()}/api/singpay/return?ref=${reference}`,
      errorUrl: `${appBase()}/dashboard/credit?recharge=echec`,
    });
    redirectUrl = created.redirectUrl;
  } catch {
    await admin
      .from("recharges")
      .update({ status: "failed" })
      .eq("reference", reference);
    return { error: "Le paiement n'a pas pu démarrer. Réessaie." };
  }

  // Hors du try/catch : redirect() lève volontairement une exception interne.
  redirect(redirectUrl);
}
