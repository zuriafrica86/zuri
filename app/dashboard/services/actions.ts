"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AUTRE } from "@/lib/catalog";
import type { ServiceResult } from "./types";

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
    return {
      ok: true as const,
      db: createAdminClient(),
      ownerId: targetUserId,
      isAdmin: true,
    };
  }
  if (!user) return { ok: false as const };
  return { ok: true as const, db: supabase, ownerId: user.id, isAdmin: false };
}

export async function addService(
  _prev: ServiceResult,
  formData: FormData
): Promise<ServiceResult> {
  const ctx = await adminContext(formData);
  if (!ctx.ok) return { error: "Session expirée ou non autorisé." };
  const { db, ownerId } = ctx;

  const { data: provider } = await db
    .from("providers")
    .select("id")
    .eq("user_id", ownerId)
    .maybeSingle();
  if (!provider) return { error: "Crée d'abord le profil." };

  const univers = String(formData.get("univers") || "").trim();
  const categorie = String(formData.get("categorie") || "").trim();
  const prestation = String(formData.get("prestation") || "").trim();
  const name_custom = String(formData.get("name_custom") || "").trim();
  const price_min = parseInt(String(formData.get("price_min") || ""), 10);
  const dh = parseInt(String(formData.get("duree_h") || ""), 10);
  const dm = parseInt(String(formData.get("duree_min") || ""), 10);
  const h = Number.isNaN(dh) ? 0 : dh;
  const m = Number.isNaN(dm) ? 0 : dm;
  let duree_estim: string | null = null;
  if (h > 0 && m > 0) duree_estim = `${h}h${m.toString().padStart(2, "0")}`;
  else if (h > 0) duree_estim = `${h}h`;
  else if (m > 0) duree_estim = `${m} min`;
  const duree_minutes = h * 60 + m > 0 ? h * 60 + m : null;
  const description = String(formData.get("description") || "").trim() || null;

  const name = prestation === AUTRE ? name_custom : prestation;

  if (!univers || !categorie || !name) {
    return { error: "Choisis un univers, une catégorie et une prestation." };
  }
  if (Number.isNaN(price_min)) {
    return { error: "Le prix est obligatoire." };
  }

  const { error } = await db.from("services").insert({
    provider_id: provider.id,
    name,
    univers,
    categorie,
    category: categorie,
    price_min,
    price_max: null,
    duree_estim,
    duree_minutes,
    description,
  });
  if (error) return { error: "Échec de l'ajout. Réessaie." };

  revalidatePath("/dashboard/services");
  revalidatePath(`/admin/zuriste/${ownerId}`);
  return { ok: true };
}

export async function deleteService(formData: FormData) {
  const ctx = await adminContext(formData);
  if (!ctx.ok) return;
  const { db, ownerId } = ctx;
  const id = String(formData.get("service_id") || "");
  if (id) await db.from("services").delete().eq("id", id);
  revalidatePath("/dashboard/services");
  revalidatePath(`/admin/zuriste/${ownerId}`);
}

export async function updateService(
  _prev: ServiceResult,
  formData: FormData
): Promise<ServiceResult> {
  const ctx = await adminContext(formData);
  if (!ctx.ok) return { error: "Session expirée ou non autorisé." };
  const { db, ownerId } = ctx;

  const id = String(formData.get("service_id") || "").trim();
  if (!id) return { error: "Service introuvable." };

  const price_min = parseInt(String(formData.get("price_min") || ""), 10);
  if (Number.isNaN(price_min)) return { error: "Le prix est obligatoire." };

  const dh = parseInt(String(formData.get("duree_h") || ""), 10);
  const dm = parseInt(String(formData.get("duree_min") || ""), 10);
  const h = Number.isNaN(dh) ? 0 : dh;
  const m = Number.isNaN(dm) ? 0 : dm;
  let duree_estim: string | null = null;
  if (h > 0 && m > 0) duree_estim = `${h}h${m.toString().padStart(2, "0")}`;
  else if (h > 0) duree_estim = `${h}h`;
  else if (m > 0) duree_estim = `${m} min`;
  const duree_minutes = h * 60 + m > 0 ? h * 60 + m : null;
  const description = String(formData.get("description") || "").trim() || null;

  const { error } = await db
    .from("services")
    .update({
      price_min,
      price_max: null,
      duree_estim,
      duree_minutes,
      description,
    })
    .eq("id", id);
  if (error) return { error: "Échec de la modification. Réessaie." };

  revalidatePath("/dashboard/services");
  revalidatePath(`/admin/zuriste/${ownerId}`);
  return { ok: true };
}
