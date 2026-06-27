import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

interface BookingRow {
  date_souhaitee: string;
  heure_souhaitee: string | null;
  status: string;
  cliente_id: string | null;
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function ymdUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export async function WeekAgenda({ providerId }: { providerId: string }) {
  const now = new Date();
  const todayStr = ymdUTC(now);
  const offset = (now.getUTCDay() + 6) % 7; // lundi = premier jour
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset)
  );
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(
      Date.UTC(
        monday.getUTCFullYear(),
        monday.getUTCMonth(),
        monday.getUTCDate() + i
      )
    );
    return { date: ymdUTC(d), num: d.getUTCDate(), label: DAY_LABELS[i] };
  });

  const admin = createAdminClient();
  const { data } = await admin
    .from("bookings")
    .select("date_souhaitee, heure_souhaitee, status, cliente_id")
    .eq("provider_id", providerId)
    .in("status", ["confirme", "en_cours", "en_attente"])
    .gte("date_souhaitee", days[0].date)
    .lte("date_souhaitee", days[6].date);
  const rows = (data as BookingRow[] | null) ?? [];

  const clienteIds = [
    ...new Set(rows.map((r) => r.cliente_id).filter(Boolean)),
  ] as string[];
  const names: Record<string, string> = {};
  if (clienteIds.length) {
    const { data: cs } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", clienteIds);
    for (const c of (cs as { id: string; full_name: string | null }[] | null) ??
      [])
      names[c.id] = (c.full_name || "Cliente").split(" ")[0];
  }

  const byDay: Record<
    string,
    { time: string | null; name: string; confirmed: boolean }[]
  > = {};
  for (const r of rows) {
    (byDay[r.date_souhaitee] ??= []).push({
      time: r.heure_souhaitee ? r.heure_souhaitee.slice(0, 5) : null,
      name: (r.cliente_id && names[r.cliente_id]) || "Cliente",
      confirmed: r.status === "confirme" || r.status === "en_cours",
    });
  }
  for (const k of Object.keys(byDay))
    byDay[k].sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));

  return (
    <div className="rounded-xl2 border border-sable bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg">Ma semaine</h2>
        <Link
          href="/dashboard/agenda"
          className="text-sm font-medium text-or hover:underline"
        >
          Agenda complet →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const entries = byDay[d.date] ?? [];
          const isToday = d.date === todayStr;
          return (
            <div
              key={d.date}
              className={`min-h-[92px] rounded-lg p-1 ${
                isToday
                  ? "bg-ivoire/60 ring-1 ring-or/40"
                  : "bg-ivoire/20"
              }`}
            >
              <div className="text-center text-[11px] font-medium text-cacao/60">
                {d.label}
              </div>
              <div
                className={`mb-1 text-center text-sm ${
                  isToday ? "font-bold text-or" : "text-cacao/70"
                }`}
              >
                {d.num}
              </div>
              <div className="space-y-0.5">
                {entries.slice(0, 3).map((e, j) => (
                  <div
                    key={j}
                    className={`truncate rounded px-1 py-0.5 text-[9px] leading-tight ${
                      e.confirmed
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                    title={`${e.time ?? ""} ${e.name}`}
                  >
                    {e.time ? `${e.time} ` : ""}
                    {e.name}
                  </div>
                ))}
                {entries.length > 3 && (
                  <div className="px-1 text-[9px] text-cacao/50">
                    +{entries.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-4 text-xs text-cacao/70">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Confirmé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> En attente
        </span>
      </div>
    </div>
  );
}
