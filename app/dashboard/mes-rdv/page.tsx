import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { contactWhatsApp } from "@/app/dashboard/contact-actions";

interface MyBooking {
  id: string;
  status: string;
  date_souhaitee: string;
  heure_souhaitee: string | null;
  provider_id: string;
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
      "id, status, date_souhaitee, heure_souhaitee, provider_id, providers(business_name, profile_photo)"
    )
    .eq("cliente_id", user.id)
    .order("created_at", { ascending: false });
  const bookings = (data as MyBooking[] | null) ?? [];

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-sable px-6 py-4">
        <Logo />
        <LogoutButton />
      </header>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl">Mes demandes de RDV</h1>
          <Link href="/recherche" className="text-sm text-cacao/60 hover:text-cacao">
            Trouver une Zuriste →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-sable bg-ivoire p-10 text-center text-cacao/50">
            Tu n&apos;as pas encore de demande.{" "}
            <Link href="/recherche" className="text-or underline">
              Trouve une Zuriste
            </Link>
            .
          </div>
        ) : (
          <ul className="space-y-3">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="rounded-xl2 border border-sable bg-ivoire p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {b.providers?.business_name ?? "Zuriste"}
                    </p>
                    <p className="text-sm text-cacao/70">
                      {formatDate(b.date_souhaitee)}
                      {b.heure_souhaitee ? ` · ${b.heure_souhaitee}` : ""}
                    </p>
                  </div>
                  <StatusTag status={b.status} />
                </div>

                {b.status === "confirme" && (
                  <form action={contactWhatsApp} className="mt-3">
                    <input
                      type="hidden"
                      name="provider_id"
                      value={b.provider_id}
                    />
                    <button
                      type="submit"
                      className="w-full rounded-xl2 bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                    >
                      📲 Contacter sur WhatsApp
                    </button>
                  </form>
                )}
                {b.status === "en_attente" && (
                  <p className="mt-2 text-sm text-cacao/50">
                    🔒 Contact disponible une fois la Zuriste l&apos;ayant
                    confirmé.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function StatusTag({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    en_attente: { label: "En attente", cls: "bg-rose/50 text-cacao" },
    confirme: { label: "Confirmé ✅", cls: "bg-green-100 text-green-800" },
    refuse: { label: "Refusée", cls: "bg-red-100 text-red-800" },
    annule: { label: "Annulée", cls: "bg-ivoire text-cacao/60" },
    termine: { label: "Terminée", cls: "bg-ivoire text-cacao/60" },
  };
  const s = map[status] ?? map.en_attente;
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${s.cls}`}>
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
