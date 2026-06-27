"use client";

import { useActionState } from "react";
import { CheckCircle } from "lucide-react";
import { saveClienteProfile } from "@/app/dashboard/mon-profil/actions";
import type { ProfileResult } from "@/app/dashboard/mon-profil/types";
import { SubmitButton } from "@/components/submit-button";

export function ClienteProfileForm({
  initial,
  email,
}: {
  initial: { prenom: string; nom: string; phone: string };
  email: string;
}) {
  const [state, action] = useActionState<ProfileResult, FormData>(
    saveClienteProfile,
    null
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-xl2 border border-sable bg-white p-5"
    >
      <Field label="Prénom" name="prenom" defaultValue={initial.prenom} required />
      <Field label="Nom" name="nom" defaultValue={initial.nom} />
      <Field
        label="Téléphone"
        name="phone"
        type="tel"
        defaultValue={initial.phone}
        placeholder="+241 ..."
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-cacao/80">
          Email
        </span>
        <input
          value={email}
          disabled
          className="w-full rounded-xl2 border border-sable bg-ivoire/40 px-4 py-3 text-cacao/60"
        />
        <span className="mt-1 block text-xs text-cacao/40">
          L&apos;email ne peut pas être modifié ici.
        </span>
      </label>

      {state?.error && (
        <p className="rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="flex items-center gap-1.5 rounded-xl2 bg-green-50 px-4 py-2 text-sm text-green-800">
          <CheckCircle className="h-4 w-4" aria-hidden /> Profil mis à jour.
        </p>
      )}

      <SubmitButton>Enregistrer</SubmitButton>
    </form>
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
