"use client";

import { useState } from "react";
import { X, Calendar, Scissors, User, Wallet, Clock } from "lucide-react";
import { adminUpdateBooking, adminCancelBooking } from "@/app/admin/actions";

export interface ARow {
  id: string;
  status: string;
  date: string;
  heure: string | null;
  note: string | null;
  created_at: string;
  zuriste: string;
  cliente: string;
  clientePhone: string | null;
  serviceName: string | null;
  price: string | null;
  duree: string | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-rose/50 text-cacao" },
  confirme: { label: "Confirmé", cls: "bg-green-100 text-green-700" },
  en_cours: { label: "En cours", cls: "bg-amber-100 text-amber-800" },
  termine: { label: "Terminé", cls: "bg-sable/60 text-cacao/60" },
  refuse: { label: "Refusé", cls: "bg-red-100 text-red-700" },
  annule: { label: "Annulé", cls: "bg-sable/60 text-cacao/60" },
};

const STATUS_OPTIONS: [string, string][] = [
  ["en_attente", "En attente"],
  ["confirme", "Confirmé"],
  ["en_cours", "En cours"],
  ["termine", "Terminé"],
  ["refuse", "Refusé"],
  ["annule", "Annulé"],
];

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return d;
  }
}

const fieldClass =
  "h-11 w-full rounded-xl2 border border-sable bg-white px-3.5 text-sm text-cacao transition focus:border-or focus:shadow-focus focus:outline-none";

export function AdminRdvTable({ rows }: { rows: ARow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const z = rows.find((r) => r.id === selectedId) || null;

  return (
    <>
      <div className="overflow-x-auto rounded-xl2 border border-sable bg-white shadow-soft">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-sable bg-rose/10 text-left text-xs font-medium text-cacao/50">
              <th className="px-4 py-2.5">Zuriste</th>
              <th className="px-4 py-2.5">Cliente</th>
              <th className="px-4 py-2.5">Service</th>
              <th className="px-4 py-2.5">Date &amp; heure</th>
              <th className="px-4 py-2.5">Statut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = STATUS[r.status] ?? STATUS.en_attente;
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="cursor-pointer border-b border-sable/50 transition duration-250 ease-soft last:border-0 hover:bg-rose/20"
                >
                  <td className="px-4 py-3 font-medium text-cacao">
                    {r.zuriste}
                  </td>
                  <td className="px-4 py-3 text-cacao/80">{r.cliente}</td>
                  <td className="px-4 py-3 text-cacao/80">
                    {r.serviceName ?? "—"}
                    {r.price ? (
                      <span className="text-cacao/45"> · {r.price}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-cacao/80">
                    <span className="capitalize">{fmtDate(r.date)}</span>
                    {r.heure ? ` · ${r.heure}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-cacao/50">
                  Aucun rendez-vous.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {z && (
        <>
          <div
            className="fixed inset-0 z-40 bg-cacao/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedId(null)}
            aria-hidden
          />
          <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white shadow-pop animate-fade-in md:rounded-l-4xl">
            <div className="sticky top-0 flex items-start justify-between border-b border-sable bg-white/95 px-5 py-4 backdrop-blur">
              <div className="min-w-0">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    (STATUS[z.status] ?? STATUS.en_attente).cls
                  }`}
                >
                  {(STATUS[z.status] ?? STATUS.en_attente).label}
                </span>
                <h2 className="mt-1.5 truncate font-display text-xl text-cacao">
                  {z.serviceName ?? "Rendez-vous"}
                </h2>
                <p className="truncate text-sm text-cacao/60">
                  {z.zuriste} · {z.cliente}
                </p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-cacao/50 transition hover:bg-rose/30 hover:text-cacao"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="space-y-5 px-5 py-4">
              {/* Détails */}
              <dl className="space-y-2.5 text-sm">
                <Row icon={Scissors} label="Zuriste" value={z.zuriste} />
                <Row icon={User} label="Cliente" value={z.cliente} />
                {z.clientePhone && (
                  <Row icon={User} label="Téléphone" value={z.clientePhone} />
                )}
                <Row
                  icon={Scissors}
                  label="Service"
                  value={z.serviceName ?? "—"}
                />
                <Row icon={Wallet} label="Tarif" value={z.price ?? "—"} />
                <Row icon={Clock} label="Durée" value={z.duree ?? "—"} />
                <Row
                  icon={Calendar}
                  label="Date"
                  value={fmtDate(z.date)}
                />
                <Row icon={Clock} label="Heure" value={z.heure ?? "—"} />
                <Row
                  icon={Calendar}
                  label="Demandé le"
                  value={new Date(z.created_at).toLocaleDateString("fr-FR")}
                />
                {z.note && (
                  <div className="pt-1">
                    <dt className="text-xs text-cacao/50">Note de la cliente</dt>
                    <dd className="mt-0.5 rounded-xl2 bg-rose/20 px-3 py-2 text-cacao/80">
                      « {z.note} »
                    </dd>
                  </div>
                )}
              </dl>

              {/* Modifier */}
              <form
                action={adminUpdateBooking}
                className="space-y-3 border-t border-sable pt-4"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-cacao/40">
                  Modifier le rendez-vous
                </p>
                <input type="hidden" name="booking_id" value={z.id} />
                <label className="block">
                  <span className="mb-1 block text-xs text-cacao/60">Statut</span>
                  <select
                    name="status"
                    defaultValue={z.status}
                    className={fieldClass}
                  >
                    {STATUS_OPTIONS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-cacao/60">Date</span>
                    <input
                      type="date"
                      name="date_souhaitee"
                      defaultValue={z.date}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-cacao/60">Heure</span>
                    <input
                      type="time"
                      name="heure_souhaitee"
                      defaultValue={z.heure ?? ""}
                      className={fieldClass}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl2 bg-cacao px-5 py-3 text-sm font-medium text-ivoire transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
                >
                  Enregistrer les modifications
                </button>
              </form>

              {/* Annuler */}
              {z.status !== "annule" && (
                <form
                  action={adminCancelBooking}
                  className="space-y-2 border-t border-sable pt-4"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-cacao/40">
                    Annuler
                  </p>
                  <input type="hidden" name="booking_id" value={z.id} />
                  <input
                    name="cancel_reason"
                    placeholder="Motif (optionnel)"
                    className={fieldClass}
                  />
                  <button
                    type="submit"
                    onClick={(e) => {
                      if (!confirm("Annuler ce rendez-vous ?"))
                        e.preventDefault();
                    }}
                    className="w-full rounded-xl2 border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  >
                    Annuler ce rendez-vous
                  </button>
                </form>
              )}
            </div>
          </aside>
        </>
      )}
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
