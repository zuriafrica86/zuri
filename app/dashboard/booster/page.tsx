import Link from "next/link";
import { ArrowLeft, Wallet, Target, Trophy, Package } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatZuri } from "@/lib/credit";
import { BOOST_LABEL, remainingLabel, type BoostType } from "@/lib/boost";
import { BoostCatalog, type Realisation } from "@/components/boost-catalog";

interface ActiveBoost {
  id: string;
  type: string;
  target_label: string | null;
  ends_at: string;
}

export default async function BoosterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "prestataire") redirect("/dashboard");

  const { data: prov } = await supabase
    .from("providers")
    .select("id, credit_balance")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prov) redirect("/dashboard/profil");

  const balance = prov.credit_balance ?? 0;
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: activeData } = await admin
    .from("boosts")
    .select("id, type, target_label, ends_at")
    .eq("provider_id", prov.id)
    .eq("status", "active")
    .gt("ends_at", nowIso)
    .order("ends_at", { ascending: true });
  const active = (activeData as ActiveBoost[] | null) ?? [];

  const { data: photos } = await admin
    .from("portfolio_photos")
    .select("id, image_url, caption")
    .eq("provider_id", prov.id)
    .order("created_at", { ascending: false })
    .limit(60);
  const realisations: Realisation[] = (
    (photos as { id: string; image_url: string; caption: string | null }[] | null) ??
    []
  ).map((p) => ({
    id: p.id,
    image: p.image_url,
    label: p.caption || "Réalisation",
  }));

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">
            Booster mon activité
          </h1>
          <p className="mt-1 text-sm text-cacao/60">
            Gagne en visibilité auprès des clientes — tu payes avec ton Crédit
            Zuri.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-cacao/60 transition hover:bg-rose/30 hover:text-cacao"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Retour
        </Link>
      </div>

      {/* Solde */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-4xl bg-cacao p-5 text-ivoire shadow-card">
        <div className="flex items-center gap-2 text-ivoire/80">
          <Wallet className="h-4 w-4" aria-hidden />
          <span className="text-sm">Crédit disponible</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-display text-2xl">{formatZuri(balance)}</span>
          <Link
            href="/dashboard/credit"
            className="rounded-xl2 border border-ivoire/30 px-3.5 py-1.5 text-sm font-medium text-ivoire transition hover:bg-ivoire/10"
          >
            Recharger
          </Link>
        </div>
      </div>

      {/* Boosts en cours */}
      {active.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-xl">Mes mises en avant en cours</h2>
          <ul className="space-y-2">
            {active.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl2 border border-sable bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-cacao">
                    {BOOST_LABEL[b.type as BoostType] ?? b.type}
                  </p>
                  {b.target_label && (
                    <p className="text-xs text-cacao/55">{b.target_label}</p>
                  )}
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                  {remainingLabel(b.ends_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Catalogue */}
      <h2 className="mb-3 mt-7 flex items-center gap-2 font-display text-xl">
        🚀 Booster ma visibilité
      </h2>
      <BoostCatalog balance={balance} realisations={realisations} />

      {/* Bientôt */}
      <h2 className="mb-3 mt-8 font-display text-xl">Bientôt</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <SoonCard
          Icon={Target}
          title="Booster un service"
          desc="Cible une prestation précise (ex. Knotless, pose de gel)."
        />
        <SoonCard
          Icon={Trophy}
          title="Top de la catégorie"
          desc="En tête d'une catégorie (ex. Fulani Braids) sur une période."
        />
        <SoonCard
          Icon={Package}
          title="Packs Visibilité"
          desc="Starter & Business : plusieurs avantages réunis, au meilleur prix."
        />
      </div>
      <p className="mt-4 text-xs text-cacao/45">
        Coup de projecteur « Talents de la semaine » et badge « À découvrir »
        arrivent aussi prochainement.
      </p>
    </div>
  );
}

function SoonCard({
  Icon,
  title,
  desc,
}: {
  Icon: typeof Target;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-sable bg-white/60 p-4">
      <div className="flex items-center gap-2 text-cacao/70">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-sm font-medium">{title}</span>
        <span className="ml-auto rounded-full bg-sable/60 px-2 py-0.5 text-[10px] font-medium text-cacao/60">
          Bientôt
        </span>
      </div>
      <p className="mt-1.5 text-xs text-cacao/55">{desc}</p>
    </div>
  );
}
