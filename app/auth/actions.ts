"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdminNewProvider, notifyNewLogin } from "@/lib/notify";
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, prenom, nom, phone, role },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: traduireErreur(error.message) };

  // Prévenir l'admin + créer la fiche Zuriste (en attente, masquée) pour
  // qu'elle apparaisse immédiatement dans l'admin et soit validable.
  if (role === "prestataire") {
    await notifyAdminNewProvider({ prenom, nom, email });
    const uid = data.user?.id;
    if (uid) {
      try {
        const admin = createAdminClient();
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
  }

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

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { error: traduireErreur(error.message) };

  // Notification de sécurité « nouvelle connexion » (non bloquante)
  try {
    const h = await headers();
    const ip =
      h.get("cf-connecting-ip") ||
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "Inconnue";
    const { appareil, navigateur } = parseUserAgent(h.get("user-agent") || "");
    const dateHeure = formatGabon(new Date());

    let prenom = "";
    let toEmail = email;
    const uid = signInData.user?.id;
    if (uid) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", uid)
        .maybeSingle();
      if (prof?.full_name) prenom = prof.full_name.split(" ")[0];
      if (prof?.email) toEmail = prof.email;
    }
    await notifyNewLogin(toEmail, {
      prenom,
      ip,
      appareil,
      navigateur,
      dateHeure,
    });
  } catch {
    // notification non bloquante
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// Déduit un appareil + navigateur lisibles depuis le User-Agent.
function parseUserAgent(ua: string): { appareil: string; navigateur: string } {
  if (!ua) return { appareil: "Appareil inconnu", navigateur: "Navigateur inconnu" };

  let navigateur = "Navigateur inconnu";
  if (/Edg\//.test(ua)) navigateur = "Edge";
  else if (/OPR\/|Opera/.test(ua)) navigateur = "Opera";
  else if (/Firefox\//.test(ua)) navigateur = "Firefox";
  else if (/Chromium\//.test(ua)) navigateur = "Chromium";
  else if (/Chrome\//.test(ua)) navigateur = "Chrome";
  else if (/Version\/.*Safari\//.test(ua)) navigateur = "Safari";

  let appareil = "Appareil inconnu";
  if (/iPhone/.test(ua)) appareil = "iPhone";
  else if (/iPad/.test(ua)) appareil = "iPad";
  else if (/Android/.test(ua))
    appareil = /Mobile/.test(ua) ? "Téléphone Android" : "Tablette Android";
  else if (/Windows/.test(ua)) appareil = "Ordinateur Windows";
  else if (/Macintosh|Mac OS X/.test(ua)) appareil = "Mac";
  else if (/Linux/.test(ua)) appareil = "Ordinateur Linux";

  return { appareil, navigateur };
}

// Date et heure formatées à l'heure du Gabon (UTC+1).
function formatGabon(d: Date): string {
  try {
    return (
      d.toLocaleString("fr-FR", {
        timeZone: "Africa/Libreville",
        dateStyle: "long",
        timeStyle: "short",
      }) + " (heure du Gabon)"
    );
  } catch {
    return d.toISOString();
  }
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
