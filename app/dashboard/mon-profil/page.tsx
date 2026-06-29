import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteProfileForm } from "@/components/cliente-profile-form";

export default async function MonProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, phone, birth_day, birth_month")
    .eq("id", user.id)
    .single();
  if (profile?.role === "prestataire") redirect("/dashboard/profil");
  if (profile?.role === "admin") redirect("/dashboard");

  const meta = (user.user_metadata || {}) as {
    prenom?: string;
    nom?: string;
    phone?: string;
  };
  const fullName = profile?.full_name ?? "";
  const prenom = meta.prenom || fullName.split(" ")[0] || "";
  const nom = meta.nom || fullName.split(" ").slice(1).join(" ") || "";
  const phone = profile?.phone || meta.phone || "";

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Mon profil</h1>
          <p className="mt-1 text-sm text-cacao/60">
            Modifie tes informations personnelles.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-cacao/60 transition hover:bg-rose/30 hover:text-cacao"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Retour
        </Link>
      </div>
      <ClienteProfileForm
        initial={{
          prenom,
          nom,
          phone,
          birth_day: profile?.birth_day ?? null,
          birth_month: profile?.birth_month ?? null,
        }}
        email={user.email ?? ""}
      />
    </div>
  );
}
