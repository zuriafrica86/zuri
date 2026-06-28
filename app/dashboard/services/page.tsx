import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServicesManager, type ServiceItem } from "@/components/services-manager";

export default async function ServicesPage() {
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

  let services: ServiceItem[] = [];
  if (provider) {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("provider_id", provider.id)
      .order("name");
    services = (data as ServiceItem[]) ?? [];
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Mes services</h1>
          <p className="mt-1 text-sm text-cacao/60">
            Ajoute tes prestations, leurs tarifs et leur durée.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-cacao/60 transition hover:bg-rose/30 hover:text-cacao"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Retour
        </Link>
      </div>

      {!provider ? (
        <div className="rounded-4xl border border-sable bg-white p-6 shadow-soft">
          <p className="text-cacao/70">
            Tu dois d&apos;abord créer ton profil avant d&apos;ajouter des
            services.
          </p>
          <Link
            href="/dashboard/profil"
            className="mt-4 inline-flex items-center gap-2 rounded-xl2 bg-cacao px-5 py-2.5 font-medium text-ivoire transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
          >
            Créer mon profil <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <ServicesManager services={services} />
      )}
    </div>
  );
}
