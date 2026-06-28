import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  confirmBooking,
  refuseBooking,
  startPrestation,
} from "@/app/dashboard/booking-actions";
import { FinishPrestation } from "@/components/finish-prestation";
import { CancelBooking } from "@/components/cancel-booking";
import { canCancelByDelay } from "@/lib/cancel-reasons";

interface BookingRow {
  id: string;
  status: string;
  date_souhaitee: string;
  heure_souhaitee: string | null;
  note: string | null;
  cliente_confirmed: boolean;
  services: { name: string } | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-rose/50 text-cacao" },
  confirme: { label: "Confirmé", cls: "bg-green-100 text-green-800" },
  en_cours: { label: "En cours", cls: "bg-amber-100 text-amber-800" },
  refuse: { label: "Refusé", cls: "bg-red-100 text-red-800" },
  annule: { label: "Annulé", cls: "bg-ivoire text-cacao/60" },
  termine: { label: "Terminé", cls: "bg-ivoire text-cacao/60" },
};

export default async function CoiffeuseRdvPage() {
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

  let bookings: BookingRow[] = [];
  if (provider) {
    const { data } = await supabase
      .from("bookings")
      .select(
        "id, status, date_souhaitee, heure_souhaitee, note, cliente_confirmed, services(name)"
      )
      .eq("provider_id", provider.id)
      .order("created_at", { ascending: false });
    bookings = (data as BookingRow[] | null) ?? [];
  }

  return (
    <>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl">Demandes de RDV</h1>
          <Link href="/dashboard" className="text-sm text-cacao/60 hover:text-cacao">
            ← Retour
          </Link>
        </div>

        {bookings.length === 0 ? (
          <p className="text-sm text-cacao/50">
            Aucune demande pour l&apos;instant.
          </p>
        ) : (
          <ul className="space-y-3">
            {bookings.map((b) => {
              const s = STATUS[b.status] ?? STATUS.en_attente;
              return (
                <li
                  key={b.id}
                  className="rounded-xl2 border border-sable bg-white p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {b.services?.name ?? "Prestation non précisée"}
                      </p>
                      <p className="text-sm text-cacao/70">
                        {formatDate(b.date_souhaitee)}
                        {b.heure_souhaitee ? ` · ${b.heure_souhaitee}` : ""}
                      </p>
                      {b.note && (
                        <p className="mt-1 text-sm text-cacao/60">
                          « {b.note} »
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {b.status === "en_attente" && (
                    <div className="mt-3 flex gap-2">
                      <form action={confirmBooking}>
                        <input type="hidden" name="booking_id" value={b.id} />
                        <button
                          type="submit"
                          className="rounded-xl2 bg-or px-4 py-2 text-sm font-medium text-cacao hover:bg-or-clair"
                        >
                          Confirmer
                        </button>
                      </form>
                      <form action={refuseBooking}>
                        <input type="hidden" name="booking_id" value={b.id} />
                        <button
                          type="submit"
                          className="rounded-xl2 border border-sable px-4 py-2 text-sm font-medium text-cacao/70 hover:bg-rose/30"
                        >
                          Refuser
                        </button>
                      </form>
                    </div>
                  )}

                  {b.status === "confirme" && (
                    <form action={startPrestation} className="mt-3">
                      <input type="hidden" name="booking_id" value={b.id} />
                      <button
                        type="submit"
                        className="rounded-xl2 bg-or px-4 py-2 text-sm font-medium text-cacao hover:bg-or-clair"
                      >
                        Commencer la prestation
                      </button>
                    </form>
                  )}

                  {b.status === "en_cours" && (
                    <FinishPrestation bookingId={b.id} userId={user.id} />
                  )}

                  {b.status === "termine" && (
                    <p className="mt-3 text-sm text-cacao/50">
                      Prestation terminée.
                      {b.cliente_confirmed
                        ? " Confirmée par la cliente."
                        : ""}
                    </p>
                  )}

                  {b.status === "confirme" &&
                    canCancelByDelay(
                      b.date_souhaitee,
                      b.heure_souhaitee
                    ) && (
                      <CancelBooking bookingId={b.id} role="prestataire" />
                    )}
                </li>
              );
            })}
          </ul>
        )}
      </>
  );
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return d;
  }
}
