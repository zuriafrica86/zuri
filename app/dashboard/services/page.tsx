import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
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
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-sable px-6 py-4">
        <Logo />
        <LogoutButton />
      </header>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl">Mes services</h1>
          <Link href="/dashboard" className="text-sm text-cacao/60 hover:text-cacao">
            ← Retour
          </Link>
        </div>

        {!provider ? (
          <div className="rounded-xl2 border border-sable bg-ivoire p-5">
            <p className="text-cacao/70">
              Tu dois d&apos;abord créer ton profil avant d&apos;ajouter des
              services.
            </p>
            <Link
              href="/dashboard/profil"
              className="mt-3 inline-block rounded-xl2 bg-or px-4 py-2 font-medium text-cacao hover:bg-or-clair"
            >
              Créer mon profil →
            </Link>
          </div>
        ) : (
          <ServicesManager services={services} />
        )}
      </div>
    </main>
  );
}
