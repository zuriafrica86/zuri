// ============================================================================
//  Adaptateur SingPay — paiement hébergé (endpoint POST /ext)
//  Spec confirmée depuis le Workspace SingPay :
//    Base URL : https://gateway.singpay.ga/v1
//    POST /ext  → renvoie le lien vers la page de paiement externe
//    GET  /transaction/api/search/by-reference/{reference} → statut
//    En-têtes requis : x-client-id, x-client-secret, x-wallet
//  Aucune clé en clair : tout vient des secrets Cloudflare.
// ============================================================================

const BASE_URL = process.env.SINGPAY_BASE_URL || "https://gateway.singpay.ga/v1";
const CLIENT_ID = process.env.SINGPAY_CLIENT_ID || "";
const CLIENT_SECRET = process.env.SINGPAY_CLIENT_SECRET || "";
const WALLET_ID = process.env.SINGPAY_WALLET_ID || "";
// Logo affiché sur la page de paiement SingPay (optionnel).
const LOGO_URL =
  process.env.SINGPAY_LOGO_URL || "https://zuriafrica.app/logo-zuri-email-rose.png";

// La recharge n'est proposée que si les 3 secrets sont présents.
export function singpayConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET && WALLET_ID);
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-client-id": CLIENT_ID,
    "x-client-secret": CLIENT_SECRET,
    "x-wallet": WALLET_ID,
  };
}

export interface CreatePaymentInput {
  amount: number; // FCFA
  reference: string; // notre référence interne (idempotence)
  successUrl: string; // retour après paiement réussi
  errorUrl: string; // retour après échec
}

export interface CreatePaymentResult {
  redirectUrl: string; // lien vers la page de paiement SingPay
}

// POST /ext → récupère le lien de la page de paiement externe.
export async function createHostedPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const res = await fetch(`${BASE_URL}/ext`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      portefeuille: WALLET_ID,
      reference: input.reference,
      redirect_success: input.successUrl,
      redirect_error: input.errorUrl,
      amount: input.amount,
      logoURL: LOGO_URL,
      isTransfer: false,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`SingPay /ext ${res.status} ${txt}`.trim());
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const inner = (data.data as Record<string, unknown> | undefined) ?? {};
  // La réponse contient le lien ; on couvre les noms de champ probables.
  const redirectUrl =
    (data.link as string) ||
    (data.url as string) ||
    (data.lien as string) ||
    (data.payment_url as string) ||
    (data.redirect as string) ||
    (inner.link as string) ||
    (inner.url as string) ||
    "";
  if (!redirectUrl) throw new Error("SingPay: lien de paiement absent.");
  return { redirectUrl };
}

export type PaymentStatus = "paid" | "pending" | "failed";

// GET /transaction/api/search/by-reference/{reference} → statut réel.
// Source de vérité : on interroge SingPay, on ne se fie jamais au seul retour.
export async function getPaymentStatus(
  reference: string
): Promise<PaymentStatus> {
  try {
    const res = await fetch(
      `${BASE_URL}/transaction/api/search/by-reference/${encodeURIComponent(
        reference
      )}`,
      { method: "GET", headers: authHeaders() }
    );
    if (!res.ok) return "pending";
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    // Le statut peut être à plusieurs niveaux selon l'enveloppe de réponse.
    const inner =
      (data.data as Record<string, unknown> | undefined) ??
      (data.transaction as Record<string, unknown> | undefined) ??
      (Array.isArray(data) ? (data[0] as Record<string, unknown>) : undefined) ??
      {};
    const raw = String(
      (data.status as string) ??
        (data.state as string) ??
        (data.etat as string) ??
        (inner.status as string) ??
        (inner.state as string) ??
        (inner.etat as string) ??
        ""
    )
      .toLowerCase()
      .trim();

    if (
      ["success", "successful", "paid", "completed", "complete", "réussi", "reussi", "valide", "validé", "1", "true"].includes(
        raw
      )
    )
      return "paid";
    if (
      ["failed", "fail", "error", "cancelled", "canceled", "annulé", "annule", "echoue", "échoué", "rejected", "0", "false"].includes(
        raw
      )
    )
      return "failed";
    return "pending";
  } catch {
    return "pending";
  }
}
