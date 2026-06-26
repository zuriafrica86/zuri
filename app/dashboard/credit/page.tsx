import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import {
  formatZuri,
  creditLevel,
  ALERT_HIGH,
  ALERT_LOW,
} from "@/lib/credit";

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
};

export default async function CreditPage({
  searchParams,
}: {
  searchParams: Promise<{ insufficient?: string }>;
}) {
  const { insufficient } = await searchParams;
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
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-sable px-6 py-4">
        <Logo />
        <LogoutButton />
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl">Mon Crédit Zuri</h1>
          <Link href="/dashboard" className="text-sm text-cacao/60 hover:text-cacao">
            ← Retour
          </Link>
        </div>

        {insufficient && (
          <div className="mb-5 rounded-xl2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Crédit insuffisant pour confirmer ce rendez-vous. Recharge ton
            portefeuille pour continuer à recevoir des clientes.
          </div>
        )}

        {/* Solde */}
        <div className="rounded-xl2 border border-sable bg-white p-6 text-center shadow-soft">
          <p className="text-sm text-cacao/60">Solde disponible</p>
          <p className="mt-1 font-display text-4xl text-cacao">
            {formatZuri(balance)}
          </p>
          {level === "empty" && (
            <p className="mt-3 rounded-xl2 bg-red-50 px-4 py-2 text-sm text-red-800">
              Ton crédit est épuisé. Ton profil est en pause (masqué de la
              recherche) jusqu&apos;à recharge.
            </p>
          )}
          {level === "low" && (
            <p className="mt-3 rounded-xl2 bg-rose/40 px-4 py-2 text-sm text-cacao">
              Il te reste moins de {formatZuri(ALERT_LOW)}. Pense à recharger
              pour rester visible.
            </p>
          )}
          {level === "high" && (
            <p className="mt-3 rounded-xl2 bg-or-clair/40 px-4 py-2 text-sm text-cacao">
              Il te reste moins de {formatZuri(ALERT_HIGH)} — encore quelques
              prestations avant épuisement.
            </p>
          )}
        </div>

        {/* Comment recharger */}
        <div className="mt-5 rounded-xl2 border border-sable bg-white p-5 text-sm text-cacao/80">
          <p className="font-medium text-cacao">Comment recharger ?</p>
          <p className="mt-1">
            Envoie le montant souhaité par Mobile Money à l&apos;équipe Zuri, puis
            préviens-nous : ton Crédit Zuri sera ajouté à ton portefeuille.
            <br />
            <span className="text-cacao/50">
              (Le rechargement automatique par Mobile Money arrive bientôt.)
            </span>
          </p>
        </div>

        {/* Historique */}
        <h2 className="mt-8 font-display text-xl">Historique</h2>
        {txs.length === 0 ? (
          <p className="mt-3 text-sm text-cacao/50">Aucun mouvement pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-sable rounded-xl2 border border-sable bg-white">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {TYPE_LABEL[t.type] ?? t.type}
                  </p>
                  <p className="text-xs text-cacao/50">
                    {t.reason ?? ""} ·{" "}
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
    </main>
  );
}
