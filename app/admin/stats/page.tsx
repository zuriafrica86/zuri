import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  KpiCard,
  BarList,
  TrendBars,
  fcfa,
  fcfaShort,
} from "@/components/admin-charts";

const ACTIVE = ["confirme", "en_cours", "termine"];

const TABS = [
  { key: "apercu", label: "Aperçu" },
  { key: "zuristes", label: "Zuristes" },
  { key: "univers", label: "Univers & services" },
  { key: "tendances", label: "Tendances" },
  { key: "clientes", label: "Clientes" },
];

type SortKey =
  | "revenu"
  | "demandes"
  | "effectues"
  | "note"
  | "credit"
  | "clientes";

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "apercu";
  const sort = (sp.sort as SortKey) || "revenu";

  const admin = createAdminClient();
  const [
    { data: providersData },
    { data: bookingsData },
    { data: servicesData },
    { data: walletData },
    { data: clientesData },
    { data: contactsData },
  ] = await Promise.all([
    admin
      .from("providers")
      .select(
        "id, business_name, status, created_at, ville, rating_avg, rating_count, credit_balance"
      ),
    admin
      .from("bookings")
      .select("provider_id, cliente_id, service_id, status, created_at"),
    admin.from("services").select("id, provider_id, name, price_min, univers"),
    admin.from("wallet_transactions").select("provider_id, amount, type, created_at"),
    admin.from("profiles").select("id, created_at").eq("role", "cliente"),
    admin.from("contact_events").select("provider_id, created_at"),
  ]);

  const providers =
    (providersData as {
      id: string;
      business_name: string;
      status: string;
      created_at: string;
      ville: string | null;
      rating_avg: number | null;
      rating_count: number | null;
      credit_balance: number | null;
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
      provider_id: string | null;
      name: string;
      price_min: number;
      univers: string | null;
    }[] | null) ?? [];
  const wallet =
    (walletData as {
      provider_id: string | null;
      amount: number;
      type: string;
      created_at: string;
    }[] | null) ?? [];
  const clientes =
    (clientesData as { id: string; created_at: string }[] | null) ?? [];
  const contacts =
    (contactsData as { provider_id: string | null; created_at: string }[] | null) ??
    [];

  // ---- Index services ----
  const price: Record<string, number> = {};
  const univOf: Record<string, string> = {};
  const svcName: Record<string, string> = {};
  for (const s of services) {
    price[s.id] = s.price_min;
    univOf[s.id] = s.univers || "Autre";
    svcName[s.id] = s.name;
  }

  // ---- Stats par Zuriste ----
  type P = {
    id: string;
    name: string;
    status: string;
    ville: string;
    demandes: number;
    effectues: number;
    confirmes: number;
    refuses: number;
    revenu: number;
    commissions: number;
    clientes: Set<string>;
    note: number;
    avis: number;
    credit: number;
  };
  const P: Record<string, P> = {};
  for (const p of providers)
    P[p.id] = {
      id: p.id,
      name: p.business_name,
      status: p.status,
      ville: p.ville || "—",
      demandes: 0,
      effectues: 0,
      confirmes: 0,
      refuses: 0,
      revenu: 0,
      commissions: 0,
      clientes: new Set(),
      note: Number(p.rating_avg || 0),
      avis: p.rating_count || 0,
      credit: p.credit_balance || 0,
    };

  // ---- Buckets mensuels (12 mois) ----
  const months: { key: string; label: string }[] = [];
  const base = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    months.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d),
    });
  }
  const mk = (iso: string) => iso.slice(0, 7);
  const zero = () => Object.fromEntries(months.map((m) => [m.key, 0]));
  const mDemandes = zero();
  const mEffectues = zero();
  const mGmv = zero();
  const mCommissions = zero();
  const mProviders = zero();
  const mClientes = zero();
  const mContacts = zero();

  // ---- Univers + services ----
  const uni: Record<string, { demandes: number; effectues: number; gmv: number }> =
    {};
  const svcAgg: Record<string, { count: number; gmv: number }> = {};

  let gmv = 0;
  let rdvDone = 0;
  const statusCount: Record<string, number> = {};
  const clientBookingCount: Record<string, number> = {};

  for (const b of bookings) {
    statusCount[b.status] = (statusCount[b.status] || 0) + 1;
    if (mk(b.created_at) in mDemandes) mDemandes[mk(b.created_at)] += 1;
    if (b.cliente_id)
      clientBookingCount[b.cliente_id] =
        (clientBookingCount[b.cliente_id] || 0) + 1;

    const u = b.service_id ? univOf[b.service_id] || "Autre" : "Autre";
    (uni[u] ??= { demandes: 0, effectues: 0, gmv: 0 }).demandes += 1;
    if (b.service_id)
      (svcAgg[b.service_id] ??= { count: 0, gmv: 0 }).count += 1;

    const pp = b.provider_id ? P[b.provider_id] : undefined;
    if (pp) {
      pp.demandes += 1;
      if (ACTIVE.includes(b.status) && b.cliente_id) pp.clientes.add(b.cliente_id);
      if (b.status === "refuse") pp.refuses += 1;
      if (ACTIVE.includes(b.status)) pp.confirmes += 1;
    }

    if (b.status === "termine") {
      rdvDone += 1;
      const v = (b.service_id && price[b.service_id]) || 0;
      gmv += v;
      if (mk(b.created_at) in mEffectues) mEffectues[mk(b.created_at)] += 1;
      if (mk(b.created_at) in mGmv) mGmv[mk(b.created_at)] += v;
      uni[u].effectues += 1;
      uni[u].gmv += v;
      if (b.service_id) svcAgg[b.service_id].gmv += v;
      if (pp) {
        pp.effectues += 1;
        pp.revenu += v;
      }
    }
  }

  // Wallet : commissions / recharges / bonus + par Zuriste + mensuel
  let commission = 0;
  let recharges = 0;
  let bonus = 0;
  let refunds = 0;
  for (const t of wallet) {
    if (t.type === "commission") {
      commission += -t.amount;
      if (t.provider_id && P[t.provider_id])
        P[t.provider_id].commissions += -t.amount;
      if (mk(t.created_at) in mCommissions) mCommissions[mk(t.created_at)] += -t.amount;
    }
    if (t.type === "recharge") recharges += t.amount;
    if (t.type === "bonus") bonus += t.amount;
    if (t.type === "refund") refunds += t.amount;
  }
  for (const p of providers)
    if (mk(p.created_at) in mProviders) mProviders[mk(p.created_at)] += 1;
  for (const c of clientes)
    if (mk(c.created_at) in mClientes) mClientes[mk(c.created_at)] += 1;
  for (const c of contacts)
    if (mk(c.created_at) in mContacts) mContacts[mk(c.created_at)] += 1;

  // ---- Totaux plateforme ----
  const approved = providers.filter((p) => p.status === "approved").length;
  const pending = providers.filter((p) => p.status === "pending").length;
  const suspended = providers.filter((p) => p.status === "suspended").length;
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
  const tauxCompletion =
    confirmedish > 0 ? Math.round((rdvDone / confirmedish) * 100) : null;
  const panier = rdvDone > 0 ? Math.round(gmv / rdvDone) : 0;
  const creditCirculation = providers.reduce(
    (s, p) => s + (p.credit_balance || 0),
    0
  );
  const avisTotal = providers.reduce((s, p) => s + (p.rating_count || 0), 0);
  const noteMoyenne =
    avisTotal > 0
      ? (
          providers.reduce(
            (s, p) => s + Number(p.rating_avg || 0) * (p.rating_count || 0),
            0
          ) / avisTotal
        ).toFixed(1)
      : "—";
  const clientesAvecRdv = new Set(
    bookings.map((b) => b.cliente_id).filter(Boolean)
  ).size;
  const clientesRecurrentes = Object.values(clientBookingCount).filter(
    (n) => n > 1
  ).length;
  const thisMonth = mk(new Date().toISOString());
  const newClientesMonth = mClientes[thisMonth] || 0;
  const zuristesSansRdv = providers.filter(
    (p) => (P[p.id]?.demandes || 0) === 0
  ).length;
  const revenuParActive = approved > 0 ? Math.round(gmv / approved) : 0;
  const contactsTotal = contacts.length;

  // ---- Listes ----
  const sorters: Record<SortKey, (a: P, b: P) => number> = {
    revenu: (a, b) => b.revenu - a.revenu,
    demandes: (a, b) => b.demandes - a.demandes,
    effectues: (a, b) => b.effectues - a.effectues,
    note: (a, b) => b.note - a.note,
    credit: (a, b) => b.credit - a.credit,
    clientes: (a, b) => b.clientes.size - a.clientes.size,
  };
  const zuristes = Object.values(P).sort(sorters[sort] || sorters.revenu);

  const universList = ["Coiffure", "Onglerie", "Regard", "Maquillage", "Autre"]
    .map((u) => ({ u, ...(uni[u] || { demandes: 0, effectues: 0, gmv: 0 }) }))
    .filter((r) => r.demandes > 0 || r.effectues > 0);

  const topServices = Object.entries(svcAgg)
    .map(([id, v]) => ({
      label: svcName[id] || "Prestation",
      value: v.count,
      display: `${v.count} · ${fcfaShort(v.gmv)}`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const villeAgg: Record<string, number> = {};
  for (const p of providers)
    if (p.status === "approved")
      villeAgg[p.ville || "—"] = (villeAgg[p.ville || "—"] || 0) + 1;
  const villeList = Object.entries(villeAgg)
    .map(([v, n]) => ({ label: v, value: n, display: String(n) }))
    .sort((a, b) => b.value - a.value);

  const topClientes = Object.entries(clientBookingCount)
    .map(([, n]) => n)
    .sort((a, b) => b - a);
  const clienteBuckets = {
    "1 RDV": topClientes.filter((n) => n === 1).length,
    "2 à 3": topClientes.filter((n) => n >= 2 && n <= 3).length,
    "4 et +": topClientes.filter((n) => n >= 4).length,
  };

  const trend = (data: Record<string, number>, money = false) =>
    months.map((m) => ({
      label: m.label,
      value: data[m.key],
      display: money ? fcfaShort(data[m.key]) : String(data[m.key]),
    }));

  return (
    <div>
      <h1 className="font-display text-2xl">Statistiques</h1>
      <p className="mt-1 text-sm text-cacao/60">
        Le détail complet de l&apos;activité de ZURI
      </p>

      {/* Onglets */}
      <div className="mt-5 flex flex-wrap gap-1 border-b border-sable">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/stats?tab=${t.key}`}
            className={`-mb-px rounded-t-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-b-2 border-or text-cacao"
                : "text-cacao/50 hover:text-cacao"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ================= APERÇU ================= */}
      {tab === "apercu" && (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Volume d'affaires (GMV)" value={fcfa(gmv)} sub="prestations terminées" accent />
          <KpiCard label="Commissions encaissées" value={fcfa(commission)} sub="revenu plateforme" accent />
          <KpiCard label="Recharges crédit" value={fcfa(recharges)} sub="entrées de crédit" />
          <KpiCard label="Bonus distribués" value={fcfa(bonus)} sub="à l'inscription" />
          <KpiCard label="Crédit en circulation" value={fcfa(creditCirculation)} sub="soldes Zuristes" />
          <KpiCard label="Panier moyen" value={fcfa(panier)} sub="par prestation" />
          <KpiCard label="Revenu moyen / Zuriste" value={fcfa(revenuParActive)} sub="par Zuriste active" />
          <KpiCard label="Remboursements" value={fcfa(refunds)} sub="ajustements" />
          <KpiCard label="RDV effectués" value={String(rdvDone)} sub={`sur ${totalBookings} demandes`} />
          <KpiCard label="Taux de confirmation" value={tauxConf === null ? "—" : `${tauxConf} %`} sub="hors en attente" />
          <KpiCard label="Taux de complétion" value={tauxCompletion === null ? "—" : `${tauxCompletion} %`} sub="confirmés → terminés" />
          <KpiCard label="Contacts WhatsApp" value={String(contactsTotal)} sub="numéros révélés" />
          <KpiCard label="Zuristes actives" value={String(approved)} sub={`${pending} en attente · ${suspended} susp.`} />
          <KpiCard label="Zuristes sans RDV" value={String(zuristesSansRdv)} sub="à activer" />
          <KpiCard label="Note moyenne" value={String(noteMoyenne)} sub={`${avisTotal} avis`} />
          <KpiCard label="Clientes" value={String(clientes.length)} sub={`${clientesAvecRdv} avec RDV`} />
        </div>
      )}

      {/* ================= ZURISTES ================= */}
      {tab === "zuristes" && (
        <div className="mt-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-cacao/50">Trier par :</span>
            {(
              [
                ["revenu", "Revenu"],
                ["demandes", "Demandes"],
                ["effectues", "Effectués"],
                ["clientes", "Clientes"],
                ["note", "Note"],
                ["credit", "Crédit"],
              ] as [SortKey, string][]
            ).map(([k, lbl]) => (
              <Link
                key={k}
                href={`/admin/stats?tab=zuristes&sort=${k}`}
                className={`rounded-full px-2.5 py-1 ${
                  sort === k
                    ? "bg-cacao text-ivoire"
                    : "bg-ivoire/60 text-cacao/70 hover:bg-rose/40"
                }`}
              >
                {lbl}
              </Link>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl2 border border-sable bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-sable text-left text-xs text-cacao/50">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Zuriste</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                  <th className="px-3 py-2 text-right font-medium">Demandes</th>
                  <th className="px-3 py-2 text-right font-medium">Effectués</th>
                  <th className="px-3 py-2 text-right font-medium">Conf.</th>
                  <th className="px-3 py-2 text-right font-medium">Clientes</th>
                  <th className="px-3 py-2 text-right font-medium">GMV</th>
                  <th className="px-3 py-2 text-right font-medium">Commissions</th>
                  <th className="px-3 py-2 text-right font-medium">Note</th>
                  <th className="px-3 py-2 text-right font-medium">Crédit</th>
                </tr>
              </thead>
              <tbody>
                {zuristes.map((z, i) => {
                  const conf =
                    z.confirmes + z.refuses > 0
                      ? Math.round((z.confirmes / (z.confirmes + z.refuses)) * 100) + " %"
                      : "—";
                  return (
                    <tr key={z.id} className="border-b border-sable/60 last:border-0">
                      <td className="px-3 py-2 text-cacao/40">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-cacao">{z.name}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={z.status} />
                      </td>
                      <td className="px-3 py-2 text-right">{z.demandes}</td>
                      <td className="px-3 py-2 text-right">{z.effectues}</td>
                      <td className="px-3 py-2 text-right">{conf}</td>
                      <td className="px-3 py-2 text-right">{z.clientes.size}</td>
                      <td className="px-3 py-2 text-right font-medium">{fcfaShort(z.revenu)}</td>
                      <td className="px-3 py-2 text-right">{fcfaShort(z.commissions)}</td>
                      <td className="px-3 py-2 text-right">
                        {z.avis > 0 ? `${z.note.toFixed(1)} (${z.avis})` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">{fcfaShort(z.credit)}</td>
                    </tr>
                  );
                })}
                {zuristes.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-3 py-6 text-center text-cacao/50">
                      Aucune Zuriste pour l&apos;instant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= UNIVERS & SERVICES ================= */}
      {tab === "univers" && (
        <div className="mt-5 space-y-4">
          <div className="overflow-x-auto rounded-xl2 border border-sable bg-white">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-sable text-left text-xs text-cacao/50">
                  <th className="px-3 py-2 font-medium">Univers</th>
                  <th className="px-3 py-2 text-right font-medium">Demandes</th>
                  <th className="px-3 py-2 text-right font-medium">Effectués</th>
                  <th className="px-3 py-2 text-right font-medium">GMV</th>
                  <th className="px-3 py-2 text-right font-medium">Panier moyen</th>
                </tr>
              </thead>
              <tbody>
                {universList.map((r) => (
                  <tr key={r.u} className="border-b border-sable/60 last:border-0">
                    <td className="px-3 py-2 font-medium text-cacao">{r.u}</td>
                    <td className="px-3 py-2 text-right">{r.demandes}</td>
                    <td className="px-3 py-2 text-right">{r.effectues}</td>
                    <td className="px-3 py-2 text-right font-medium">{fcfaShort(r.gmv)}</td>
                    <td className="px-3 py-2 text-right">
                      {r.effectues > 0 ? fcfaShort(Math.round(r.gmv / r.effectues)) : "—"}
                    </td>
                  </tr>
                ))}
                {universList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-cacao/50">
                      Aucune donnée pour l&apos;instant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl2 border border-sable bg-white p-5">
              <h2 className="mb-4 font-display text-lg">Top prestations (demandes · GMV)</h2>
              <BarList items={topServices} empty="Aucune prestation demandée." />
            </div>
            <div className="rounded-xl2 border border-sable bg-white p-5">
              <h2 className="mb-4 font-display text-lg">Zuristes actives par ville</h2>
              <BarList items={villeList} color="bg-or-clair" />
            </div>
          </div>
        </div>
      )}

      {/* ================= TENDANCES ================= */}
      {tab === "tendances" && (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <TrendCard title="Demandes de RDV / mois" points={trend(mDemandes)} />
          <TrendCard title="RDV effectués / mois" points={trend(mEffectues)} color="bg-cacao" />
          <TrendCard title="Volume d'affaires / mois" points={trend(mGmv, true)} color="bg-cacao" />
          <TrendCard title="Commissions / mois" points={trend(mCommissions, true)} />
          <TrendCard title="Nouvelles Zuristes / mois" points={trend(mProviders)} color="bg-or-clair" />
          <TrendCard title="Nouvelles clientes / mois" points={trend(mClientes)} color="bg-or-clair" />
          <TrendCard title="Contacts WhatsApp / mois" points={trend(mContacts)} color="bg-cacao" />
        </div>
      )}

      {/* ================= CLIENTES ================= */}
      {tab === "clientes" && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Clientes inscrites" value={String(clientes.length)} />
            <KpiCard label="Avec au moins 1 RDV" value={String(clientesAvecRdv)} sub={clientes.length > 0 ? `${Math.round((clientesAvecRdv / clientes.length) * 100)} % activées` : undefined} accent />
            <KpiCard label="Récurrentes (2 RDV+)" value={String(clientesRecurrentes)} sub="fidélité" />
            <KpiCard label="Nouvelles ce mois" value={String(newClientesMonth)} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl2 border border-sable bg-white p-5">
              <h2 className="mb-4 font-display text-lg">Fidélité des clientes</h2>
              <BarList
                items={Object.entries(clienteBuckets).map(([k, v]) => ({
                  label: k,
                  value: v,
                  display: String(v),
                }))}
                empty="Aucune cliente active."
              />
            </div>
            <div className="rounded-xl2 border border-sable bg-white p-5">
              <h2 className="mb-4 font-display text-lg">Contacts WhatsApp / mois</h2>
              <TrendBars points={trend(mContacts)} color="bg-cacao" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrendCard({
  title,
  points,
  color,
}: {
  title: string;
  points: { label: string; value: number; display: string }[];
  color?: string;
}) {
  return (
    <div className="rounded-xl2 border border-sable bg-white p-5">
      <h2 className="mb-4 font-display text-lg">{title}</h2>
      <TrendBars points={points} color={color} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: "Active", cls: "bg-green-100 text-green-800" },
    pending: { label: "En attente", cls: "bg-orange-100 text-orange-800" },
    suspended: { label: "Suspendue", cls: "bg-red-100 text-red-800" },
    rejected: { label: "Refusée", cls: "bg-cacao/10 text-cacao/60" },
  };
  const m = map[status] || { label: status, cls: "bg-ivoire text-cacao/60" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}
