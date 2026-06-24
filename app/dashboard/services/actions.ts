"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AUTRE } from "@/lib/catalog";
import type { ServiceResult } from "./types";

export async function addService(
  _prev: ServiceResult,
  formData: FormData
): Promise<ServiceResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnecte-toi." };

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!provider) return { error: "Crée d'abord ton profil." };

  const univers = String(formData.get("univers") || "").trim();
  const categorie = String(formData.get("categorie") || "").trim();
  const prestation = String(formData.get("prestation") || "").trim();
  const name_custom = String(formData.get("name_custom") || "").trim();
  const price_min = parseInt(String(formData.get("price_min") || ""), 10);
  const price_max_raw = String(formData.get("price_max") || "").trim();
  const price_max = price_max_raw ? parseInt(price_max_raw, 10) : null;
  const duree_estim = String(formData.get("duree_estim") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;

  const name = prestation === AUTRE ? name_custom : prestation;

  if (!univers || !categorie || !name) {
    return { error: "Choisis un univers, une catégorie et une prestation." };
  }
  if (Number.isNaN(price_min)) {
    return { error: "Le prix de départ est obligatoire." };
  }

  const { error } = await supabase.from("services").insert({
    provider_id: provider.id,
    name,
    univers,
    categorie,
    category: categorie, // compat avec l'ancienne colonne
    price_min,
    price_max,
    duree_estim,
    description,
  });
  if (error) return { error: "Échec de l'ajout. Réessaie." };

  revalidatePath("/dashboard/services");
  return { ok: true };
}

export async function deleteService(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("service_id") || "");
  if (id) await supabase.from("services").delete().eq("id", id);
  revalidatePath("/dashboard/services");
}
