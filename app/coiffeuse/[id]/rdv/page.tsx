import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { RdvForm, type RdvService } from "@/components/rdv-form";

export default async function RdvPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id, business_name, profile_photo, ville, quartier")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (!provider) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: servicesData } = await supabase
    .from("services")
    .select("id, name, price_min, price_max")
    .eq("provider_id", id)
    .order("price_min");
  const services = (servicesData as RdvService[] | null) ?? [];

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-sable px-6 py-4">
        <Logo />
        <Link
          href={`/coiffeuse/${id}`}
          className="text-sm text-cacao/60 hover:text-cacao"
        >
          ← Retour au profil
        </Link>
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        <h1 className="font-display text-3xl">Demander un RDV</h1>
        <p className="mt-1 text-cacao/60">avec {provider.business_name}</p>

        {!user ? (
          <div className="mt-6 rounded-xl2 border border-sable bg-ivoire p-5">
            <p className="text-cacao/70">
              Connecte-toi pour envoyer ta demande de rendez-vous.
            </p>
            <Link
              href="/login"
              className="mt-3 inline-block rounded-xl2 bg-or px-4 py-2 font-medium text-cacao hover:bg-or-clair"
            >
              Se connecter →
            </Link>
            <p className="mt-2 text-sm text-cacao/50">
              Pas de compte ?{" "}
              <Link href="/signup" className="text-or underline">
                Créer un compte
              </Link>
            </p>
          </div>
        ) : (
          <RdvForm providerId={provider.id} services={services} />
        )}
      </div>
    </main>
  );
}
