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
    .select("role, full_name, phone")
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
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl">Mon profil</h1>
        <p className="mt-1 text-sm text-cacao/60">
          Modifie tes informations personnelles.
        </p>
      </div>
      <ClienteProfileForm
        initial={{ prenom, nom, phone }}
        email={user.email ?? ""}
      />
    </>
  );
}
