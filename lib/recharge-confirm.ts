import { createAdminClient } from "@/lib/supabase/admin";
import { applyWalletTx } from "@/lib/wallet";
import { getPaymentStatus, type PaymentStatus } from "@/lib/singpay";

// Vérifie une recharge auprès de SingPay et crédite le portefeuille de façon
// idempotente. Utilisée au retour de paiement ET par un éventuel webhook.
// Renvoie l'état final connu pour cette référence.
export async function confirmRecharge(
  reference: string
): Promise<PaymentStatus | "unknown"> {
  const admin = createAdminClient();

  const { data: r } = await admin
    .from("recharges")
    .select("id, provider_id, amount, status")
    .eq("reference", reference)
    .maybeSingle();

  if (!r) return "unknown";
  if (r.status === "paid") return "paid"; // déjà crédité — idempotent
  if (r.status === "failed") return "failed";

  const status = await getPaymentStatus(reference);

  if (status === "paid") {
    // Ne crédite que si la transition pending → paid est gagnée (anti double-crédit).
    const { data: updated } = await admin
      .from("recharges")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", r.id)
      .eq("status", "pending")
      .select("id");
    if (updated && updated.length > 0) {
      await applyWalletTx(
        r.provider_id as string,
        r.amount as number,
        "recharge",
        "Recharge Mobile Money (SingPay)"
      );
    }
    return "paid";
  }

  if (status === "failed") {
    await admin
      .from("recharges")
      .update({ status: "failed" })
      .eq("id", r.id)
      .eq("status", "pending");
    return "failed";
  }

  return "pending";
}
