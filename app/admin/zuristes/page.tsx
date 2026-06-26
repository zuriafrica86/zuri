import { Sparkles, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateZuristeForm } from "@/components/create-zuriste-form";
import {
  approveProvider,
  rejectProvider,
  suspendProvider,
  toggleAmbassadrice,
  toggleVerified,
  creditWallet,
} from "@/app/admin/actions";
import { formatZuri } from "@/lib/credit";

interface Row {
  id: string;
  business_name: string;
  ville: string | null;
  quartier: string | null;
  status: string;
  ambassadrice: boolean;
  verified: boolean;
  credit_balance: number;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-rose/50 text-cacao" },
  approved: { label: "Validée", cls: "bg-green-100 text-green-800" },
  suspended: { label: "Suspendue", cls: "bg-amber-100 text-amber-800" },
  rejected: { label: "Refusée", cls: "bg-red-100 text-red-800" },
};

const FILTERS = [
  { key: "", label: "Toutes" },
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Validées" },
  { key: "suspended", label: "Suspendues" },
  { key: "rejected", label: "Refusées" },
];

export default async function ZuristesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const supabase = await createClient();

  let q = supabase
    .from("providers")
    .select("id, business_name, ville, quartier, status, ambassadrice, verified, credit_balance")
    .order("created_at", { ascending: false });
  if (statut) q = q.eq("status", statut);
  const { data } = await q;
  const rows = (data as Row[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Zuristes</h1>
        <p className="mt-1 text-sm text-cacao/60">
          Valide, suspends, et gère tes Zuristes.
        </p>
      </div>

      <CreateZuristeForm />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (statut ?? "") === f.key;
          const href = f.key
            ? `/admin/zuristes?statut=${f.key}`
            : "/admin/zuristes";
          return (
            <Link
              key={f.key || "all"}
              href={href}
              className={
                active
                  ? "rounded-xl2 bg-cacao px-3 py-1.5 text-sm font-medium text-ivoire"
                  : "rounded-xl2 border border-sable px-3 py-1.5 text-sm text-cacao/70 hover:bg-rose/30"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-cacao/50">Aucune Zuriste dans ce filtre.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const s = STATUS[r.status] ?? STATUS.pending;
            return (
              <li
                key={r.id}
                className="rounded-xl2 border border-sable bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {r.business_name}
                      {r.ambassadrice && <Sparkles className="ml-2 inline h-4 w-4 align-[-0.2em] text-or" aria-hidden />}
                      {r.verified && <BadgeCheck className="ml-1 inline h-4 w-4 align-[-0.2em] text-or" aria-hidden />}
                    </p>
                    <p className="text-sm text-cacao/60">
                      {r.quartier ? `${r.quartier}, ` : ""}
                      {r.ville ?? "—"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${s.cls}`}
                  >
                    {s.label}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(r.status === "pending" ||
                    r.status === "rejected" ||
                    r.status === "suspended") && (
                    <Action
                      action={approveProvider}
                      id={r.id}
                      label={r.status === "pending" ? "Valider" : "Réactiver"}
                      primary
                    />
                  )}
                  {r.status === "pending" && (
                    <Action action={rejectProvider} id={r.id} label="Refuser" />
                  )}
                  {r.status === "approved" && (
                    <>
                      <Action
                        action={suspendProvider}
                        id={r.id}
                        label="Suspendre"
                      />
                      <Toggle
                        action={toggleAmbassadrice}
                        id={r.id}
                        next={!r.ambassadrice}
                        label={
                          r.ambassadrice
                            ? "Retirer Ambassadrice"
                            : "Nommer Ambassadrice"
                        }
                      />
                      <Toggle
                        action={toggleVerified}
                        id={r.id}
                        next={!r.verified}
                        label={
                          r.verified ? "Retirer Vérifiée" : "Marquer Vérifiée"
                        }
                      />
                    </>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sable pt-3">
                  <span className="text-sm text-cacao/70">
                    Crédit Zuri :{" "}
                    <span className="font-medium text-cacao">
                      {formatZuri(r.credit_balance ?? 0)}
                    </span>
                  </span>
                  <form
                    action={creditWallet}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="provider_id" value={r.id} />
                    <input
                      name="amount"
                      type="number"
                      inputMode="numeric"
                      placeholder="+ montant"
                      className="w-28 rounded-xl2 border border-sable bg-white px-3 py-1.5 text-sm"
                    />
                    <input
                      name="reason"
                      placeholder="Motif (ex. recharge)"
                      className="w-40 rounded-xl2 border border-sable bg-white px-3 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-xl2 bg-or px-3 py-1.5 text-sm font-medium text-cacao hover:bg-or-clair"
                    >
                      Créditer
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Action({
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
            ? "rounded-xl2 bg-or px-3 py-2 text-sm font-medium text-cacao hover:bg-or-clair"
            : "rounded-xl2 border border-sable px-3 py-2 text-sm text-cacao/70 hover:bg-rose/30"
        }
      >
        {label}
      </button>
    </form>
  );
}

function Toggle({
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
        className="rounded-xl2 border border-sable px-3 py-2 text-sm text-cacao/70 hover:bg-rose/30"
      >
        {label}
      </button>
    </form>
  );
}
