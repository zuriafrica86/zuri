import { createClient } from "@/lib/supabase/server";

interface Booking {
  id: string;
  status: string;
  date_souhaitee: string;
  heure_souhaitee: string | null;
  created_at: string;
  cliente_id: string | null;
  providers: { business_name: string } | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-rose/50 text-cacao" },
  confirme: { label: "Confirmé", cls: "bg-green-100 text-green-800" },
  refuse: { label: "Refusé", cls: "bg-red-100 text-red-800" },
  annule: { label: "Annulé", cls: "bg-ivoire text-cacao/60" },
  termine: { label: "Terminé", cls: "bg-ivoire text-cacao/60" },
};

export default async function AdminRdvPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, status, date_souhaitee, heure_souhaitee, created_at, cliente_id, providers(business_name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  const bookings = (data as Booking[] | null) ?? [];

  const clienteIds = [
    ...new Set(bookings.map((b) => b.cliente_id).filter(Boolean) as string[]),
  ];
  let names: Record<string, string> = {};
  if (clienteIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", clienteIds);
    names = Object.fromEntries(
      ((profs as { id: string; full_name: string }[] | null) ?? []).map((p) => [
        p.id,
        p.full_name,
      ])
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Rendez-vous</h1>
      <p className="mt-1 text-sm text-cacao/60">
        Toutes les demandes de la plateforme ({bookings.length})
      </p>

      {bookings.length === 0 ? (
        <p className="mt-6 text-sm text-cacao/50">Aucun rendez-vous.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {bookings.map((b) => {
            const s = STATUS[b.status] ?? STATUS.en_attente;
            return (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl2 border border-sable bg-white p-4"
              >
                <div>
                  <p className="font-medium">
                    {b.providers?.business_name ?? "Zuriste"}
                  </p>
                  <p className="text-sm text-cacao/60">
                    {b.cliente_id ? names[b.cliente_id] ?? "Cliente" : "Cliente"}{" "}
                    · {fmt(b.date_souhaitee)}
                    {b.heure_souhaitee ? ` ${b.heure_souhaitee}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${s.cls}`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function fmt(d: string): string {
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return d;
  }
}
