"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewBooking } from "@/lib/notify";
import type { BookingResult } from "./booking-types";

export async function requestBooking(
  _prev: BookingResult,
  formData: FormData
): Promise<BookingResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connecte-toi pour demander un RDV." };

  const provider_id = String(formData.get("provider_id") || "");
  const service_id = String(formData.get("service_id") || "").trim() || null;
  const date_souhaitee = String(formData.get("date_souhaitee") || "");
  const heure_souhaitee =
    String(formData.get("heure_souhaitee") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;

  if (!provider_id || !date_souhaitee) {
    return { error: "Choisis au moins une date pour ton rendez-vous." };
  }

  const { error } = await supabase.from("bookings").insert({
    provider_id,
    cliente_id: user.id,
    service_id,
    date_souhaitee,
    heure_souhaitee,
    note,
  });
  if (error) return { error: "Échec de l'envoi de la demande. Réessaie." };

  // Notifier la coiffeuse (sans bloquer si l'email échoue).
  try {
    const admin = createAdminClient();
    const { data: prov } = await admin
      .from("providers")
      .select("user_id")
      .eq("id", provider_id)
      .maybeSingle();
    if (prov?.user_id) {
      const { data: coiffeuse } = await admin
        .from("profiles")
        .select("email")
        .eq("id", prov.user_id)
        .maybeSingle();
      let serviceName = "Prestation non précisée";
      if (service_id) {
        const { data: svc } = await admin
          .from("services")
          .select("name")
          .eq("id", service_id)
          .maybeSingle();
        if (svc?.name) serviceName = svc.name;
      }
      if (coiffeuse?.email) {
        await notifyNewBooking(coiffeuse.email, {
          serviceName,
          dateLabel: date_souhaitee,
        });
      }
    }
  } catch {
    // notif non bloquante
  }

  return { ok: true };
}
