"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PortfolioResult } from "./types";

export async function addPortfolioItem(
  _prev: PortfolioResult,
  formData: FormData
): Promise<PortfolioResult> {
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

  const type = String(formData.get("type") || "general");
  const image_url = String(formData.get("image_url") || "").trim();
  const image_url_after =
    String(formData.get("image_url_after") || "").trim() || null;
  const caption = String(formData.get("caption") || "").trim() || null;

  if (!image_url) return { error: "Ajoute au moins une photo." };
  if (type === "avant_apres" && !image_url_after) {
    return { error: "Ajoute aussi la photo « après »." };
  }

  const { error } = await supabase.from("portfolio_photos").insert({
    provider_id: provider.id,
    type,
    image_url,
    image_url_after,
    caption,
  });
  if (error) return { error: "Échec de l'ajout. Réessaie." };

  revalidatePath("/dashboard/portfolio");
  return { ok: true };
}

export async function deletePortfolioItem(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("item_id") || "");
  if (id) await supabase.from("portfolio_photos").delete().eq("id", id);
  revalidatePath("/dashboard/portfolio");
}
