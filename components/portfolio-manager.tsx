"use client";

import { useActionState, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  addPortfolioItem,
  deletePortfolioItem,
} from "@/app/dashboard/portfolio/actions";
import type { PortfolioResult } from "@/app/dashboard/portfolio/types";
import { SubmitButton } from "@/components/submit-button";

export interface PortfolioItem {
  id: string;
  type: string;
  image_url: string;
  image_url_after: string | null;
  caption: string | null;
  service_id: string | null;
}

export interface PortfolioService {
  id: string;
  name: string;
  price_min: number;
}

const fieldClass =
  "h-12 w-full rounded-xl2 border border-sable bg-white px-4 text-cacao placeholder:text-cacao/30 transition focus:border-or focus:shadow-focus focus:outline-none";

export function PortfolioManager({
  userId,
  items,
  services = [],
  targetUserId,
}: {
  userId: string;
  items: PortfolioItem[];
  services?: PortfolioService[];
  targetUserId?: string;
}) {
  const serviceName = (id: string | null) =>
    services.find((sv) => sv.id === id)?.name ?? null;
  const [state, action] = useActionState<PortfolioResult, FormData>(
    addPortfolioItem,
    null
  );
  const [mode, setMode] = useState<"general" | "avant_apres">("general");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrlAfter, setImageUrlAfter] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [formKey, setFormKey] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    if (state?.ok) {
      setImageUrl("");
      setImageUrlAfter("");
      setMode("general");
      setFormKey((k) => k + 1);
    }
  }, [state]);

  async function upload(
    e: React.ChangeEvent<HTMLInputElement>,
    setUrl: (u: string) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const blob = await compressImage(file);
      const path = `${userId}/portfolio-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}.jpg`;
      const { error } = await supabase.storage
        .from("photos")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch {
      setErr("Échec de l'envoi de la photo. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Galerie existante */}
      {items.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-sable bg-white px-6 py-12 text-center">
          <p className="font-medium text-cacao">
            Aucune réalisation pour l&apos;instant
          </p>
          <p className="mt-1 text-sm text-cacao/50">
            Ajoute ta première photo avec le formulaire ci-dessous.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="mb-3 font-display text-xl">
            Mes réalisations
            <span className="ml-2 align-middle text-base font-normal text-cacao/40">
              {items.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            {items.map((it) => {
              const label = serviceName(it.service_id) ?? it.caption;
              return (
                <figure key={it.id} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl2 bg-rose/30">
                    {it.type === "avant_apres" && it.image_url_after ? (
                      <div className="grid h-full grid-cols-2">
                        <Thumb src={it.image_url} badge="Avant" />
                        <Thumb src={it.image_url_after} badge="Après" />
                      </div>
                    ) : (
                      <Thumb src={it.image_url} />
                    )}
                    <form
                      action={deletePortfolioItem}
                      className="absolute right-2 top-2"
                    >
                      {targetUserId && (
                        <input
                          type="hidden"
                          name="target_user_id"
                          value={targetUserId}
                        />
                      )}
                      <input type="hidden" name="item_id" value={it.id} />
                      <button
                        type="submit"
                        aria-label="Supprimer cette photo"
                        onClick={(e) => {
                          if (!confirm("Supprimer cette photo ?"))
                            e.preventDefault();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-cacao/60 shadow-soft backdrop-blur transition hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </form>
                  </div>
                  {label && (
                    <figcaption className="mt-1.5 line-clamp-1 text-sm text-cacao/55">
                      {label}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </div>
      )}

      {/* Ajout */}
      <form
        key={formKey}
        action={action}
        className="space-y-3.5 rounded-4xl border border-sable bg-white p-5 shadow-soft"
      >
        {targetUserId && (
          <input type="hidden" name="target_user_id" value={targetUserId} />
        )}
        <h2 className="font-display text-xl">Ajouter une réalisation</h2>

        {/* Choix du mode */}
        <div className="grid grid-cols-2 gap-1 rounded-xl2 bg-rose/40 p-1">
          {(["general", "avant_apres"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition duration-250 ease-soft ${
                mode === m
                  ? "bg-white text-cacao shadow-soft"
                  : "text-cacao/60 hover:text-cacao"
              }`}
            >
              {m === "general" ? "Photo simple" : "Avant / Après"}
            </button>
          ))}
        </div>

        <input type="hidden" name="type" value={mode} />
        <input type="hidden" name="image_url" value={imageUrl} />
        <input type="hidden" name="image_url_after" value={imageUrlAfter} />

        {mode === "general" ? (
          <PhotoSlot
            label="Photo"
            url={imageUrl}
            onChange={(e) => upload(e, setImageUrl)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <PhotoSlot
              label="Avant"
              url={imageUrl}
              onChange={(e) => upload(e, setImageUrl)}
            />
            <PhotoSlot
              label="Après"
              url={imageUrlAfter}
              onChange={(e) => upload(e, setImageUrlAfter)}
            />
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cacao/80">
            Prestation associée{" "}
            <span className="text-cacao/40">
              (pour la bibliothèque de modèles)
            </span>
          </span>
          <select name="service_id" defaultValue="" className={fieldClass}>
            <option value="">— Aucune —</option>
            {services.map((sv) => (
              <option key={sv.id} value={sv.id}>
                {sv.name} — {sv.price_min.toLocaleString("fr-FR")} FCFA
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cacao/80">
            Légende (optionnel)
          </span>
          <input
            name="caption"
            placeholder="Box braids bordeaux"
            className={fieldClass}
          />
        </label>

        {busy && <p className="text-sm text-cacao/60">Envoi de la photo…</p>}
        {err && <p className="text-sm text-red-700">{err}</p>}
        {state?.error && (
          <p className="rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao">
            {state.error}
          </p>
        )}

        <SubmitButton>Ajouter au portfolio</SubmitButton>
      </form>
    </div>
  );
}

function PhotoSlot({
  label,
  url,
  onChange,
}: {
  label: string;
  url: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-sm font-medium text-cacao/80">
        {label}
      </span>
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl2 border border-dashed border-sable bg-rose/20 text-sm text-cacao/40 transition hover:border-or hover:bg-rose/30">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span>+ Choisir</span>
        )}
      </div>
      <input type="file" accept="image/*" onChange={onChange} className="hidden" />
    </label>
  );
}

function Thumb({ src, badge }: { src: string; badge?: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={badge ?? "Réalisation"}
        className="h-full w-full object-cover transition-transform duration-250 ease-soft group-hover:scale-[1.04]"
      />
      {badge && (
        <span className="absolute left-2 top-2 rounded-full bg-cacao/70 px-2 py-0.5 text-[10px] font-medium text-ivoire backdrop-blur">
          {badge}
        </span>
      )}
    </div>
  );
}

// Compression navigateur (identique à l'avatar) pour rester léger.
async function compressImage(
  file: File,
  maxSize = 1200,
  quality = 0.8
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
