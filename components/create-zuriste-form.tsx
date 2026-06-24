"use client";

import { useActionState } from "react";
import { createZuriste } from "@/app/admin/actions";
import type { CreateResult } from "@/app/admin/types";
import { SubmitButton } from "@/components/submit-button";

export function CreateZuristeForm() {
  const [state, action] = useActionState<CreateResult, FormData>(
    createZuriste,
    null
  );

  const input =
    "w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or";

  return (
    <form
      action={action}
      className="space-y-3 rounded-xl2 border border-sable bg-white p-5"
    >
      <h2 className="font-display text-xl">Créer une Zuriste</h2>
      <p className="text-sm text-cacao/60">
        Crée un accès directement, sans email de confirmation. La Zuriste se
        connecte avec ces identifiants et pourra changer son mot de passe une
        fois connectée.
      </p>

      <input name="full_name" placeholder="Nom (interne)" className={input} />
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className={input}
      />
      <input
        name="password"
        type="text"
        placeholder="Mot de passe provisoire (6 caractères min.)"
        required
        className={input}
      />

      {state?.error && (
        <p className="rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-xl2 bg-green-100 px-4 py-2 text-sm text-green-800">
          {state.ok}
        </p>
      )}

      <SubmitButton>Créer le compte</SubmitButton>
    </form>
  );
}
