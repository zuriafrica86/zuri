import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const { data: prof } = await supabase
    .from("profiles")
    .select("birth_day, birth_month")
    .eq("id", user.id)
    .maybeSingle();

  const p = (provider ?? {}) as ProviderInitial;
  const initial: ProviderInitial = {
    ...p,
    prenom: (p.prenom ?? "") || metaPrenom,
    nom: (p.nom ?? "") || metaNom,
    whatsapp_number: contactWhatsapp || metaPhone,
    phone_number: contactPhone,
    birth_day: prof?.birth_day ?? null,
    birth_month: prof?.birth_month ?? null,
  };

  return (
    <>
        <ProviderProfileForm userId={user.id} initial={initial} />
      </>
  );
}
