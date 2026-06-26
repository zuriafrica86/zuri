"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PortfolioResult } from "./types";

async function adminContext(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const targetUserId = String(formData.get("target_user_id") || "").trim();
  if (targetUserId) {
    if (!user) return { ok: false as const };
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (me?.role !== "admin") return { ok: false as const };
    return { ok: true as const, db: createAdminClient(), ownerId: targetUserId };
  }
  if (!user) return { ok: false as const };
  return { ok: true as const, db: supabase, ownerId: user.id };
}

export async function addPortfolioItem(
  _prev: PortfolioResult,
  formData: FormData
): Promise<PortfolioResult> {
  const ctx = await adminContext(formData);
  if (!ctx.ok) return { error: "Session expirée ou non autorisé." };
  const { db, ownerId } = ctx;

  const { data: provider } = await db
    .from("providers")
    .select("id")
    .eq("user_id", ownerId)
    .maybeSingle();
  if (!provider) return { error: "Crée d'abord le profil." };

  const type = String(formData.get("type") || "general");
  const image_url = String(formData.get("image_url") || "").trim();
  const image_url_after =
    String(formData.get("image_url_after") || "").trim() || null;
  const caption = String(formData.get("caption") || "").trim() || null;
  const service_id = String(formData.get("service_id") || "").trim() || null;

  if (!image_url) return { error: "Ajoute au moins une photo." };
  if (type === "avant_apres" && !image_url_after) {
    return { error: "Ajoute aussi la photo « après »." };
  }

  const { error } = await db.from("portfolio_photos").insert({
    provider_id: provider.id,
    type,
    image_url,
    image_url_after,
    caption,
    service_id,
  });
  if (error) return { error: "Échec de l'ajout. Réessaie." };

  revalidatePath("/dashboard/portfolio");
  revalidatePath(`/admin/zuriste/${ownerId}`);
  return { ok: true };
}

export async function deletePortfolioItem(formData: FormData) {
  const ctx = await adminContext(formData);
  if (!ctx.ok) return;
  const { db, ownerId } = ctx;
  const id = String(formData.get("item_id") || "");
  if (id) await db.from("portfolio_photos").delete().eq("id", id);
  revalidatePath("/dashboard/portfolio");
  revalidatePath(`/admin/zuriste/${ownerId}`);
}
