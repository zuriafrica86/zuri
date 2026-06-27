"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyWalletTx, grantWelcomeBonusOnce } from "@/lib/wallet";
import { WELCOME_BONUS } from "@/lib/credit";
import { notifyProviderApproved, notifyCreditAdded } from "@/lib/notify";
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
  const { error } = await admin.auth.admin.createUser({
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

  refresh();
  return {
    ok: `Compte créé pour ${email}. Elle peut se connecter dès maintenant avec ce mot de passe.`,
  };
}
