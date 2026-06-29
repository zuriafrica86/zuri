"use client";

import { useState } from "react";
import { X, Sparkles, BadgeCheck } from "lucide-react";
import { formatZuri } from "@/lib/credit";
import {
  approveProvider,
  rejectProvider,
  suspendProvider,
  reactivateProvider,
  toggleAmbassadrice,
  toggleVerified,
  creditWallet,
} from "@/app/admin/actions";

export interface ZRow {
  id: string;
  business_name: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  phone: string | null;
  ville: string | null;
  quartier: string | null;
  lieu: string | null;
  dispo: string | null;
  bio: string | null;
  status: string;
  ambassadrice: boolean;
  verified: boolean;
  credit_balance: number;
  rating_avg: number | null;
  rating_count: number | null;
  created_at: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-rose/50 text-cacao" },
  approved: { label: "Validée", cls: "bg-green-100 text-green-700" },
  suspended: { label: "Suspendue", cls: "bg-amber-100 text-amber-800" },
  rejected: { label: "Refusée", cls: "bg-red-100 text-red-700" },
};

const LIEU: Record<string, string> = {
  chez_zuriste: "Chez la Zuriste",
  chez_cliente: "Chez la cliente",
  les_deux: "Les deux",
};
const DISPO: Record<string, string> = {
  disponible: "Disponible",
  indisponible: "Indisponible",
  masque: "Masqué",
};

export function ZuristesAdminTable({ rows }: { rows: ZRow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const z = rows.find((r) => r.id === selectedId) || null;

  return (
    <>
      <div className="overflow-x-auto rounded-xl2 border border-sable bg-white shadow-soft">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-sable bg-rose/10 text-left text-xs font-medium text-cacao/50">
              <th className="px-4 py-2.5">Zuriste</th>
              <th className="px-4 py-2.5">Prénom</th>
              <th className="px-4 py-2.5">Nom</th>
              <th className="px-4 py-2.5">Ville</th>
              <th className="px-4 py-2.5">Statut</th>
              <th className="px-4 py-2.5 text-right">Crédit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = STATUS[r.status] ?? STATUS.pending;
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="cursor-pointer border-b border-sable/50 transition duration-250 ease-soft last:border-0 hover:bg-rose/20"
                >
                  <td className="px-4 py-3 font-medium text-cacao">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate">{r.business_name}</span>
                      {r.ambassadrice && (
                        <Sparkles
                          className="h-3.5 w-3.5 shrink-0 text-or"
                          aria-label="Ambassadrice"
                        />
                      )}
                      {r.verified && (
                        <BadgeCheck
                          className="h-3.5 w-3.5 shrink-0 text-or"
                          aria-label="Vérifiée"
                        />
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cacao/80">{r.prenom || "—"}</td>
                  <td className="px-4 py-3 text-cacao/80">{r.nom || "—"}</td>
                  <td className="px-4 py-3 text-cacao/80">{r.ville || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-cacao">
                    {formatZuri(r.credit_balance ?? 0)}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-cacao/50">
                  Aucune Zuriste dans ce filtre.
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
                <h2 className="flex items-center gap-1.5 font-display text-xl text-cacao">
                  <span className="truncate">{z.business_name}</span>
                  {z.ambassadrice && (
                    <Sparkles
                      className="h-4 w-4 shrink-0 text-or"
                      aria-label="Ambassadrice"
                    />
                  )}
                  {z.verified && (
                    <BadgeCheck
                      className="h-4 w-4 shrink-0 text-or"
                      aria-label="Vérifiée"
                    />
                  )}
                </h2>
                <span
                  className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    (STATUS[z.status] ?? STATUS.pending).cls
                  }`}
                >
                  {(STATUS[z.status] ?? STATUS.pending).label}
                </span>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-cacao/50 transition hover:bg-rose/30 hover:text-cacao"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {/* Crédit */}
              <div className="rounded-xl2 border border-sable bg-rose/20 p-4">
                <p className="text-xs text-cacao/60">Crédit Zuri</p>
                <p className="font-display text-2xl text-cacao">
                  {formatZuri(z.credit_balance ?? 0)}
                </p>
                <form
                  action={creditWallet}
                  className="mt-3 flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="provider_id" value={z.id} />
                  <input
                    name="amount"
                    type="number"
                    inputMode="numeric"
                    placeholder="+ / − montant"
                    className="w-28 rounded-xl2 border border-sable bg-white px-3 py-2 text-sm transition focus:border-or focus:shadow-focus focus:outline-none"
                  />
                  <input
                    name="reason"
                    placeholder="Motif"
                    className="w-32 rounded-xl2 border border-sable bg-white px-3 py-2 text-sm transition focus:border-or focus:shadow-focus focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl2 bg-cacao px-3.5 py-2 text-sm font-medium text-ivoire transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
                  >
                    Créditer
                  </button>
                </form>
              </div>

              {/* Infos */}
              <dl className="space-y-2 text-sm">
                <Info
                  label="Prénom / Nom"
                  value={`${z.prenom || "—"} ${z.nom || ""}`.trim()}
                />
                <Info label="Email" value={z.email || "—"} />
                <Info label="Téléphone" value={z.phone || "—"} />
                <Info
                  label="Ville / Quartier"
                  value={
                    [z.ville, z.quartier].filter(Boolean).join(" · ") || "—"
                  }
                />
                <Info
                  label="Lieu de prestation"
                  value={(z.lieu && LIEU[z.lieu]) || "—"}
                />
                <Info
                  label="Disponibilité"
                  value={(z.dispo && DISPO[z.dispo]) || "—"}
                />
                <Info
                  label="Note"
                  value={
                    z.rating_count && z.rating_count > 0
                      ? `${Number(z.rating_avg || 0).toFixed(1)} (${z.rating_count} avis)`
                      : "—"
                  }
                />
                <Info
                  label="Inscrite le"
                  value={new Date(z.created_at).toLocaleDateString("fr-FR")}
                />
                {z.bio && (
                  <div className="pt-1">
                    <dt className="text-xs text-cacao/50">Bio</dt>
                    <dd className="mt-0.5 text-cacao/80">{z.bio}</dd>
                  </div>
                )}
              </dl>

              {/* Actions */}
              <div className="border-t border-sable pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cacao/40">
                  Actions
                </p>
                <div className="flex flex-wrap gap-2">
                  {z.status === "pending" && (
                    <>
                      <Act
                        action={approveProvider}
                        id={z.id}
                        label="Valider"
                        primary
                      />
                      <Act action={rejectProvider} id={z.id} label="Refuser" />
                    </>
                  )}
                  {z.status === "approved" && (
                    <Act action={suspendProvider} id={z.id} label="Suspendre" />
                  )}
                  {(z.status === "suspended" || z.status === "rejected") && (
                    <Act
                      action={reactivateProvider}
                      id={z.id}
                      label="Réactiver"
                      primary
                    />
                  )}
                  <Tog
                    action={toggleAmbassadrice}
                    id={z.id}
                    next={!z.ambassadrice}
                    label={
                      z.ambassadrice
                        ? "Retirer Ambassadrice"
                        : "Nommer Ambassadrice"
                    }
                  />
                  <Tog
                    action={toggleVerified}
                    id={z.id}
                    next={!z.verified}
                    label={z.verified ? "Retirer Vérifiée" : "Marquer Vérifiée"}
                  />
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-cacao/50">{label}</dt>
      <dd className="text-right text-cacao/90">{value}</dd>
    </div>
  );
}

function Act({
  action,
  id,
  label,
  primary,
}: {
  action: (formData: FormData) => void;
  id: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="provider_id" value={id} />
      <button
        type="submit"
        className={
          primary
            ? "rounded-xl2 bg-cacao px-3.5 py-2 text-sm font-medium text-ivoire transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
            : "rounded-xl2 border border-sable px-3.5 py-2 text-sm text-cacao/70 transition hover:bg-rose/30"
        }
      >
        {label}
      </button>
    </form>
  );
}

function Tog({
  action,
  id,
  next,
  label,
}: {
  action: (formData: FormData) => void;
  id: string;
  next: boolean;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="provider_id" value={id} />
      <input type="hidden" name="next" value={next ? "true" : "false"} />
      <button
        type="submit"
        className="rounded-xl2 border border-sable px-3.5 py-2 text-sm text-cacao/70 transition hover:bg-rose/30"
      >
        {label}
      </button>
    </form>
  );
}
