"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  notifyBookingConfirmed,
  notifyBookingRefused,
  notifyPrestationFinished,
  notifyNewReview,
  notifyCreditAlert,
  notifyCancellationNotice,
  notifyCancellationReceipt,
} from "@/lib/notify";
import {
  reasonsFor,
  canCancelByDelay,
  type CancelResult,
} from "@/lib/cancel-reasons";
import { applyWalletTx } from "@/lib/wallet";
import { commissionFor, ALERT_HIGH, ALERT_LOW } from "@/lib/credit";

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
    const after = await applyWalletTx(
      prov.id,
      -commission,
      "commission",
      "Confirmation RDV",
      id
    );
    // Alerte si ce débit fait franchir un seuil (un seul email, le plus grave).
    const before = after + commission;
    let level: "high" | "low" | "empty" | null = null;
    if (after <= 0 && before > 0) level = "empty";
    else if (after < ALERT_LOW && before >= ALERT_LOW) level = "low";
    else if (after < ALERT_HIGH && before >= ALERT_HIGH) level = "high";
    if (level && user.email) {
      await notifyCreditAlert(user.email, { balance: after, level });
    }
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
    .select("provider_id, service_id, status, cliente_id")
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

  // Prévenir la cliente : prestation terminée -> à confirmer + noter.
  try {
    const admin = createAdminClient();
    if (bk.cliente_id) {
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
      if (cli?.email) {
        await notifyPrestationFinished(cli.email, {
          coiffeuseName: prov?.business_name ?? "Ta Zuriste",
        });
      }
    }
  } catch {
    // notif non bloquante
  }

  revalidatePath("/dashboard/rdv");
  revalidatePath("/dashboard/portfolio");
}

// La cliente confirme que la prestation a eu lieu et laisse un avis
// (note + commentaire facultatifs). La note moyenne se recalcule via trigger.
export async function confirmPrestation(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("booking_id") || "");
  const ratingRaw = parseInt(String(formData.get("rating") || ""), 10);
  const rating = Number.isNaN(ratingRaw)
    ? 0
    : Math.min(5, Math.max(0, ratingRaw));
  const comment = String(formData.get("comment") || "").trim() || null;
  if (!id) return;

  // RLS : la cliente ne voit que ses propres réservations
  const { data: bk } = await supabase
    .from("bookings")
    .select("provider_id, cliente_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!bk || bk.cliente_id !== user.id || bk.status !== "termine") {
    revalidatePath("/dashboard/mes-rdv");
    return;
  }

  const admin = createAdminClient();
  await admin.from("bookings").update({ cliente_confirmed: true }).eq("id", id);

  if (rating >= 1 && rating <= 5) {
    await admin.from("reviews").upsert(
      {
        provider_id: bk.provider_id,
        cliente_id: user.id,
        rating,
        comment,
        status: "visible",
      },
      { onConflict: "provider_id,cliente_id" }
    );

    // Prévenir la Zuriste qu'elle a reçu un avis.
    try {
      const { data: prov } = await admin
        .from("providers")
        .select("user_id, slug")
        .eq("id", bk.provider_id)
        .maybeSingle();
      if (prov?.user_id) {
        const { data: prof } = await admin
          .from("profiles")
          .select("email")
          .eq("id", prov.user_id)
          .maybeSingle();
        if (prof?.email) {
          await notifyNewReview(prof.email, {
            rating,
            comment,
            profileUrl: `${process.env.APP_URL || "https://zuriafrica.app"}/zuriste/${prov.slug ?? bk.provider_id}`,
          });
        }
      }
    } catch {
      // notif non bloquante
    }
  }
  revalidatePath("/dashboard/mes-rdv");
}

/* ====================================================================== */
/*  Annulation d'un RDV par la cliente OU la Zuriste                       */
/* ====================================================================== */
function frDate(d: string): string {
  try {
    return new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return d;
  }
}

export async function cancelBooking(
  _prev: CancelResult | null,
  formData: FormData
): Promise<CancelResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connectée." };

  const id = String(formData.get("booking_id") || "");
  const reasonKey = String(formData.get("reason") || "").trim();
  const autre = String(formData.get("autre") || "").trim();
  if (!id) return { error: "Réservation introuvable." };
  if (!reasonKey) return { error: "Choisis un motif d'annulation." };

  const admin = createAdminClient();

  // On charge la réservation + la Zuriste (nom + propriétaire du compte).
  const { data: bk } = await admin
    .from("bookings")
    .select(
      "id, status, date_souhaitee, heure_souhaitee, cliente_id, provider_id, providers(business_name, user_id)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!bk) return { error: "Réservation introuvable." };

  const prov = (bk.providers ?? null) as
    | { business_name: string; user_id: string | null }
    | { business_name: string; user_id: string | null }[]
    | null;
  const provider = Array.isArray(prov) ? prov[0] ?? null : prov;

  // Qui annule ? (déduit côté serveur, on ne fait pas confiance au client)
  const isCliente = bk.cliente_id === user.id;
  const isProvider = !!provider?.user_id && provider.user_id === user.id;
  if (!isCliente && !isProvider) return { error: "Action non autorisée." };
  const role: "cliente" | "prestataire" = isCliente ? "cliente" : "prestataire";

  // Encore annulable ?
  if (bk.status !== "en_attente" && bk.status !== "confirme") {
    return { error: "Ce rendez-vous ne peut plus être annulé." };
  }
  if (!canCancelByDelay(bk.date_souhaitee, bk.heure_souhaitee)) {
    return {
      error:
        "Trop tard : un rendez-vous ne peut plus être annulé à moins de 2h.",
    };
  }

  // Motif lisible (selon le rôle), "Autre" => texte libre obligatoire.
  let motif: string;
  if (reasonKey === "autre") {
    if (!autre) return { error: "Précise ton motif dans le champ « Autre »." };
    motif = `Autre : ${autre}`;
  } else {
    const found = reasonsFor(role).find((r) => r.key === reasonKey);
    if (!found) return { error: "Motif invalide." };
    motif = found.label;
  }

  // Annulation (service-role) : libère le créneau (statut hors de la liste « occupé »).
  const { error: updErr } = await admin
    .from("bookings")
    .update({ status: "annule", cancel_reason: motif, cancelled_by: role })
    .eq("id", id);
  if (updErr) return { error: "Échec de l'annulation. Réessaie." };

  // Emails : on récupère les adresses des deux parties.
  const heureLabel = bk.heure_souhaitee
    ? bk.heure_souhaitee.slice(0, 5)
    : null;
  const dateLabel = frDate(bk.date_souhaitee);
  const businessName = provider?.business_name || "ta Zuriste";

  let clienteEmail: string | null = null;
  let clienteName = "la cliente";
  if (bk.cliente_id) {
    const { data: cli } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", bk.cliente_id)
      .maybeSingle();
    clienteEmail = cli?.email ?? null;
    if (cli?.full_name) clienteName = cli.full_name;
  }

  let providerEmail: string | null = null;
  if (provider?.user_id) {
    const { data: prof } = await admin
      .from("profiles")
      .select("email")
      .eq("id", provider.user_id)
      .maybeSingle();
    providerEmail = prof?.email ?? null;
  }

  // Avis (avec motif) à l'autre partie + accusé à celle qui annule.
  if (isCliente) {
    if (providerEmail) {
      await notifyCancellationNotice(providerEmail, {
        cancellerName: clienteName,
        dateLabel,
        heureLabel,
        motif,
        recipientIsProvider: true,
      });
    }
    if (clienteEmail) {
      await notifyCancellationReceipt(clienteEmail, {
        otherName: businessName,
        dateLabel,
        heureLabel,
      });
    }
  } else {
    if (clienteEmail) {
      await notifyCancellationNotice(clienteEmail, {
        cancellerName: businessName,
        dateLabel,
        heureLabel,
        motif,
        recipientIsProvider: false,
      });
    }
    if (providerEmail) {
      await notifyCancellationReceipt(providerEmail, {
        otherName: clienteName,
        dateLabel,
        heureLabel,
      });
    }
  }

  revalidatePath("/dashboard/mes-rdv");
  revalidatePath("/dashboard/rdv");
  return { ok: true };
}
