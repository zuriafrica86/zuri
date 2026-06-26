"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

async function setStatus(formData: FormData, status: string) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const id = String(formData.get("provider_id") || "");
  if (id) {
    await ctx.supabase.from("providers").update({ status }).eq("id", id);
  }
  refresh();
}

export async function approveProvider(formData: FormData) {
  await setStatus(formData, "approved");
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

export async function createZuriste(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  const ctx = await assertAdmin();
  if (!ctx) return { error: "Non autorisé." };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const full_name = String(formData.get("full_name") || "").trim() || "Zuriste";

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
    user_metadata: { role: "prestataire", full_name },
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
