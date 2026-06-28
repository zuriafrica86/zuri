import {
  Lock,
  User,
  Scissors,
  Images,
  CalendarDays,
  Search,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatZuri, creditLevel } from "@/lib/credit";
import { fetchModels } from "@/lib/models";
import { ModelCard } from "@/components/model-card";
import { PublicProfileLink } from "@/components/public-profile-link";
import { QrCodeCard } from "@/components/qr-code-card";
import { WeekAgenda } from "@/components/week-agenda";
import { ZuristeKpis } from "@/components/zuriste-kpis";
import type { LucideIcon } from "lucide-react";

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
  let providerName = "";
  if (role === "prestataire") {
    const { data: prov } = await supabase
      .from("providers")
      .select("id, credit_balance, status, slug, business_name")
      .eq("user_id", user.id)
      .maybeSingle();
    credit = prov?.credit_balance ?? 0;
    providerId = prov?.id ?? null;
    providerStatus = prov?.status ?? null;
    providerSlug = prov?.slug ?? null;
    providerName = prov?.business_name ?? "";
  }

  const models = role === "cliente" ? await fetchModels({ limit: 6 }) : [];

  const espace =
    role === "prestataire" ? "Zuriste" : role === "admin" ? "admin" : "cliente";

  return (
    <div className="animate-fade-in">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-or">
        Espace {espace}
      </p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">
        Bonjour {prenom}
      </h1>

      {/* ----------------------------- CLIENTE ----------------------------- */}
      {role === "cliente" && (
        <div className="mt-6 space-y-7">
          <p className="text-cacao/70">
            Trouve une Zuriste de confiance et suis tes demandes de RDV.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <ActionCard
              href="/recherche"
              Icon={Search}
              label="Trouver une Zuriste"
              desc="Explore les talents"
            />
            <ActionCard
              href="/modeles"
              Icon={Images}
              label="Bibliothèque"
              desc="Inspiration & modèles"
            />
            <ActionCard
              href="/dashboard/mes-rdv"
              Icon={CalendarDays}
              label="Mes rendez-vous"
              desc="Suis tes demandes"
            />
          </div>

          {models.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xl">Modèles à la une</h2>
                <Link
                  href="/modeles"
                  className="inline-flex items-center gap-1 text-sm font-medium text-cacao/60 transition hover:text-cacao"
                >
                  Voir tout <ArrowRight className="h-4 w-4" aria-hidden />
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

      {/* ---------------------------- PRESTATAIRE --------------------------- */}
      {role === "prestataire" && (
        <div className="mt-6 space-y-6">
          <p className="text-cacao/70">
            Gère ton profil public, tes prestations et tes réalisations.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionCard
              href="/dashboard/profil"
              Icon={User}
              label="Mon profil"
              desc="Ta vitrine publique"
            />
            <ActionCard
              href="/dashboard/services"
              Icon={Scissors}
              label="Mes services"
              desc="Prestations & tarifs"
            />
            <ActionCard
              href="/dashboard/portfolio"
              Icon={Images}
              label="Mon portfolio"
              desc="Tes réalisations"
            />
            <ActionCard
              href="/dashboard/rdv"
              Icon={CalendarDays}
              label="Demandes reçues"
              desc="Tes demandes de RDV"
            />
          </div>

          {providerId && providerStatus === "approved" && providerSlug ? (
            <div className="grid gap-4 md:grid-cols-2 md:items-start">
              <PublicProfileLink path={`/zuriste/${providerSlug}`} approved />
              <QrCodeCard slug={providerSlug} name={providerName} />
            </div>
          ) : providerId ? (
            <PublicProfileLink
              path={`/zuriste/${providerSlug ?? providerId}`}
              approved={providerStatus === "approved"}
            />
          ) : null}

          {providerId && <ZuristeKpis providerId={providerId} />}

          {credit !== null && (
            <Link
              href="/dashboard/credit"
              className="group flex items-center justify-between gap-4 rounded-4xl border border-sable bg-white p-5 shadow-soft transition duration-250 ease-soft hover:shadow-card"
            >
              <div>
                <p className="text-sm text-cacao/55">Mon Crédit Zuri</p>
                <p className="mt-0.5 font-display text-3xl text-cacao">
                  {formatZuri(credit)}
                </p>
                {creditLevel(credit) === "empty" && (
                  <p className="mt-1 text-xs font-medium text-red-700">
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
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-cacao/70 transition group-hover:text-cacao">
                Gérer <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          )}

          {providerId && <WeekAgenda providerId={providerId} />}
        </div>
      )}

      {/* ------------------------------ ADMIN ------------------------------ */}
      {role === "admin" && (
        <div className="mt-6 space-y-4">
          <p className="text-cacao/70">
            Valide les Zuristes, suis tes statistiques et gère les comptes.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl2 bg-cacao px-5 py-3 font-medium text-ivoire shadow-soft transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
          >
            Ouvrir l&apos;administration
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}

      {/* ---------------------------- PIED DE PAGE -------------------------- */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-sable bg-white p-5">
        <p className="text-sm text-cacao/60">
          Connectée en tant que{" "}
          <span className="font-medium text-cacao">{user.email}</span>.
        </p>
        <Link
          href="/dashboard/securite"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-cacao/70 transition hover:text-cacao"
        >
          <Lock className="h-4 w-4" aria-hidden /> Mot de passe
        </Link>
      </div>
    </div>
  );
}

function ActionCard({
  href,
  Icon,
  label,
  desc,
}: {
  href: string;
  Icon: LucideIcon;
  label: string;
  desc?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-xl2 border border-sable bg-white p-4 transition duration-250 ease-soft hover:-translate-y-0.5 hover:shadow-card"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl2 bg-rose/40 text-cacao">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-cacao">{label}</span>
        {desc && (
          <span className="block truncate text-sm text-cacao/55">{desc}</span>
        )}
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-cacao/30 transition group-hover:translate-x-0.5 group-hover:text-cacao/60"
        aria-hidden
      />
    </Link>
  );
}
