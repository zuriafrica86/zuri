"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyWalletTx, grantWelcomeBonusOnce } from "@/lib/wallet";
import { WELCOME_BONUS } from "@/lib/credit";
import {
  notifyProviderApproved,
  notifyCreditAdded,
  notifyZuristeAccountCreated,
} from "@/lib/notify";
import type { CreateResult } from "./types";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return null;
  return { supabase, userId: user.id };
}

function refresh() {
  // Revalide toutes les pages de l'admin (stats + listes restent à jour).
  revalidatePath("/admin", "layout");
}

async function setStatus(
  formData: FormData,
  status: string,
  notifyApproved = false
) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const id = String(formData.get("provider_id") || "");
  if (id) {
    await ctx.supabase.from("providers").update({ status }).eq("id", id);
    if (status === "approved") {
      await grantWelcomeBonusOnce(id, WELCOME_BONUS);
      if (notifyApproved) {
        // email de bienvenue : providers.user_id -> profiles.email
        const { data: prov } = await ctx.supabase
          .from("providers")
          .select("user_id, business_name")
          .eq("id", id)
          .maybeSingle();
        if (prov?.user_id) {
          const { data: prof } = await ctx.supabase
            .from("profiles")
            .select("email")
            .eq("id", prov.user_id)
            .maybeSingle();
          if (prof?.email) {
            await notifyProviderApproved(prof.email, {
              coiffeuseName: prov.business_name || "",
            });
          }
        }
      }
    }
  }
  refresh();
}

export async function approveProvider(formData: FormData) {
  await setStatus(formData, "approved", true);
}
export async function rejectProvider(formData: FormData) {
  await setStatus(formData, "rejected");
}
export async function suspendProvider(formData: FormData) {
  await setStatus(formData, "suspended");
}
export async function reactivateProvider(formData: FormData) {
  await setStatus(formData, "approved");
}

export async function toggleVerified(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const id = String(formData.get("provider_id") || "");
  const next = String(formData.get("next") || "true") === "true";
  if (id) {
    await ctx.supabase.from("providers").update({ verified: next }).eq("id", id);
  }
  refresh();
}

export async function toggleAmbassadrice(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const id = String(formData.get("provider_id") || "");
  const next = String(formData.get("next") || "true") === "true";
  if (id) {
    await ctx.supabase
      .from("providers")
      .update({ ambassadrice: next })
      .eq("id", id);
  }
  refresh();
}

export async function deleteUser(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const userId = String(formData.get("user_id") || "");
  if (!userId || userId === ctx.userId) return; // pas de suppression de soi-même
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
  refresh();
}

export async function creditWallet(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const id = String(formData.get("provider_id") || "");
  const amount = parseInt(String(formData.get("amount") || ""), 10);
  const reason = String(formData.get("reason") || "").trim() || "Recharge";
  if (id && !Number.isNaN(amount) && amount !== 0) {
    const balance = await applyWalletTx(
      id,
      amount,
      amount > 0 ? "recharge" : "adjust",
      reason
    );
    if (amount > 0) {
      const { data: prov } = await ctx.supabase
        .from("providers")
        .select("user_id")
        .eq("id", id)
        .maybeSingle();
      if (prov?.user_id) {
        const { data: prof } = await ctx.supabase
          .from("profiles")
          .select("email")
          .eq("id", prov.user_id)
          .maybeSingle();
        if (prof?.email) {
          await notifyCreditAdded(prof.email, { amount, balance });
        }
      }
    }
  }
  revalidatePath("/admin/zuristes");
}

export async function createZuriste(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  const ctx = await assertAdmin();
  if (!ctx) return { error: "Non autorisé." };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const prenom = String(formData.get("prenom") || "").trim();
  const nom = String(formData.get("nom") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const full_name = `${prenom} ${nom}`.trim() || "Zuriste";

  if (!email.includes("@") || password.length < 6) {
    return {
      error: "Email valide et mot de passe d'au moins 6 caractères requis.",
    };
  }

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "prestataire", full_name, prenom, nom, phone },
  });

  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exist")
    ) {
      return { error: "Un compte existe déjà avec cet email." };
    }
    return { error: "Échec de la création du compte. Réessaie." };
  }

  // Créer la fiche Zuriste (en attente, masquée) pour qu'elle apparaisse
  // immédiatement dans l'admin et puisse être validée. Sera complétée par
  // la Zuriste depuis son espace (mise à jour, pas de doublon).
  const uid = created.user?.id;
  if (uid) {
    try {
      await admin.from("providers").insert({
        user_id: uid,
        business_name: full_name || "Nouvelle Zuriste",
        prenom: prenom || null,
        nom: nom || null,
        ville: "À compléter",
        dispo: "masque",
        status: "pending",
      });
    } catch {
      // best-effort
    }
  }

  await notifyZuristeAccountCreated(email, { prenom });

  refresh();
  return {
    ok: `Compte créé pour ${email}. Elle apparaît dans « En attente » et peut se connecter avec ce mot de passe.`,
  };
}

/* ====================================================================== */
/*  Rendez-vous — contrôle total admin                                     */
/* ====================================================================== */
const BOOKING_STATUSES = [
  "en_attente",
  "confirme",
  "en_cours",
  "termine",
  "refuse",
  "annule",
];

// Modifie un rendez-vous : statut, date et/ou heure (override direct).
export async function adminUpdateBooking(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;

  const id = String(formData.get("booking_id") || "").trim();
  if (!id) return;

  const status = String(formData.get("status") || "").trim();
  const date = String(formData.get("date_souhaitee") || "").trim();
  const heure = String(formData.get("heure_souhaitee") || "").trim();

  const patch: Record<string, unknown> = {};
  if (status && BOOKING_STATUSES.includes(status)) patch.status = status;
  if (date) patch.date_souhaitee = date;
  patch.heure_souhaitee = heure || null;

  const admin = createAdminClient();
  await admin.from("bookings").update(patch).eq("id", id);
  refresh();
}

// Annule un rendez-vous (statut annulé, attribué à l'administration).
export async function adminCancelBooking(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;

  const id = String(formData.get("booking_id") || "").trim();
  if (!id) return;

  const reason =
    String(formData.get("cancel_reason") || "").trim() ||
    "Annulé par l'administration";

  const admin = createAdminClient();
  await admin
    .from("bookings")
    .update({
      status: "annule",
      cancelled_by: "admin",
      cancel_reason: reason,
    })
    .eq("id", id);
  refresh();
}

/* ====================================================================== */
/*  Mises en avant (boosts) — supervision admin                            */
/* ====================================================================== */

// Met une mise en avant en pause (elle disparaît aussitôt de la recherche /
// bibliothèque, sans remboursement).
export async function pauseBoost(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const id = String(formData.get("boost_id") || "").trim();
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("boosts").update({ status: "paused" }).eq("id", id);
  refresh();
}

// Réactive une mise en avant en pause (reprend jusqu'à sa date de fin).
export async function resumeBoost(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const id = String(formData.get("boost_id") || "").trim();
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("boosts").update({ status: "active" }).eq("id", id);
  refresh();
}

// Annule une mise en avant et rembourse le temps restant (prorata) en Crédit Zuri.
export async function refundBoost(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const id = String(formData.get("boost_id") || "").trim();
  if (!id) return;

  const admin = createAdminClient();
  const { data: b } = await admin
    .from("boosts")
    .select("id, provider_id, cost, starts_at, ends_at, status")
    .eq("id", id)
    .maybeSingle();
  if (!b || b.status === "cancelled") return;

  const start = new Date(b.starts_at as string).getTime();
  const end = new Date(b.ends_at as string).getTime();
  const total = Math.max(1, end - start);
  const remaining = Math.max(0, end - Date.now());
  const refund = Math.round((b.cost ?? 0) * (remaining / total));

  await admin
    .from("boosts")
    .update({ status: "cancelled", ends_at: new Date().toISOString() })
    .eq("id", id);

  if (refund > 0) {
    await applyWalletTx(
      b.provider_id as string,
      refund,
      "boost_refund",
      "Remboursement mise en avant (prorata)"
    );
  }
  refresh();
}
