"use client";

import { useActionState, useEffect, useState } from "react";
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
}

export function PortfolioManager({
  userId,
  items,
}: {
  userId: string;
  items: PortfolioItem[];
}) {
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
    <div className="space-y-8">
      {/* Galerie existante */}
      <div className="grid grid-cols-2 gap-3">
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-cacao/50">
            Aucune réalisation pour l&apos;instant. Ajoute ta première photo
            ci-dessous.
          </p>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            className="overflow-hidden rounded-xl2 border border-sable bg-white"
          >
            {it.type === "avant_apres" && it.image_url_after ? (
              <div className="grid grid-cols-2">
                <Thumb src={it.image_url} badge="Avant" />
                <Thumb src={it.image_url_after} badge="Après" />
              </div>
            ) : (
              <Thumb src={it.image_url} />
            )}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="truncate text-sm text-cacao/60">
                {it.caption ?? ""}
              </span>
              <form action={deletePortfolioItem}>
                <input type="hidden" name="item_id" value={it.id} />
                <button
                  type="submit"
                  className="text-sm text-cacao/50 hover:text-cacao"
                  aria-label="Supprimer cette photo"
                >
                  Supprimer
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* Ajout */}
      <form
        key={formKey}
        action={action}
        className="space-y-4 rounded-xl2 border border-sable bg-white p-5"
      >
        <h2 className="font-display text-xl">Ajouter une réalisation</h2>

        {/* Choix du mode */}
        <div className="grid grid-cols-2 gap-2 rounded-xl2 bg-rose/40 p-1">
          {(["general", "avant_apres"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-xl2 px-3 py-2 text-sm font-medium transition ${
                mode === m ? "bg-ivoire text-cacao shadow-soft" : "text-cacao/60"
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
            Légende (optionnel)
          </span>
          <input
            name="caption"
            placeholder="Box braids bordeaux"
            className="w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or"
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
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl2 border border-dashed border-sable bg-ivoire/60 text-sm text-cacao/40">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span>+ Choisir</span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
    </label>
  );
}

function Thumb({ src, badge }: { src: string; badge?: string }) {
  return (
    <div className="relative aspect-square">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {badge && (
        <span className="absolute left-1 top-1 rounded bg-cacao/70 px-1.5 py-0.5 text-[10px] text-ivoire">
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
