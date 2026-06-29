"use client";

import { useActionState } from "react";
import { CheckCircle } from "lucide-react";
import { saveClienteProfile } from "@/app/dashboard/mon-profil/actions";
import type { ProfileResult } from "@/app/dashboard/mon-profil/types";
import { SubmitButton } from "@/components/submit-button";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const fieldClass =
  "h-12 w-full rounded-xl2 border border-sable bg-white px-4 text-cacao placeholder:text-cacao/30 transition focus:border-or focus:shadow-focus focus:outline-none";

export function ClienteProfileForm({
  initial,
  email,
}: {
  initial: {
    prenom: string;
    nom: string;
    phone: string;
    birth_day: number | null;
    birth_month: number | null;
  };
  email: string;
}) {
  const [state, action] = useActionState<ProfileResult, FormData>(
    saveClienteProfile,
    null
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-4xl border border-sable bg-white p-5 shadow-soft md:p-6"
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

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cacao/80">
            Jour d&apos;anniversaire
          </span>
          <select
            name="birth_day"
            defaultValue={initial.birth_day ? String(initial.birth_day) : ""}
            className={fieldClass}
          >
            <option value="">Jour</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cacao/80">
            Mois d&apos;anniversaire
          </span>
          <select
            name="birth_month"
            defaultValue={initial.birth_month ? String(initial.birth_month) : ""}
            className={fieldClass}
          >
            <option value="">Mois</option>
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-cacao/80">
          Email
        </span>
        <input
          value={email}
          disabled
          className="h-12 w-full rounded-xl2 border border-sable bg-sable/20 px-4 text-cacao/60"
        />
        <span className="mt-1 block text-xs text-cacao/40">
          L&apos;email ne peut pas être modifié ici.
        </span>
      </label>

      {state?.error && (
        <p className="rounded-xl2 bg-rose/60 px-4 py-2.5 text-sm text-cacao">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="flex items-center gap-1.5 rounded-xl2 bg-green-50 px-4 py-2.5 text-sm text-green-700">
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
      <input {...props} className={fieldClass} />
    </label>
  );
}
