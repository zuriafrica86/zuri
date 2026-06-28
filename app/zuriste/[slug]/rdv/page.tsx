import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { RdvCalendar, type RdvService } from "@/components/rdv-calendar";

export default async function RdvPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { slug } = await params;
  const { service: preselectedServiceId } = await searchParams;
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id, business_name, profile_photo, ville, quartier")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();
  if (!provider) notFound();
  const pid = provider.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: servicesData } = await supabase
    .from("services")
    .select("id, name, price_min, price_max")
    .eq("provider_id", pid)
    .order("price_min");
  const services = (servicesData as RdvService[] | null) ?? [];

  const { data: availData } = await supabase
    .from("availability")
    .select("day_of_week")
    .eq("provider_id", pid);
  const availableWeekdays = [
    ...new Set(
      ((availData as { day_of_week: number }[] | null) ?? []).map(
        (a) => a.day_of_week
      )
    ),
  ];

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sable/70 bg-white/85 px-5 py-3.5 backdrop-blur md:px-8">
        <Logo />
        <Link
          href={`/zuriste/${slug}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-cacao/60 transition hover:bg-rose/30 hover:text-cacao"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour au profil
        </Link>
      </header>

      <div className="mx-auto max-w-lg px-5 py-8 md:py-10">
        {/* Récap : chez qui on réserve */}
        <div className="flex items-center gap-3.5 animate-fade-in">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-rose/40">
            {provider.profile_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={provider.profile_photo}
                alt={provider.business_name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-cacao/50">Demander un RDV avec</p>
            <h1 className="truncate font-display text-2xl leading-tight">
              {provider.business_name}
            </h1>
            <p className="truncate text-sm text-cacao/60">
              {provider.quartier ? `${provider.quartier}, ` : ""}
              {provider.ville}
            </p>
          </div>
        </div>

        {!user ? (
          <div className="mt-7 rounded-4xl border border-sable bg-white p-6 text-center shadow-soft">
            <p className="text-cacao/70">
              Connecte-toi pour envoyer ta demande de rendez-vous.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl2 bg-cacao px-5 py-2.5 font-medium text-ivoire transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
            >
              Se connecter
            </Link>
            <p className="mt-3 text-sm text-cacao/50">
              Pas de compte ?{" "}
              <Link
                href="/signup"
                className="font-medium text-cacao underline underline-offset-2"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        ) : (
          <RdvCalendar
            providerId={provider.id}
            services={services}
            preselectedServiceId={preselectedServiceId}
            availableWeekdays={availableWeekdays}
          />
        )}
      </div>
    </main>
  );
}
