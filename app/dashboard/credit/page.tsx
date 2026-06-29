import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatZuri, creditLevel, ALERT_HIGH, ALERT_LOW } from "@/lib/credit";
import { singpayConfigured } from "@/lib/singpay";
import { RechargePanel } from "@/components/recharge-panel";

interface Tx {
  id: string;
  amount: number;
  type: string;
  reason: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  bonus: "Bonus de bienvenue",
  recharge: "Recharge",
  commission: "Consommation (RDV confirmé)",
  refund: "Remboursement",
  adjust: "Ajustement",
  boost: "Mise en avant (boost)",
  boost_refund: "Remboursement de boost",
};

export default async function CreditPage({
  searchParams,
}: {
  searchParams: Promise<{ insufficient?: string; recharge?: string }>;
}) {
  const { insufficient, recharge } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prov } = await supabase
    .from("providers")
    .select("id, credit_balance, credit_paused")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prov) redirect("/dashboard");

  const balance = prov.credit_balance ?? 0;
  const level = creditLevel(balance);

  const { data: txData } = await supabase
    .from("wallet_transactions")
    .select("id, amount, type, reason, created_at")
    .eq("provider_id", prov.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const txs = (txData as Tx[] | null) ?? [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Mon Crédit Zuri</h1>
          <p className="mt-1 text-sm text-cacao/60">
            Ton portefeuille pour rester visible dans la recherche.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-cacao/60 transition hover:bg-rose/30 hover:text-cacao"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Retour
        </Link>
      </div>

      {insufficient && (
        <div className="mb-5 rounded-xl2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Crédit insuffisant pour confirmer ce rendez-vous. Recharge ton
          portefeuille pour continuer à recevoir des clientes.
        </div>
      )}

      {recharge === "succes" && (
        <div className="mb-5 rounded-xl2 bg-green-50 px-4 py-3 text-sm text-green-700">
          Paiement reçu — ton Crédit Zuri a été rechargé. ✨
        </div>
      )}
      {recharge === "attente" && (
        <div className="mb-5 rounded-xl2 bg-rose/40 px-4 py-3 text-sm text-cacao">
          Paiement en cours de confirmation. Ton solde se mettra à jour dès
          réception — tu peux rafraîchir la page dans un instant.
        </div>
      )}
      {(recharge === "echec" || recharge === "retour") && (
        <div className="mb-5 rounded-xl2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Le paiement n&apos;a pas abouti. Aucun crédit n&apos;a été débité — tu
          peux réessayer.
        </div>
      )}

      {/* Solde — carte portefeuille */}
      <div className="rounded-4xl bg-cacao p-6 text-ivoire shadow-card">
        <div className="flex items-center gap-2 text-ivoire/70">
          <Wallet className="h-4 w-4" aria-hidden />
          <span className="text-sm">Solde disponible</span>
        </div>
        <p className="mt-2 font-display text-4xl">{formatZuri(balance)}</p>
      </div>

      {level === "empty" && (
        <div className="mt-4 rounded-xl2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Ton crédit est épuisé. Ton profil est en pause (masqué de la
          recherche) jusqu&apos;à recharge.
        </div>
      )}
      {level === "low" && (
        <div className="mt-4 rounded-xl2 bg-rose/40 px-4 py-3 text-sm text-cacao">
          Il te reste moins de {formatZuri(ALERT_LOW)}. Pense à recharger pour
          rester visible.
        </div>
      )}
      {level === "high" && (
        <div className="mt-4 rounded-xl2 bg-or-clair/50 px-4 py-3 text-sm text-cacao">
          Il te reste moins de {formatZuri(ALERT_HIGH)} — encore quelques
          prestations avant épuisement.
        </div>
      )}

      {/* Recharge */}
      {singpayConfigured() ? (
        <RechargePanel />
      ) : (
        <div className="mt-5 rounded-4xl border border-sable bg-white p-5 text-sm text-cacao/80 shadow-soft">
          <p className="font-medium text-cacao">Comment recharger ?</p>
          <p className="mt-1.5 leading-relaxed">
            Envoie le montant souhaité par Mobile Money à l&apos;équipe Zuri, puis
            préviens-nous : ton Crédit Zuri sera ajouté à ton portefeuille.
            <br />
            <span className="text-cacao/50">
              (Le rechargement automatique par Mobile Money arrive bientôt.)
            </span>
          </p>
        </div>
      )}

      {/* Historique */}
      <h2 className="mt-7 font-display text-xl">Historique</h2>
      {txs.length === 0 ? (
        <p className="mt-3 text-sm text-cacao/50">
          Aucun mouvement pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-sable overflow-hidden rounded-xl2 border border-sable bg-white">
          {txs.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-cacao">
                  {TYPE_LABEL[t.type] ?? t.type}
                </p>
                <p className="text-xs text-cacao/50">
                  {t.reason ? `${t.reason} · ` : ""}
                  {new Date(t.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <span
                className={
                  t.amount >= 0
                    ? "shrink-0 font-medium text-green-700"
                    : "shrink-0 font-medium text-cacao"
                }
              >
                {t.amount >= 0 ? "+" : ""}
                {t.amount.toLocaleString("fr-FR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
