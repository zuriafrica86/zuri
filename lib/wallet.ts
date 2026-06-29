import { createAdminClient } from "@/lib/supabase/admin";

type TxType =
  | "bonus"
  | "recharge"
  | "commission"
  | "refund"
  | "adjust"
  | "boost"
  | "boost_refund";

// Applique un mouvement (montant signé) : insère la transaction,
// met à jour le solde et l'état de pause. Toujours côté serveur.
export async function applyWalletTx(
  providerId: string,
  amount: number,
  type: TxType,
  reason: string,
  bookingId?: string
): Promise<number> {
  const admin = createAdminClient();

  const { data: p } = await admin
    .from("providers")
    .select("credit_balance")
    .eq("id", providerId)
    .single();
  const current = p?.credit_balance ?? 0;
  const next = current + amount;

  await admin.from("wallet_transactions").insert({
    provider_id: providerId,
    amount,
    type,
    reason,
    booking_id: bookingId ?? null,
  });

  await admin
    .from("providers")
    .update({ credit_balance: next, credit_paused: next <= 0 })
    .eq("id", providerId);

  return next;
}

// Crédite le bonus de bienvenue une seule fois (à la première validation).
export async function grantWelcomeBonusOnce(
  providerId: string,
  amount: number
): Promise<void> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("wallet_transactions")
    .select("id")
    .eq("provider_id", providerId)
    .eq("type", "bonus")
    .limit(1)
    .maybeSingle();
  if (existing) return; // déjà crédité
  await applyWalletTx(providerId, amount, "bonus", "Bonus de bienvenue");
}
