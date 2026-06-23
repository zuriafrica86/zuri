import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Récupère le rôle depuis profiles (créé par le trigger à l'inscription).
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const prenom = profile?.full_name?.split(" ")[0] ?? "";
  const role = profile?.role ?? "cliente";

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-sable px-6 py-4">
        <Logo />
        <LogoutButton />
      </header>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm uppercase tracking-[0.15em] text-or">
          Espace {role === "prestataire" ? "coiffeuse" : role === "admin" ? "admin" : "cliente"}
        </p>
        <h1 className="mt-2 font-display text-4xl">Bonjour {prenom} 🌸</h1>

        {role === "cliente" && (
          <p className="mt-4 text-cacao/70">
            Bientôt ici : tes favoris, tes demandes de RDV et tes avis.
            La recherche de coiffeuses arrive au prochain bloc.
          </p>
        )}
        {role === "prestataire" && (
          <div className="mt-4 space-y-4">
            <p className="text-cacao/70">
              Gère ton profil public, tes prestations et tes réalisations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/profil"
                className="inline-block rounded-xl2 bg-or px-5 py-3 font-medium text-cacao shadow-soft transition hover:bg-or-clair"
              >
                Mon profil →
              </Link>
              <Link
                href="/dashboard/services"
                className="inline-block rounded-xl2 border border-sable px-5 py-3 font-medium text-cacao transition hover:bg-rose/30"
              >
                Mes services →
              </Link>
              <Link
                href="/dashboard/portfolio"
                className="inline-block rounded-xl2 border border-sable px-5 py-3 font-medium text-cacao transition hover:bg-rose/30"
              >
                Mon portfolio →
              </Link>
            </div>
          </div>
        )}
        {role === "admin" && (
          <p className="mt-4 text-cacao/70">
            Bientôt ici : validation des coiffeuses, modération et statistiques.
          </p>
        )}

        <div className="mt-8 rounded-xl2 border border-sable bg-white p-5 shadow-soft">
          <p className="text-sm text-cacao/60">
            ✅ Authentification opérationnelle. Connectée en tant que{" "}
            <span className="font-medium text-cacao">{user.email}</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
