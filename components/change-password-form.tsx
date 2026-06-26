"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) {
      setMsg({ ok: false, text: "6 caractères minimum." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setMsg({
        ok: false,
        text: "Échec. Déconnecte-toi, reconnecte-toi puis réessaie.",
      });
    } else {
      setMsg({ ok: true, text: "Mot de passe mis à jour" });
      setPw("");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl2 border border-sable bg-white p-5"
    >
      <h2 className="font-display text-xl">Changer mon mot de passe</h2>
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Nouveau mot de passe (6 caractères min.)"
        className="w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or"
      />
      {msg && (
        <p
          className={
            msg.ok
              ? "rounded-xl2 bg-green-100 px-4 py-2 text-sm text-green-800"
              : "rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao"
          }
        >
          {msg.text}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl2 bg-or px-5 py-3 font-medium text-cacao shadow-soft transition hover:bg-or-clair disabled:opacity-60"
      >
        {busy ? "Enregistrement…" : "Mettre à jour"}
      </button>
    </form>
  );
}
