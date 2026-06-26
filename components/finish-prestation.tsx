"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { finishPrestation } from "@/app/dashboard/booking-actions";

export function FinishPrestation({
  bookingId,
  userId,
}: {
  bookingId: string;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const supabase = createClient();

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const blob = await compress(file);
      const path = `${userId}/portfolio-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}.jpg`;
      const { error } = await supabase.storage
        .from("photos")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch {
      setErr("Échec de l'envoi de la photo. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 rounded-xl2 bg-or px-4 py-2 text-sm font-medium text-cacao hover:bg-or-clair"
      >
        Terminer la prestation
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl2 border border-sable bg-ivoire/40 p-3">
      <p className="text-sm font-medium text-cacao">
        Ajouter une photo du résultat ?{" "}
        <span className="text-cacao/50">(facultatif — elle ira dans ton portfolio)</span>
      </p>
      <label className="block cursor-pointer">
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl2 border border-dashed border-sable bg-white text-sm text-cacao/40">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex items-center gap-1">
              <Camera className="h-4 w-4" aria-hidden /> Choisir une photo
            </span>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={upload}
          className="hidden"
        />
      </label>
      {busy && <p className="text-sm text-cacao/60">Envoi de la photo…</p>}
      {err && <p className="text-sm text-red-700">{err}</p>}
      <form action={finishPrestation} className="flex flex-wrap gap-2">
        <input type="hidden" name="booking_id" value={bookingId} />
        <input type="hidden" name="photo_url" value={photoUrl} />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl2 bg-cacao px-4 py-2 text-sm font-medium text-ivoire hover:bg-cacao/90 disabled:opacity-50"
        >
          {photoUrl ? "Terminer avec la photo" : "Terminer"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl2 border border-sable px-4 py-2 text-sm text-cacao/70 hover:bg-rose/30"
        >
          Annuler
        </button>
      </form>
    </div>
  );
}

async function compress(
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
