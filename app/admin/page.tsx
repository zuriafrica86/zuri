import { UserPlus, CalendarDays, MessageCircle, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface Activity {
  ts: string;
  icon: LucideIcon;
  text: string;
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    { count: approvedCount },
    { count: pendingCount },
    { count: clientesCount },
    { count: contacts7j },
  ] = await Promise.all([
    supabase
      .from("providers")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("providers")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "cliente"),
    supabase
      .from("contact_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
  ]);

  // Activité récente (fusion de 3 flux)
  const [{ data: provs }, { data: books }, { data: contacts }] =
    await Promise.all([
      supabase
        .from("providers")
        .select("business_name, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("bookings")
        .select("status, created_at, providers(business_name)")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("contact_events")
        .select("created_at, providers(business_name)")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const activity: Activity[] = [];
  type ProvRow = { business_name: string; created_at: string };
  type BookRow = {
    status: string;
    created_at: string;
    providers: { business_name: string } | null;
  };
  type ContactRow = {
    created_at: string;
    providers: { business_name: string } | null;
  };

  for (const p of (provs as ProvRow[] | null) ?? [])
    activity.push({
      ts: p.created_at,
      icon: UserPlus,
      text: `Nouvelle Zuriste — ${p.business_name}`,
    });
  for (const b of (books as BookRow[] | null) ?? []) {
    const name = b.providers?.business_name ?? "Zuriste";
    const label =
      b.status === "confirme"
        ? "RDV confirmé"
        : b.status === "en_attente"
          ? "Demande de RDV"
          : b.status === "refuse"
            ? "RDV refusé"
            : "RDV mis à jour";
    activity.push({ ts: b.created_at, icon: CalendarDays, text: `${label} — ${name}` });
  }
  for (const c of (contacts as ContactRow[] | null) ?? [])
    activity.push({
      ts: c.created_at,
      icon: MessageCircle,
      text: `Contact WhatsApp — ${c.providers?.business_name ?? "Zuriste"}`,
    });

  activity.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  const recent = activity.slice(0, 8);

  return (
    <div>
      <h1 className="font-display text-2xl">Vue d&apos;ensemble</h1>
      <p className="mt-1 text-sm text-cacao/60">
        Ce qui se passe sur ZURI en ce moment
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Zuristes actives" value={approvedCount ?? 0} />
        <Stat label="En attente" value={pendingCount ?? 0} />
        <Stat label="Clientes" value={clientesCount ?? 0} />
        <Stat label="Contacts · 7 j" value={contacts7j ?? 0} />
      </div>

      <h2 className="mt-6 font-display text-xl">Activité récente</h2>
      {recent.length === 0 ? (
        <p className="mt-3 text-sm text-cacao/50">
          Rien à afficher pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-sable rounded-xl2 border border-sable bg-white">
          {recent.map((a, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <a.icon className="h-4 w-4 text-cacao/50" aria-hidden />
              <span className="flex-1 text-sm">{a.text}</span>
              <span className="shrink-0 text-xs text-cacao/40">
                {timeAgo(a.ts)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl2 border border-sable bg-white p-4 text-center">
      <p className="font-display text-2xl text-cacao">{value}</p>
      <p className="mt-1 text-xs text-cacao/60">{label}</p>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "hier";
  return `il y a ${d} j`;
}
