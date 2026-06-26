"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBookingConfirmed, notifyBookingRefused } from "@/lib/notify";
import { applyWalletTx } from "@/lib/wallet";
import { commissionFor } from "@/lib/credit";

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
    const coiffeuseName = prov?.business_name ?? "ta Zuriste";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("booking_id") || "");
  if (!id) return;

  // Réservation (RLS : la Zuriste ne voit que les siennes)
  const { data: bk } = await supabase
    .from("bookings")
    .select("provider_id, service_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!bk || bk.status === "confirme") {
    revalidatePath("/dashboard/rdv");
    return;
  }

  // Provider + solde de la Zuriste connectée
  const { data: prov } = await supabase
    .from("providers")
    .select("id, credit_balance")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prov || prov.id !== bk.provider_id) {
    revalidatePath("/dashboard/rdv");
    return;
  }

  // Commission = 10 % du prix de la prestation
  let price: number | null = null;
  if (bk.service_id) {
    const { data: svc } = await supabase
      .from("services")
      .select("price_min")
      .eq("id", bk.service_id)
      .maybeSingle();
    price = svc?.price_min ?? null;
  }
  const commission = commissionFor(price);

  // Jamais sous zéro : crédit insuffisant -> blocage + redirection vers la recharge
  if ((prov.credit_balance ?? 0) < commission) {
    redirect("/dashboard/credit?insufficient=1");
  }

  // Confirmer (RLS owner) puis débiter via service-role
  const { error } = await supabase
    .from("bookings")
    .update({ status: "confirme" })
    .eq("id", id);
  if (!error) {
    await applyWalletTx(
      prov.id,
      -commission,
      "commission",
      "Confirmation RDV",
      id
    );
    await notifyCliente(id, true);
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

// COMMENCER : la Zuriste démarre la prestation (RDV confirmé -> en cours).
export async function startPrestation(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const id = String(formData.get("booking_id") || "");
  if (!id) return;

  await supabase
    .from("bookings")
    .update({ status: "en_cours", started_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "confirme"); // RLS : seulement ses propres RDV
  revalidatePath("/dashboard/rdv");
}

// TERMINER : la Zuriste clôt la prestation (en cours -> terminé).
// Si une photo est fournie, elle est ajoutée au portfolio (donc à la
// bibliothèque) et reliée à la prestation du RDV.
export async function finishPrestation(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const id = String(formData.get("booking_id") || "");
  const photoUrl = String(formData.get("photo_url") || "").trim();
  if (!id) return;

  const { data: bk } = await supabase
    .from("bookings")
    .select("provider_id, service_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!bk || bk.status !== "en_cours") {
    revalidatePath("/dashboard/rdv");
    return;
  }

  await supabase
    .from("bookings")
    .update({ status: "termine", finished_at: new Date().toISOString() })
    .eq("id", id);

  if (photoUrl) {
    await supabase.from("portfolio_photos").insert({
      provider_id: bk.provider_id,
      image_url: photoUrl,
      type: "general",
      service_id: bk.service_id ?? null,
      caption: null,
    });
  }

  revalidatePath("/dashboard/rdv");
  revalidatePath("/dashboard/portfolio");
}
