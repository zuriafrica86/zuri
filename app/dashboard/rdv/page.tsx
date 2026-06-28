import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
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
  confirme: { label: "Confirmé", cls: "bg-green-100 text-green-700" },
  en_cours: { label: "En cours", cls: "bg-amber-100 text-amber-800" },
  refuse: { label: "Refusé", cls: "bg-red-100 text-red-700" },
  annule: { label: "Annulé", cls: "bg-sable/60 text-cacao/60" },
  termine: { label: "Terminé", cls: "bg-sable/60 text-cacao/60" },
};

const primaryBtn =
  "rounded-xl2 bg-cacao px-4 py-2.5 text-sm font-medium text-ivoire transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]";
const secondaryBtn =
  "rounded-xl2 border border-sable px-4 py-2.5 text-sm font-medium text-cacao/70 transition hover:bg-rose/30";

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
    <div className="animate-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Demandes reçues</h1>
          <p className="mt-1 text-sm text-cacao/60">
            Confirme, refuse et suis tes rendez-vous.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-cacao/60 transition hover:bg-rose/30 hover:text-cacao"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Retour
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-sable bg-white px-6 py-12 text-center">
          <p className="font-medium text-cacao">Aucune demande pour l&apos;instant</p>
          <p className="mt-1 text-sm text-cacao/50">
            Les demandes de RDV de tes clientes apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {bookings.map((b) => {
            const s = STATUS[b.status] ?? STATUS.en_attente;
            return (
              <li
                key={b.id}
                className="rounded-xl2 border border-sable bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-cacao">
                      {b.services?.name ?? "Prestation non précisée"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-cacao/70">
                      <Calendar
                        className="h-4 w-4 shrink-0 text-cacao/40"
                        aria-hidden
                      />
                      <span className="capitalize">
                        {formatDate(b.date_souhaitee)}
                      </span>
                      {b.heure_souhaitee ? ` · ${b.heure_souhaitee}` : ""}
                    </p>
                    {b.note && (
                      <p className="mt-2 rounded-xl2 bg-rose/20 px-3 py-2 text-sm text-cacao/70">
                        « {b.note} »
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
                  >
                    {s.label}
                  </span>
                </div>

                {b.status === "en_attente" && (
                  <div className="mt-3 flex gap-2">
                    <form action={confirmBooking}>
                      <input type="hidden" name="booking_id" value={b.id} />
                      <button type="submit" className={primaryBtn}>
                        Confirmer
                      </button>
                    </form>
                    <form action={refuseBooking}>
                      <input type="hidden" name="booking_id" value={b.id} />
                      <button type="submit" className={secondaryBtn}>
                        Refuser
                      </button>
                    </form>
                  </div>
                )}

                {b.status === "confirme" && (
                  <form action={startPrestation} className="mt-3">
                    <input type="hidden" name="booking_id" value={b.id} />
                    <button type="submit" className={primaryBtn}>
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
                    {b.cliente_confirmed ? " Confirmée par la cliente." : ""}
                  </p>
                )}

                {b.status === "confirme" &&
                  canCancelByDelay(b.date_souhaitee, b.heure_souhaitee) && (
                    <CancelBooking bookingId={b.id} role="prestataire" />
                  )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
