"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function contactWhatsApp(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const provider_id = String(formData.get("provider_id") || "");
  if (!provider_id) redirect("/dashboard/mes-rdv");

  // Le numéro n'est renvoyé que si un RDV confirmé existe (sécurité en base).
  const { data } = await supabase.rpc("reveal_contact", {
    p_provider: provider_id,
  });
  const row = Array.isArray(data) ? data[0] : null;
  const whatsapp = row?.whatsapp_number as string | undefined;
  if (!whatsapp) redirect("/dashboard/mes-rdv");

  // On enregistre le contact (la métrique clé de ZURI).
  try {
    await supabase
      .from("contact_events")
      .insert({ provider_id, cliente_id: user.id, channel: "whatsapp" });
  } catch {
    // un échec de log ne doit pas bloquer l'ouverture de WhatsApp
  }

  const msg = encodeURIComponent(
    "Bonjour, je vous ai trouvée sur ZURI et je souhaite organiser notre rendez-vous."
  );
  redirect(`https://wa.me/${whatsapp}?text=${msg}`);
}
