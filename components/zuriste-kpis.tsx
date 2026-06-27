import { createAdminClient } from "@/lib/supabase/admin";

function fcfa(n: number): string {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export async function ZuristeKpis({ providerId }: { providerId: string }) {
  const admin = createAdminClient();

  // RDV effectués (terminés) + revenu généré (somme des prix des prestations terminées)
  const { data: done } = await admin
    .from("bookings")
    .select("service_id")
    .eq("provider_id", providerId)
    .eq("status", "termine");
  const doneRows = (done as { service_id: string | null }[] | null) ?? [];
  const rdvDone = doneRows.length;

  let revenue = 0;
  const sids = [...new Set(doneRows.map((r) => r.service_id).filter(Boolean))] as string[];
  if (sids.length) {
    const { data: svcs } = await admin
      .from("services")
      .select("id, price_min")
      .in("id", sids);
    const price: Record<string, number> = {};
    for (const s of (svcs as { id: string; price_min: number }[] | null) ?? [])
      price[s.id] = s.price_min;
    for (const r of doneRows)
      revenue += (r.service_id && price[r.service_id]) || 0;
  }

  // Clientes distinctes (qui ont au moins un RDV confirmé / en cours / terminé)
  const { data: cli } = await admin
    .from("bookings")
    .select("cliente_id")
    .eq("provider_id", providerId)
    .in("status", ["confirme", "en_cours", "termine"]);
  const clientes = new Set(
    ((cli as { cliente_id: string | null }[] | null) ?? [])
      .map((r) => r.cliente_id)
      .filter(Boolean)
  ).size;

  const cards = [
    { label: "Revenu généré", value: fcfa(revenue), sub: "prestations terminées" },
    { label: "RDV effectués", value: String(rdvDone), sub: "depuis le début" },
    { label: "Mes clientes", value: String(clientes), sub: "depuis l'inscription" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl2 border border-sable bg-white p-4 text-center shadow-soft"
        >
          <p className="font-display text-xl text-cacao sm:text-2xl">
            {c.value}
          </p>
          <p className="mt-1 text-xs font-medium text-cacao/70">{c.label}</p>
          <p className="mt-0.5 text-[11px] text-cacao/40">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
