"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveProfile } from "@/app/dashboard/profil/actions";
import type { ProfileResult } from "@/app/dashboard/profil/types";
import { SubmitButton } from "@/components/submit-button";
import { VILLES } from "@/lib/catalog";

export interface ProviderInitial {
  business_name?: string | null;
  nom?: string | null;
  prenom?: string | null;
  bio?: string | null;
  ville?: string | null;
  quartier?: string | null;
  whatsapp_number?: string | null;
  phone_number?: string | null;
  lieu?: string | null;
  dispo?: string | null;
  profile_photo?: string | null;
  status?: string | null;
}

export function ProviderProfileForm({
  userId,
  initial,
  targetUserId,
}: {
  userId: string;
  initial: ProviderInitial | null;
  targetUserId?: string;
}) {
  const [state, action] = useActionState<ProfileResult, FormData>(
    saveProfile,
    null
  );
  const [photoUrl, setPhotoUrl] = useState<string>(
    initial?.profile_photo ?? ""
  );
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string>("");

  const supabase = createClient();

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setPhotoError("");
    try {
      const blob = await compressImage(file);
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("photos")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch {
      setPhotoError("Échec de l'envoi de la photo. Réessaie.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl">Mon profil Zuriste</h1>
        <Link href="/dashboard" className="text-sm text-cacao/60 hover:text-cacao">
          ← Retour
        </Link>
      </div>

      {initial?.status && <StatusBadge status={initial.status} />}

      <form action={action} className="mt-6 space-y-5">
        {targetUserId && (
          <input type="hidden" name="target_user_id" value={targetUserId} />
        )}
        {/* Photo de profil */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-rose/40">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Photo de profil"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <label className="inline-block cursor-pointer rounded-xl2 border border-sable px-4 py-2 text-sm font-medium hover:bg-rose/30">
              {uploading ? "Envoi…" : "Choisir une photo"}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                className="hidden"
              />
            </label>
            {photoError && (
              <p className="mt-1 text-sm text-red-700">{photoError}</p>
            )}
          </div>
        </div>
        <input type="hidden" name="profile_photo" value={photoUrl} />

        <Field
          label="Nom public (affiché aux clientes)"
          name="business_name"
          defaultValue={initial?.business_name ?? ""}
          placeholder="Ex : Awa Beauty"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Nom"
            name="nom"
            defaultValue={initial?.nom ?? ""}
            placeholder="Privé"
            required
          />
          <Field
            label="Prénom"
            name="prenom"
            defaultValue={initial?.prenom ?? ""}
            placeholder="Privé"
            required
          />
        </div>

        <Textarea
          label="Présentation"
          name="bio"
          defaultValue={initial?.bio ?? ""}
          placeholder="Spécialiste tresses, 8 ans d'expérience…"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Ville"
            name="ville"
            defaultValue={initial?.ville ?? ""}
            options={[
              ["", "Choisis ta ville"] as [string, string],
              ...VILLES.map((v) => [v, v] as [string, string]),
            ]}
          />
          <Field
            label="Quartier (optionnel)"
            name="quartier"
            defaultValue={initial?.quartier ?? ""}
            placeholder="Akanda"
          />
        </div>

        <Field
          label="Numéro WhatsApp"
          name="whatsapp_number"
          defaultValue={initial?.whatsapp_number ?? ""}
          placeholder="074 00 00 00"
          required
        />
        <Field
          label="Téléphone (optionnel)"
          name="phone_number"
          defaultValue={initial?.phone_number ?? ""}
          placeholder="074 00 00 00"
        />

        <Select
          label="Lieu de prestation"
          name="lieu"
          defaultValue={initial?.lieu ?? "chez_zuriste"}
          options={[
            ["chez_zuriste", "Chez la Zuriste"],
            ["chez_cliente", "Chez la cliente"],
            ["les_deux", "Les deux"],
          ]}
        />

        <Select
          label="Disponibilité"
          name="dispo"
          defaultValue={initial?.dispo ?? "disponible"}
          options={[
            ["disponible", "Disponible"],
            ["indisponible", "Indisponible"],
            ["masque", "Profil masqué (invisible dans la recherche)"],
          ]}
        />

        {state?.error && (
          <p className="rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p className="rounded-xl2 bg-green-100 px-4 py-2 text-sm text-green-800">
            Profil enregistré ✅
          </p>
        )}

        <SubmitButton>Enregistrer mon profil</SubmitButton>
      </form>

      <p className="mt-6 text-sm text-cacao/50">
        Ton profil doit être validé par l&apos;équipe ZURI avant d&apos;apparaître
        dans la recherche.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "En attente de validation", cls: "bg-rose/50 text-cacao" },
    approved: { label: "Profil approuvé ✅", cls: "bg-green-100 text-green-800" },
    rejected: { label: "Profil refusé", cls: "bg-red-100 text-red-800" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm ${s.cls}`}>
      {s.label}
    </span>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cacao/80">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or"
      />
    </label>
  );
}

function Textarea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cacao/80">
        {label}
      </span>
      <textarea
        {...props}
        rows={3}
        className="w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or"
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cacao/80">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl2 border border-sable bg-white px-4 py-3"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

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
