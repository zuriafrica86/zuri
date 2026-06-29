"use client";

import { useState } from "react";
import { X, Calendar, Wallet, Tag, Scissors } from "lucide-react";
import { pauseBoost, resumeBoost, refundBoost } from "@/app/admin/actions";

export interface BRow {
  id: string;
  zuriste: string;
  type: string;
  typeLabel: string;
  targetLabel: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  cost: number;
}

type DStatus = "active" | "paused" | "ended" | "cancelled";

function displayStatus(
  status: string,
  endsAt: string
): { key: DStatus; label: string; cls: string } {
  if (status === "cancelled")
    return { key: "cancelled", label: "Annulé", cls: "bg-sable/60 text-cacao/60" };
  if (status === "paused")
    return { key: "paused", label: "En pause", cls: "bg-amber-100 text-amber-800" };
  if (new Date(endsAt).getTime() <= Date.now())
    return { key: "ended", label: "Terminé", cls: "bg-sable/60 text-cacao/60" };
  return { key: "active", label: "Actif", cls: "bg-green-100 text-green-700" };
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

function refundPreview(startsAt: string, endsAt: string, cost: number): number {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const total = Math.max(1, end - start);
  const remaining = Math.max(0, end - Date.now());
  return Math.round(cost * (remaining / total));
}

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "Tous" },
  { key: "active", label: "Actifs" },
  { key: "paused", label: "En pause" },
  { key: "ended", label: "Terminés" },
];

export function AdminBoostsTable({ rows }: { rows: BRow[] }) {
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const b = rows.find((r) => r.id === selectedId) || null;

  const visible = rows.filter((r) => {
    if (!filter) return true;
    const s = displayStatus(r.status, r.endsAt).key;
    if (filter === "ended") return s === "ended" || s === "cancelled";
    return s === filter;
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key || "all"}
              onClick={() => setFilter(f.key)}
              className={
                active
                  ? "rounded-full bg-cacao px-4 py-1.5 text-sm font-medium text-ivoire"
                  : "rounded-full border border-sable px-4 py-1.5 text-sm text-cacao/70 transition duration-250 ease-soft hover:bg-rose/30 hover:text-cacao"
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-sable bg-white shadow-soft">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-sable bg-rose/10 text-left text-xs font-medium text-cacao/50">
              <th className="px-4 py-2.5">Zuriste</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Cible</th>
              <th className="px-4 py-2.5">Période</th>
              <th className="px-4 py-2.5">Statut</th>
              <th className="px-4 py-2.5 text-right">Coût</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const s = displayStatus(r.status, r.endsAt);
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="cursor-pointer border-b border-sable/50 transition duration-250 ease-soft last:border-0 hover:bg-rose/20"
                >
                  <td className="px-4 py-3 font-medium text-cacao">
                    {r.zuriste}
                  </td>
                  <td className="px-4 py-3 text-cacao/80">{r.typeLabel}</td>
                  <td className="px-4 py-3 text-cacao/70">
                    {r.targetLabel ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-cacao/70">
                    {fmt(r.startsAt)} → {fmt(r.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-cacao">
                    {r.cost.toLocaleString("fr-FR")}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-cacao/50">
                  Aucune mise en avant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {b && (
        <>
          <div
            className="fixed inset-0 z-40 bg-cacao/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedId(null)}
            aria-hidden
          />
          <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white shadow-pop animate-fade-in md:rounded-l-4xl">
            <Drawer b={b} onClose={() => setSelectedId(null)} />
          </aside>
        </>
      )}
    </>
  );
}

function Drawer({ b, onClose }: { b: BRow; onClose: () => void }) {
  const s = displayStatus(b.status, b.endsAt);
  const refund = refundPreview(b.startsAt, b.endsAt, b.cost);
  const canModerate = s.key === "active" || s.key === "paused";

  return (
    <>
      <div className="sticky top-0 flex items-start justify-between border-b border-sable bg-white/95 px-5 py-4 backdrop-blur">
        <div className="min-w-0">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
          >
            {s.label}
          </span>
          <h2 className="mt-1.5 truncate font-display text-xl text-cacao">
            {b.typeLabel}
          </h2>
          <p className="truncate text-sm text-cacao/60">{b.zuriste}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="rounded-lg p-1.5 text-cacao/50 transition hover:bg-rose/30 hover:text-cacao"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="space-y-5 px-5 py-4">
        <dl className="space-y-2.5 text-sm">
          <Row icon={Scissors} label="Zuriste" value={b.zuriste} />
          <Row icon={Tag} label="Type" value={b.typeLabel} />
          {b.targetLabel && (
            <Row icon={Tag} label="Cible" value={b.targetLabel} />
          )}
          <Row icon={Calendar} label="Début" value={fmt(b.startsAt)} />
          <Row icon={Calendar} label="Fin" value={fmt(b.endsAt)} />
          <Row
            icon={Wallet}
            label="Coût payé"
            value={`${b.cost.toLocaleString("fr-FR")} Zuri`}
          />
        </dl>

        {canModerate ? (
          <div className="space-y-2 border-t border-sable pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-cacao/40">
              Actions
            </p>

            {s.key === "active" && (
              <form action={pauseBoost}>
                <input type="hidden" name="boost_id" value={b.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl2 border border-sable px-5 py-3 text-sm font-medium text-cacao/80 transition hover:bg-rose/30"
                >
                  Mettre en pause
                </button>
              </form>
            )}
            {s.key === "paused" && (
              <form action={resumeBoost}>
                <input type="hidden" name="boost_id" value={b.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl2 bg-cacao px-5 py-3 text-sm font-medium text-ivoire transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
                >
                  Reprendre
                </button>
              </form>
            )}

            <form action={refundBoost}>
              <input type="hidden" name="boost_id" value={b.id} />
              <button
                type="submit"
                onClick={(e) => {
                  if (
                    !confirm(
                      `Annuler cette mise en avant et rembourser ${refund.toLocaleString(
                        "fr-FR"
                      )} Zuri (temps restant) ?`
                    )
                  )
                    e.preventDefault();
                }}
                className="w-full rounded-xl2 border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
              >
                Annuler &amp; rembourser ({refund.toLocaleString("fr-FR")} Zuri)
              </button>
            </form>
            <p className="text-xs text-cacao/45">
              Le remboursement correspond au temps restant (prorata).
            </p>
          </div>
        ) : (
          <p className="border-t border-sable pt-4 text-sm text-cacao/50">
            Cette mise en avant est terminée — aucune action possible.
          </p>
        )}
      </div>
    </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex shrink-0 items-center gap-2 text-cacao/50">
        <Icon className="h-4 w-4 text-cacao/35" aria-hidden />
        {label}
      </dt>
      <dd className="truncate text-right font-medium text-cacao">{value}</dd>
    </div>
  );
}
