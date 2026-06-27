import { Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatZuri, creditLevel } from "@/lib/credit";
import { fetchModels } from "@/lib/models";
import { ModelCard } from "@/components/model-card";
import { PublicProfileLink } from "@/components/public-profile-link";
import { WeekAgenda } from "@/components/week-agenda";
import { ZuristeKpis } from "@/components/zuriste-kpis";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Récupère le rôle depuis profiles (créé par le trigger à l'inscription).
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const prenom = profile?.full_name?.split(" ")[0] ?? "";
  const role = profile?.role ?? "cliente";

  let credit: number | null = null;
  let providerId: string | null = null;
  let providerStatus: string | null = null;
  let providerSlug: string | null = null;
  if (role === "prestataire") {
    const { data: prov } = await supabase
      .from("providers")
      .select("id, credit_balance, status, slug")
      .eq("user_id", user.id)
      .maybeSingle();
    credit = prov?.credit_balance ?? 0;
    providerId = prov?.id ?? null;
    providerStatus = prov?.status ?? null;
    providerSlug = prov?.slug ?? null;
  }

  const models = role === "cliente" ? await fetchModels({ limit: 6 }) : [];

  return (
    <>
        <p className="text-sm uppercase tracking-[0.15em] text-or">
          Espace {role === "prestataire" ? "Zuriste" : role === "admin" ? "admin" : "cliente"}
        </p>
        <h1 className="mt-2 font-display text-3xl">Bonjour {prenom}</h1>

        {role === "cliente" && (
          <div className="mt-4 space-y-5">
            <p className="text-cacao/70">
              Trouve une Zuriste de confiance et suis tes demandes de RDV.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/recherche"
                className="inline-block rounded-xl2 bg-or px-5 py-3 font-medium text-cacao shadow-soft transition hover:bg-or-clair"
              >
                Trouver une Zuriste →
              </Link>
              <Link
                href="/modeles"
                className="inline-block rounded-xl2 border border-sable px-5 py-3 font-medium text-cacao transition hover:bg-rose/30"
              >
                Bibliothèque de modèles →
              </Link>
              <Link
                href="/dashboard/mes-rdv"
                className="inline-block rounded-xl2 border border-sable px-5 py-3 font-medium text-cacao transition hover:bg-rose/30"
              >
                Mes demandes de RDV →
              </Link>
            </div>

            {models.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-xl">Modèles à la une</h2>
                  <Link
                    href="/modeles"
                    className="text-sm font-medium text-or hover:underline"
                  >
                    Voir tout →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {models.map((m) => (
                    <ModelCard key={m.id} m={m} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {role === "prestataire" && (
          <div className="mt-4 space-y-3">
            <p className="text-cacao/70">
              Gère ton profil public, tes prestations et tes réalisations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/profil"
                className="inline-block rounded-xl2 bg-or px-5 py-3 font-medium text-cacao shadow-soft transition hover:bg-or-clair"
              >
                Mon profil →
              </Link>
              <Link
                href="/dashboard/services"
                className="inline-block rounded-xl2 border border-sable px-5 py-3 font-medium text-cacao transition hover:bg-rose/30"
              >
                Mes services →
              </Link>
              <Link
                href="/dashboard/portfolio"
                className="inline-block rounded-xl2 border border-sable px-5 py-3 font-medium text-cacao transition hover:bg-rose/30"
              >
                Mon portfolio →
              </Link>
              <Link
                href="/dashboard/rdv"
                className="inline-block rounded-xl2 border border-sable px-5 py-3 font-medium text-cacao transition hover:bg-rose/30"
              >
                Demandes reçues →
              </Link>
            </div>

            {providerId && (
              <PublicProfileLink
                path={`/zuriste/${providerSlug ?? providerId}`}
                approved={providerStatus === "approved"}
              />
            )}

            {providerId && <ZuristeKpis providerId={providerId} />}

            {credit !== null && (
              <Link
                href="/dashboard/credit"
                className="flex items-center justify-between rounded-xl2 border border-sable bg-white p-5 shadow-soft transition hover:bg-rose/10"
              >
                <div>
                  <p className="text-sm text-cacao/60">Mon Crédit Zuri</p>
                  <p className="font-display text-2xl text-cacao">
                    {formatZuri(credit)}
                  </p>
                  {creditLevel(credit) === "empty" && (
                    <p className="mt-1 text-xs text-red-700">
                      Profil en pause — recharge pour réapparaître
                    </p>
                  )}
                  {(creditLevel(credit) === "low" ||
                    creditLevel(credit) === "high") && (
                    <p className="mt-1 text-xs text-cacao/50">
                      Pense à recharger bientôt
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-medium text-or">
                  Gérer →
                </span>
              </Link>
            )}

            {providerId && <WeekAgenda providerId={providerId} />}
          </div>
        )}
        {role === "admin" && (
          <div className="mt-4 space-y-3">
            <p className="text-cacao/70">
              Valide les Zuristes, suis tes statistiques et gère les comptes.
            </p>
            <Link
              href="/admin"
              className="inline-block rounded-xl2 bg-cacao px-5 py-3 font-medium text-ivoire shadow-soft transition hover:bg-cacao/90"
            >
              Ouvrir l&apos;administration →
            </Link>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between rounded-xl2 border border-sable bg-white p-5 shadow-soft">
          <p className="text-sm text-cacao/60">
            Connectée en tant que{" "}
            <span className="font-medium text-cacao">{user.email}</span>.
          </p>
          <Link
            href="/dashboard/securite"
            className="shrink-0 text-sm font-medium text-or hover:underline"
          >
            <Lock className="inline h-4 w-4 align-[-0.2em]" aria-hidden /> Mot de passe
          </Link>
        </div>
      </>
  );
}
