import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface BookingRow {
  id: string;
  date_souhaitee: string;
  heure_souhaitee: string | null;
  status: string;
  service_id: string | null;
  cliente_id: string | null;
}

type Entry = {
  time: string | null;
  name: string;
  service: string;
  confirmed: boolean; // true = vert (confirmé/en cours), false = orange (en attente)
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function monthShift(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function isValidMonth(ym: string): boolean {
  return /^\d{4}-\d{2}$/.test(ym);
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
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

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Mois affiché (par défaut : mois courant)
  const sp = await searchParams;
  const now = new Date();
  const current = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1
  ).padStart(2, "0")}`;
  const ym = sp.m && isValidMonth(sp.m) ? sp.m : current;
  const [year, month] = ym.split("-").map(Number);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const offset = (firstWeekday + 6) % 7; // grille qui commence le lundi
  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  // RDV du mois (confirmés + en cours + en attente)
  const byDay: Record<number, Entry[]> = {};
  if (provider) {
    const admin = createAdminClient();
    const firstDate = `${ym}-01`;
    const lastDate = `${ym}-${String(daysInMonth).padStart(2, "0")}`;
    const { data } = await admin
      .from("bookings")
      .select("id, date_souhaitee, heure_souhaitee, status, service_id, cliente_id")
      .eq("provider_id", provider.id)
      .in("status", ["confirme", "en_cours", "en_attente"])
      .gte("date_souhaitee", firstDate)
      .lte("date_souhaitee", lastDate);

    const rows = (data as BookingRow[] | null) ?? [];

    // Noms des clientes + services en lot
    const clienteIds = [...new Set(rows.map((r) => r.cliente_id).filter(Boolean))];
    const serviceIds = [...new Set(rows.map((r) => r.service_id).filter(Boolean))];
    const names: Record<string, string> = {};
    const services: Record<string, string> = {};
    if (clienteIds.length) {
      const { data: cs } = await admin
        .from("profiles")
        .select("id, prenom, full_name")
        .in("id", clienteIds as string[]);
      for (const c of (cs as { id: string; prenom: string | null; full_name: string | null }[] | null) ?? []) {
        names[c.id] = c.prenom || c.full_name || "Cliente";
      }
    }
    if (serviceIds.length) {
      const { data: ss } = await admin
        .from("services")
        .select("id, name")
        .in("id", serviceIds as string[]);
      for (const s of (ss as { id: string; name: string }[] | null) ?? []) {
        services[s.id] = s.name;
      }
    }

    for (const r of rows) {
      const day = parseInt(r.date_souhaitee.slice(8, 10), 10);
      (byDay[day] ??= []).push({
        time: r.heure_souhaitee ? r.heure_souhaitee.slice(0, 5) : null,
        name: (r.cliente_id && names[r.cliente_id]) || "Cliente",
        service: (r.service_id && services[r.service_id]) || "Prestation",
        confirmed: r.status === "confirme" || r.status === "en_cours",
      });
    }
    for (const d of Object.keys(byDay)) {
      byDay[+d].sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
    }
  }

  // Cellules de la grille (vides pour le décalage du 1er jour)
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayDay =
    ym === current ? now.getUTCDate() : -1;

  // Liste chronologique (lisible sur mobile)
  const daysWithRdv = Object.keys(byDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl capitalize sm:text-3xl">
            {monthLabel}
          </h1>
          <p className="mt-1 text-sm text-cacao/60">Tes rendez-vous du mois.</p>
        </div>
        <div className="flex gap-1.5">
          <Link
            href={`/dashboard/agenda?m=${monthShift(ym, -1)}`}
            aria-label="Mois précédent"
            className="rounded-xl2 border border-sable p-2 text-cacao/70 transition duration-250 ease-soft hover:bg-rose/30 hover:text-cacao"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
          <Link
            href={`/dashboard/agenda?m=${monthShift(ym, 1)}`}
            aria-label="Mois suivant"
            className="rounded-xl2 border border-sable p-2 text-cacao/70 transition duration-250 ease-soft hover:bg-rose/30 hover:text-cacao"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Légende */}
      <div className="mb-3 flex gap-4 text-xs text-cacao/70">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Confirmé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> En attente
        </span>
      </div>

      {/* Grille mensuelle */}
      <div className="overflow-hidden rounded-xl2 border border-sable bg-white shadow-soft">
        <div className="grid grid-cols-7 border-b border-sable bg-rose/15 text-center text-xs font-medium text-cacao/50">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const entries = d ? byDay[d] ?? [] : [];
            return (
              <div
                key={i}
                className={`min-h-[80px] border-b border-r border-sable/50 p-1 ${
                  d === null ? "bg-sable/10" : ""
                }`}
              >
                {d && (
                  <>
                    <div className="mb-0.5 flex justify-end">
                      {d === todayDay ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cacao text-[11px] font-semibold text-ivoire">
                          {d}
                        </span>
                      ) : (
                        <span className="px-0.5 text-xs text-cacao/45">{d}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {entries.slice(0, 3).map((e, j) => (
                        <div
                          key={j}
                          className={`truncate rounded-md px-1 py-0.5 text-[10px] leading-tight ${
                            e.confirmed
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                          title={`${e.time ?? ""} ${e.name} · ${e.service}`}
                        >
                          {e.time ? `${e.time} ` : ""}
                          {e.name}
                        </div>
                      ))}
                      {entries.length > 3 && (
                        <div className="px-1 text-[10px] text-cacao/50">
                          +{entries.length - 3}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Détail chronologique */}
      {daysWithRdv.length > 0 && (
        <div className="mt-6 space-y-4">
          {daysWithRdv.map((d) => {
            const label = new Intl.DateTimeFormat("fr-FR", {
              weekday: "long",
              day: "numeric",
            }).format(new Date(Date.UTC(year, month - 1, d)));
            return (
              <div key={d}>
                <p className="mb-1.5 text-sm font-medium capitalize text-cacao">
                  {label}
                </p>
                <ul className="space-y-1.5">
                  {byDay[d].map((e, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2.5 rounded-xl2 border border-sable bg-white px-3.5 py-2.5 text-sm"
                    >
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          e.confirmed ? "bg-green-500" : "bg-orange-500"
                        }`}
                      />
                      <span className="w-12 shrink-0 font-medium text-cacao">
                        {e.time ?? "—"}
                      </span>
                      <span className="flex-1 truncate text-cacao/80">
                        {e.name} · {e.service}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {daysWithRdv.length === 0 && (
        <div className="mt-6 rounded-4xl border border-dashed border-sable bg-white px-6 py-12 text-center">
          <p className="font-medium text-cacao">Aucun rendez-vous ce mois-ci</p>
          <p className="mt-1 text-sm text-cacao/50">
            Tes RDV confirmés et en attente s&apos;afficheront ici.
          </p>
        </div>
      )}
    </div>
  );
}
