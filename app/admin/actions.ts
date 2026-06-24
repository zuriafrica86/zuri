"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateResult } from "./types";

// Garantit que l'appelant est bien un admin. Renvoie null sinon.
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

export async function approveProvider(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const id = String(formData.get("provider_id") || "");
  if (id) {
    await ctx.supabase
      .from("providers")
      .update({ status: "approved" })
      .eq("id", id);
  }
  revalidatePath("/admin");
}

export async function rejectProvider(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const id = String(formData.get("provider_id") || "");
  if (id) {
    await ctx.supabase
      .from("providers")
      .update({ status: "rejected" })
      .eq("id", id);
  }
  revalidatePath("/admin");
}

export async function deleteUser(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;
  const userId = String(formData.get("user_id") || "");
  if (!userId || userId === ctx.userId) return; // pas de suppression de soi-même

  // La suppression du compte auth nécessite la clé privilégiée ;
  // elle cascade sur le profil, le provider et toutes ses données.
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
  revalidatePath("/admin");
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
  revalidatePath("/admin");
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

  // Création directe du compte, email déjà confirmé (pas d'email d'activation).
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

  revalidatePath("/admin");
  return {
    ok: `Compte créé pour ${email}. Elle peut se connecter dès maintenant avec ce mot de passe.`,
  };
}
