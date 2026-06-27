import {
  UserPlus,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  KpiCard,
  BarList,
  TrendBars,
  fcfa,
  fcfaShort,
} from "@/components/admin-charts";

interface Activity {
  ts: string;
  icon: LucideIcon;
  text: string;
}

const ACTIVE_STATUSES = ["confirme", "en_cours", "termine"];

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  // ---- Données brutes (service-role : page déjà protégée par le layout admin) ----
  const [
    { data: providersData },
    { data: bookingsData },
    { data: servicesData },
    { data: walletData },
    { count: clientesCount },
  ] = await Promise.all([
    admin.from("providers").select("id, business_name, status, created_at"),
    admin
      .from("bookings")
      .select("provider_id, cliente_id, service_id, status, created_at"),
    admin.from("services").select("id, price_min, univers"),
    admin.from("wallet_transactions").select("amount, type"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "cliente"),
  ]);

  const providers =
    (providersData as {
      id: string;
      business_name: string;
      status: string;
      created_at: string;
    }[] | null) ?? [];
  const bookings =
    (bookingsData as {
      provider_id: string | null;
      cliente_id: string | null;
      service_id: string | null;
      status: string;
      created_at: string;
    }[] | null) ?? [];
  const services =
    (servicesData as {
      id: string;
      price_min: number;
      univers: string | null;
    }[] | null) ?? [];
  const wallet =
    (walletData as { amount: number; type: string }[] | null) ?? [];

  // ---- Index ----
  const provName: Record<string, string> = {};
  for (const p of providers) provName[p.id] = p.business_name;
  const price: Record<string, number> = {};
  const univ: Record<string, string> = {};
  for (const s of services) {
    price[s.id] = s.price_min;
    univ[s.id] = s.univers || "Autre";
  }

  // ---- Agrégats ----
  const statusCount: Record<string, number> = {};
  const revenueByProvider: Record<string, number> = {};
  const countByProvider: Record<string, number> = {};
  const countByUnivers: Record<string, number> = {};

  const months: { key: string; label: string }[] = [];
  const base = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    months.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d),
    });
  }
  const bookingsByMonth: Record<string, number> = {};
  const gmvByMonth: Record<string, number> = {};
  for (const m of months) {
    bookingsByMonth[m.key] = 0;
    gmvByMonth[m.key] = 0;
  }

  let gmv = 0;
  let rdvDone = 0;
  for (const b of bookings) {
    statusCount[b.status] = (statusCount[b.status] || 0) + 1;
    const mk = b.created_at.slice(0, 7);
    if (mk in bookingsByMonth) bookingsByMonth[mk] += 1;

    if (b.provider_id) {
      countByProvider[b.provider_id] = (countByProvider[b.provider_id] || 0) + 1;
      if (b.service_id && univ[b.service_id])
        countByUnivers[univ[b.service_id]] =
          (countByUnivers[univ[b.service_id]] || 0) + 1;
    }

    if (b.status === "termine") {
      rdvDone += 1;
      const p = (b.service_id && price[b.service_id]) || 0;
      gmv += p;
      if (b.provider_id)
        revenueByProvider[b.provider_id] =
          (revenueByProvider[b.provider_id] || 0) + p;
      if (mk in gmvByMonth) gmvByMonth[mk] += p;
    }
  }

  let commission = 0;
  let recharges = 0;
  for (const t of wallet) {
    if (t.type === "commission") commission += -t.amount; // débits négatifs
    if (t.type === "recharge") recharges += t.amount;
  }

  const approved = providers.filter((p) => p.status === "approved").length;
  const pending = providers.filter((p) => p.status === "pending").length;
  const totalBookings = bookings.length;
  const confirmedish =
    (statusCount["confirme"] || 0) +
    (statusCount["en_cours"] || 0) +
    (statusCount["termine"] || 0);
  const refused = statusCount["refuse"] || 0;
  const tauxConf =
    confirmedish + refused > 0
      ? Math.round((confirmedish / (confirmedish + refused)) * 100)
      : null;
  const panier = rdvDone > 0 ? Math.round(gmv / rdvDone) : 0;

  const topRevenue = Object.entries(revenueByProvider)
    .map(([id, v]) => ({ label: provName[id] ?? "Zuriste", value: v, display: fcfaShort(v) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const topRequested = Object.entries(countByProvider)
    .map(([id, v]) => ({ label: provName[id] ?? "Zuriste", value: v, display: String(v) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const byUnivers = Object.entries(countByUnivers)
    .map(([u, v]) => ({ label: u, value: v, display: String(v) }))
    .sort((a, b) => b.value - a.value);

  const trendBookings = months.map((m) => ({
    label: m.label,
    value: bookingsByMonth[m.key],
    display: String(bookingsByMonth[m.key]),
  }));
  const trendGmv = months.map((m) => ({
    label: m.label,
    value: gmvByMonth[m.key],
    display: fcfaShort(gmvByMonth[m.key]),
  }));

  // ---- Activité récente ----
  const activity: Activity[] = [];
  const recentProvs = [...providers]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);
  for (const p of recentProvs)
    activity.push({
      ts: p.created_at,
      icon: UserPlus,
      text: `Nouvelle Zuriste — ${p.business_name}`,
    });
  const recentBooks = [...bookings]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);
  for (const b of recentBooks) {
    const name = (b.provider_id && provName[b.provider_id]) || "Zuriste";
    const label =
      b.status === "confirme"
        ? "RDV confirmé"
        : b.status === "en_attente"
          ? "Demande de RDV"
          : b.status === "termine"
            ? "Prestation terminée"
            : b.status === "refuse"
              ? "RDV refusé"
              : "RDV mis à jour";
    activity.push({
      ts: b.created_at,
      icon: CalendarDays,
      text: `${label} — ${name}`,
    });
  }
  activity.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  const recent = activity.slice(0, 8);

  const STATUS_LABELS: Record<string, string> = {
    en_attente: "En attente",
    confirme: "Confirmés",
    en_cours: "En cours",
    termine: "Terminés",
    refuse: "Refusés",
    annule: "Annulés",
  };
  const statusItems = Object.keys(STATUS_LABELS)
    .map((k) => ({
      label: STATUS_LABELS[k],
      value: statusCount[k] || 0,
      display: String(statusCount[k] || 0),
    }))
    .filter((s) => s.value > 0);

  return (
    <div>
      <h1 className="font-display text-2xl">Vue d&apos;ensemble</h1>
      <p className="mt-1 text-sm text-cacao/60">
        Les chiffres et dynamiques clés de ZURI
      </p>

      {/* KPI principaux */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Volume d'affaires (GMV)" value={fcfa(gmv)} sub="prestations terminées" accent />
        <KpiCard label="Commissions encaissées" value={fcfa(commission)} sub="revenu plateforme" accent />
        <KpiCard label="Recharges crédit" value={fcfa(recharges)} sub="entrées de crédit" />
        <KpiCard label="Panier moyen" value={fcfa(panier)} sub="par prestation" />
        <KpiCard label="RDV effectués" value={String(rdvDone)} sub={`sur ${totalBookings} demandes`} />
        <KpiCard label="Taux de confirmation" value={tauxConf === null ? "—" : `${tauxConf} %`} sub="hors demandes en attente" />
        <KpiCard label="Zuristes actives" value={String(approved)} sub={pending > 0 ? `${pending} en attente` : "à jour"} />
        <KpiCard label="Clientes" value={String(clientesCount ?? 0)} sub="comptes inscrits" />
      </div>

      {/* Tendances */}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl2 border border-sable bg-white p-5">
          <h2 className="mb-4 font-display text-lg">Demandes de RDV par mois</h2>
          <TrendBars points={trendBookings} />
        </div>
        <div className="rounded-xl2 border border-sable bg-white p-5">
          <h2 className="mb-4 font-display text-lg">Volume d&apos;affaires par mois</h2>
          <TrendBars points={trendGmv} color="bg-cacao" />
        </div>
      </div>

      {/* Classements */}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl2 border border-sable bg-white p-5">
          <h2 className="mb-4 font-display text-lg">Qui vend le plus</h2>
          <BarList items={topRevenue} empty="Aucune prestation terminée pour l'instant." />
        </div>
        <div className="rounded-xl2 border border-sable bg-white p-5">
          <h2 className="mb-4 font-display text-lg">Les plus demandées</h2>
          <BarList items={topRequested} color="bg-or-clair" empty="Aucune demande pour l'instant." />
        </div>
      </div>

      {/* Univers + statuts */}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl2 border border-sable bg-white p-5">
          <h2 className="mb-4 font-display text-lg">Demandes par univers</h2>
          <BarList items={byUnivers} color="bg-or" />
        </div>
        <div className="rounded-xl2 border border-sable bg-white p-5">
          <h2 className="mb-4 font-display text-lg">Répartition des RDV</h2>
          <BarList items={statusItems} color="bg-cacao" empty="Aucun RDV pour l'instant." />
        </div>
      </div>

      {/* Activité récente */}
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
