import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import {
  ProviderProfileForm,
  type ProviderInitial,
} from "@/components/provider-profile-form";

export default async function ProfilPage() {
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

  // Réservé aux Zuristes.
  if (profile?.role !== "prestataire") redirect("/dashboard");

  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Valeurs saisies à l'inscription (métadonnées) — servent à pré-remplir.
  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  const fullName = (meta.full_name ?? "").trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const metaPrenom = meta.prenom || parts[0] || "";
  const metaNom = meta.nom || parts.slice(1).join(" ") || "";
  const metaPhone = meta.phone || "";

  let contactWhatsapp = "";
  let contactPhone = "";
  if (provider) {
    const { data: contact } = await supabase
      .from("provider_contacts")
      .select("whatsapp_number, phone_number")
      .eq("provider_id", provider.id)
      .maybeSingle();
    contactWhatsapp = contact?.whatsapp_number ?? "";
    contactPhone = contact?.phone_number ?? "";
  }

  const p = (provider ?? {}) as ProviderInitial;
  const initial: ProviderInitial = {
    ...p,
    prenom: (p.prenom ?? "") || metaPrenom,
    nom: (p.nom ?? "") || metaNom,
    whatsapp_number: contactWhatsapp || metaPhone,
    phone_number: contactPhone,
  };

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-sable px-6 py-4">
        <Logo />
        <LogoutButton />
      </header>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <ProviderProfileForm userId={user.id} initial={initial} />
      </div>
    </main>
  );
}
