import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateZuristeForm } from "@/components/create-zuriste-form";
import { ZuristesAdminTable, type ZRow } from "@/components/zuristes-admin-table";

const FILTERS = [
  { key: "", label: "Toutes" },
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Validées" },
  { key: "suspended", label: "Suspendues" },
  { key: "rejected", label: "Refusées" },
];

interface ProviderRow {
  id: string;
  business_name: string;
  prenom: string | null;
  nom: string | null;
  ville: string | null;
  quartier: string | null;
  lieu: string | null;
  dispo: string | null;
  bio: string | null;
  status: string;
  ambassadrice: boolean;
  verified: boolean;
  credit_balance: number;
  rating_avg: number | null;
  rating_count: number | null;
  created_at: string;
  user_id: string | null;
}

export default async function ZuristesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const admin = createAdminClient();

  let q = admin
    .from("providers")
    .select(
      "id, business_name, prenom, nom, ville, quartier, lieu, dispo, bio, status, ambassadrice, verified, credit_balance, rating_avg, rating_count, created_at, user_id"
    )
    .order("created_at", { ascending: false });
  if (statut) q = q.eq("status", statut);
  const { data } = await q;
  const provs = (data as ProviderRow[] | null) ?? [];

  // Email + téléphone depuis profiles (via user_id)
  const userIds = provs.map((p) => p.user_id).filter(Boolean) as string[];
  const contact: Record<string, { email: string | null; phone: string | null }> = {};
  if (userIds.length) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, email, phone")
      .in("id", userIds);
    for (const pr of (profs as { id: string; email: string | null; phone: string | null }[] | null) ?? [])
      contact[pr.id] = { email: pr.email, phone: pr.phone };
  }

  const rows: ZRow[] = provs.map((p) => ({
    id: p.id,
    business_name: p.business_name,
    prenom: p.prenom,
    nom: p.nom,
    email: (p.user_id && contact[p.user_id]?.email) || null,
    phone: (p.user_id && contact[p.user_id]?.phone) || null,
    ville: p.ville,
    quartier: p.quartier,
    lieu: p.lieu,
    dispo: p.dispo,
    bio: p.bio,
    status: p.status,
    ambassadrice: p.ambassadrice,
    verified: p.verified,
    credit_balance: p.credit_balance ?? 0,
    rating_avg: p.rating_avg,
    rating_count: p.rating_count,
    created_at: p.created_at,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl">Zuristes</h1>
        <p className="mt-1 text-sm text-cacao/60">
          Clique sur une ligne pour voir le détail et agir.
        </p>
      </div>

      <CreateZuristeForm />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (statut ?? "") === f.key;
          const href = f.key ? `/admin/zuristes?statut=${f.key}` : "/admin/zuristes";
          return (
            <Link
              key={f.key || "all"}
              href={href}
              className={
                active
                  ? "rounded-xl2 bg-cacao px-3 py-1.5 text-sm font-medium text-ivoire"
                  : "rounded-xl2 border border-sable px-3 py-1.5 text-sm text-cacao/70 hover:bg-rose/30"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <ZuristesAdminTable rows={rows} />
    </div>
  );
}
