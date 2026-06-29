import { createAdminClient } from "@/lib/supabase/admin";
import { BOOST_LABEL, type BoostType } from "@/lib/boost";
import { AdminBoostsTable, type BRow } from "@/components/admin-boosts-table";

interface Raw {
  id: string;
  type: string;
  target_label: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  cost: number;
  providers: { business_name: string } | null;
}

export default async function AdminBoostsPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("boosts")
    .select(
      "id, type, target_label, starts_at, ends_at, status, cost, providers(business_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows: BRow[] = ((data as Raw[] | null) ?? []).map((b) => ({
    id: b.id,
    zuriste: b.providers?.business_name ?? "Zuriste",
    type: b.type,
    typeLabel: BOOST_LABEL[b.type as BoostType] ?? b.type,
    targetLabel: b.target_label,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    status: b.status,
    cost: b.cost ?? 0,
  }));

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl sm:text-3xl">Mises en avant</h1>
      <p className="mt-1 text-sm text-cacao/60">
        Toutes les publicités achetées par les Zuristes ({rows.length}). Clique
        une ligne pour la mettre en pause ou la rembourser.
      </p>
      <div className="mt-6">
        <AdminBoostsTable rows={rows} />
      </div>
    </div>
  );
}
