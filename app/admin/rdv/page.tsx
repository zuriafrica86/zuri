import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminRdvTable, type ARow } from "@/components/admin-rdv-table";

interface BookingRow {
  id: string;
  status: string;
  date_souhaitee: string;
  heure_souhaitee: string | null;
  note: string | null;
  created_at: string;
  provider_id: string | null;
  cliente_id: string | null;
  service_id: string | null;
  providers: { business_name: string } | null;
}

const FILTERS = [
  { key: "", label: "Tous" },
  { key: "en_attente", label: "En attente" },
  { key: "confirme", label: "Confirmés" },
  { key: "en_cours", label: "En cours" },
  { key: "termine", label: "Terminés" },
  { key: "annule", label: "Annulés" },
  { key: "refuse", label: "Refusés" },
];

export default async function AdminRdvPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const admin = createAdminClient();

  let q = admin
    .from("bookings")
    .select(
      "id, status, date_souhaitee, heure_souhaitee, note, created_at, provider_id, cliente_id, service_id, providers(business_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (statut) q = q.eq("status", statut);
  const { data } = await q;
  const bookings = (data as BookingRow[] | null) ?? [];

  // Clientes (nom + téléphone)
  const clienteIds = [
    ...new Set(bookings.map((b) => b.cliente_id).filter(Boolean) as string[]),
  ];
  const cli: Record<string, { name: string; phone: string | null }> = {};
  if (clienteIds.length) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", clienteIds);
    for (const p of (profs as
      | { id: string; full_name: string | null; phone: string | null }[]
      | null) ?? [])
      cli[p.id] = { name: p.full_name || "Cliente", phone: p.phone };
  }

  // Services (nom + tarif + durée)
  const serviceIds = [
    ...new Set(bookings.map((b) => b.service_id).filter(Boolean) as string[]),
  ];
  const svc: Record<
    string,
    { name: string; price: string; duree: string | null }
  > = {};
  if (serviceIds.length) {
    const { data: ss } = await admin
      .from("services")
      .select("id, name, price_min, price_max, duree_estim")
      .in("id", serviceIds);
    const f = (n: number) => n.toLocaleString("fr-FR");
    for (const s of (ss as
      | {
          id: string;
          name: string;
          price_min: number;
          price_max: number | null;
          duree_estim: string | null;
        }[]
      | null) ?? []) {
      const price =
        s.price_max && s.price_max > s.price_min
          ? `${f(s.price_min)} – ${f(s.price_max)} FCFA`
          : `${f(s.price_min)} FCFA`;
      svc[s.id] = { name: s.name, price, duree: s.duree_estim };
    }
  }

  const rows: ARow[] = bookings.map((b) => ({
    id: b.id,
    status: b.status,
    date: b.date_souhaitee ? b.date_souhaitee.slice(0, 10) : "",
    heure: b.heure_souhaitee ? b.heure_souhaitee.slice(0, 5) : null,
    note: b.note,
    created_at: b.created_at,
    zuriste: b.providers?.business_name ?? "Zuriste",
    cliente: (b.cliente_id && cli[b.cliente_id]?.name) || "Cliente",
    clientePhone: (b.cliente_id && cli[b.cliente_id]?.phone) || null,
    serviceName: (b.service_id && svc[b.service_id]?.name) || null,
    price: (b.service_id && svc[b.service_id]?.price) || null,
    duree: (b.service_id && svc[b.service_id]?.duree) || null,
  }));

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl sm:text-3xl">Rendez-vous</h1>
      <p className="mt-1 text-sm text-cacao/60">
        {statut
          ? `${rows.length} rendez-vous · filtre actif`
          : `Toutes les demandes de la plateforme (${rows.length})`}
        . Clique une ligne pour voir le détail et agir.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (statut ?? "") === f.key;
          const href = f.key ? `/admin/rdv?statut=${f.key}` : "/admin/rdv";
          return (
            <Link
              key={f.key || "all"}
              href={href}
              className={
                active
                  ? "rounded-full bg-cacao px-4 py-1.5 text-sm font-medium text-ivoire"
                  : "rounded-full border border-sable px-4 py-1.5 text-sm text-cacao/70 transition duration-250 ease-soft hover:bg-rose/30 hover:text-cacao"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <AdminRdvTable rows={rows} />
      </div>
    </div>
  );
}
