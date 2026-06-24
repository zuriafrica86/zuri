"use server";

import { createClient } from "@/lib/supabase/server";
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

  return { ok: true };
}
