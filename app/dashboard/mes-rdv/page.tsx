import { Phone, Lock, Check, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contactWhatsApp } from "@/app/dashboard/contact-actions";
import { ConfirmPrestation } from "@/components/confirm-prestation";
import { CancelBooking } from "@/components/cancel-booking";
import { isCancellable } from "@/lib/cancel-reasons";

interface MyBooking {
  id: string;
  status: string;
  date_souhaitee: string;
  heure_souhaitee: string | null;
  provider_id: string;
  cliente_confirmed: boolean;
  providers: { business_name: string; profile_photo: string | null } | null;
}

export default async function MesRdvPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, status, date_souhaitee, heure_souhaitee, provider_id, cliente_confirmed, providers(business_name, profile_photo)"
    )
    .eq("cliente_id", user.id)
    .order("created_at", { ascending: false });
  const bookings = (data as MyBooking[] | null) ?? [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Mes rendez-vous</h1>
          <p className="mt-1 text-sm text-cacao/60">
            Suis tes demandes et contacte ta Zuriste une fois confirmée.
          </p>
        </div>
        <Link
          href="/recherche"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-cacao/60 transition hover:bg-rose/30 hover:text-cacao"
        >
          Trouver une Zuriste <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-sable bg-white px-6 py-12 text-center">
          <p className="font-medium text-cacao">Aucune demande pour l&apos;instant</p>
          <p className="mt-1 text-sm text-cacao/50">
            <Link
              href="/recherche"
              className="font-medium text-cacao underline underline-offset-2"
            >
              Trouve une Zuriste
            </Link>{" "}
            et réserve ton premier rendez-vous.
          </p>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="rounded-xl2 border border-sable bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl2 bg-rose/40">
                    {b.providers?.profile_photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.providers.profile_photo}
                        alt={b.providers.business_name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-cacao">
                      {b.providers?.business_name ?? "Zuriste"}
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
                  </div>
                </div>
                <StatusTag status={b.status} />
              </div>

              {b.status === "confirme" && (
                <form action={contactWhatsApp} className="mt-3">
                  <input type="hidden" name="provider_id" value={b.provider_id} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-[#25D366] px-4 py-3 text-sm font-medium text-white transition duration-250 ease-soft hover:opacity-90 active:scale-[0.99]"
                  >
                    <Phone className="h-4 w-4" aria-hidden /> Contacter sur
                    WhatsApp
                  </button>
                </form>
              )}
              {b.status === "en_attente" && (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-cacao/50">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Le contact sera disponible une fois la Zuriste l&apos;ayant
                  confirmé.
                </p>
              )}
              {b.status === "termine" && !b.cliente_confirmed && (
                <ConfirmPrestation bookingId={b.id} />
              )}
              {b.status === "termine" && b.cliente_confirmed && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-green-700">
                  <Check className="h-4 w-4" aria-hidden /> Prestation confirmée.
                </p>
              )}

              {isCancellable(b.status, b.date_souhaitee, b.heure_souhaitee) && (
                <CancelBooking bookingId={b.id} role="cliente" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    en_attente: { label: "En attente", cls: "bg-rose/50 text-cacao" },
    confirme: { label: "Confirmé", cls: "bg-green-100 text-green-700" },
    en_cours: { label: "En cours", cls: "bg-amber-100 text-amber-800" },
    refuse: { label: "Refusée", cls: "bg-red-100 text-red-700" },
    annule: { label: "Annulée", cls: "bg-sable/60 text-cacao/60" },
    termine: { label: "Terminée", cls: "bg-sable/60 text-cacao/60" },
  };
  const s = map[status] ?? map.en_attente;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
    >
      {s.label}
    </span>
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
