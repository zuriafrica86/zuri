"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewBooking } from "@/lib/notify";
import { computeSlots, DEFAULT_SERVICE_MIN } from "@/lib/slots";
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

// Renvoie les créneaux libres (HH:MM) d'une Zuriste pour une date + une prestation.
// Combine ses disponibilités du jour et retire les RDV déjà pris (confirmés/en attente).
export async function getAvailableSlots(
  providerId: string,
  serviceId: string | null,
  dateStr: string
): Promise<string[]> {
  if (!providerId || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return [];
  const supabase = await createClient();

  // Durée de la prestation demandée
  let serviceMinutes = DEFAULT_SERVICE_MIN;
  if (serviceId) {
    const { data: svc } = await supabase
      .from("services")
      .select("duree_minutes")
      .eq("id", serviceId)
      .maybeSingle();
    if (svc?.duree_minutes && svc.duree_minutes > 0)
      serviceMinutes = svc.duree_minutes;
  }

  // Jour de la semaine (0=dim..6=sam) et plages de disponibilité
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const { data: avail } = await supabase
    .from("availability")
    .select("start_time, end_time")
    .eq("provider_id", providerId)
    .eq("day_of_week", weekday);
  const ranges = (
    (avail as { start_time: string | null; end_time: string | null }[] | null) ??
    []
  )
    .filter((a) => a.start_time && a.end_time)
    .map((a) => ({ start: a.start_time as string, end: a.end_time as string }));
  if (ranges.length === 0) return [];

  // RDV déjà pris ce jour-là (lecture service-role : on n'expose que des horaires)
  const admin = createAdminClient();
  const { data: bks } = await admin
    .from("bookings")
    .select("heure_souhaitee, service_id")
    .eq("provider_id", providerId)
    .eq("date_souhaitee", dateStr)
    .in("status", ["confirme", "en_cours", "en_attente"]);
  const rows =
    (bks as { heure_souhaitee: string | null; service_id: string | null }[] | null) ??
    [];
  // Durées des prestations concernées (pour savoir combien de temps chaque RDV bloque)
  const sids = [...new Set(rows.map((r) => r.service_id).filter(Boolean))] as string[];
  const durations: Record<string, number> = {};
  if (sids.length) {
    const { data: svcs } = await admin
      .from("services")
      .select("id, duree_minutes")
      .in("id", sids);
    for (const sv of (svcs as { id: string; duree_minutes: number | null }[] | null) ?? [])
      durations[sv.id] = sv.duree_minutes ?? DEFAULT_SERVICE_MIN;
  }
  const busy = rows
    .filter((r) => r.heure_souhaitee)
    .map((r) => ({
      start: r.heure_souhaitee as string,
      minutes: (r.service_id && durations[r.service_id]) || DEFAULT_SERVICE_MIN,
    }));

  // Si c'est aujourd'hui (heure du Gabon, UTC+1), ne proposer que des départs futurs
  let minStartMin = 0;
  const now = new Date();
  const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  if (dateStr === todayStr) {
    minStartMin = (now.getUTCHours() + 1) * 60 + now.getUTCMinutes();
  }

  return computeSlots({ ranges, busy, serviceMinutes, minStartMin });
}
