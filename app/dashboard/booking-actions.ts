"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBookingConfirmed, notifyBookingRefused } from "@/lib/notify";

async function notifyCliente(bookingId: string, confirmed: boolean) {
  try {
    const admin = createAdminClient();
    const { data: bk } = await admin
      .from("bookings")
      .select("cliente_id, provider_id")
      .eq("id", bookingId)
      .maybeSingle();
    if (!bk?.cliente_id) return;

    const { data: cli } = await admin
      .from("profiles")
      .select("email")
      .eq("id", bk.cliente_id)
      .maybeSingle();
    const { data: prov } = await admin
      .from("providers")
      .select("business_name")
      .eq("id", bk.provider_id)
      .maybeSingle();

    if (!cli?.email) return;
    const coiffeuseName = prov?.business_name ?? "ta coiffeuse";
    if (confirmed) {
      await notifyBookingConfirmed(cli.email, { coiffeuseName });
    } else {
      await notifyBookingRefused(cli.email, { coiffeuseName });
    }
  } catch {
    // notif non bloquante
  }
}

export async function confirmBooking(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("booking_id") || "");
  if (id) {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirme" })
      .eq("id", id);
    if (!error) await notifyCliente(id, true);
  }
  revalidatePath("/dashboard/rdv");
}

export async function refuseBooking(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("booking_id") || "");
  if (id) {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "refuse" })
      .eq("id", id);
    if (!error) await notifyCliente(id, false);
  }
  revalidatePath("/dashboard/rdv");
}
