"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";

// ---------- INSCRIPTION ----------
export async function signup(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const prenom = String(formData.get("prenom") || "").trim();
  const nom = String(formData.get("nom") || "").trim();
  const full_name = `${prenom} ${nom}`.trim();
  const phone = String(formData.get("phone") || "").trim();
  const role = String(formData.get("role") || "cliente");

  if (!email || !password || !prenom || !nom) {
    return { error: "Prénom, nom, email et mot de passe sont obligatoires." };
  }
  if (password.length < 6) {
    return { error: "Le mot de passe doit faire au moins 6 caractères." };
  }
  if (role !== "cliente" && role !== "prestataire") {
    return { error: "Rôle invalide." };
  }

  // full_name / prenom / nom / phone / role partent dans les métadonnées →
  // le trigger SQL handle_new_user() crée la ligne profiles.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, prenom, nom, phone, role },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: traduireErreur(error.message) };

  redirect("/login?verifie=1");
}

// ---------- CONNEXION ----------
export async function login(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: traduireErreur(error.message) };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// ---------- DÉCONNEXION ----------
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// Messages Supabase → français lisible
function traduireErreur(msg: string): string {
  if (msg.includes("already registered")) return "Cet email a déjà un compte.";
  if (msg.includes("Invalid login")) return "Email ou mot de passe incorrect.";
  if (msg.includes("Email not confirmed"))
    return "Confirme ton email avant de te connecter.";
  return "Une erreur est survenue. Réessaie.";
}
