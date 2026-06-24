"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup } from "@/app/auth/actions";
import type { ActionResult } from "@/app/auth/types";
import { SubmitButton } from "@/components/submit-button";

export default function SignupPage() {
  const [state, action] = useActionState<ActionResult, FormData>(signup, null);
  const [role, setRole] = useState<"cliente" | "prestataire">("cliente");

  return (
    <div>
      <h2 className="font-display text-3xl">Créer un compte</h2>
      <p className="mt-2 text-sm text-cacao/60">
        Quelques infos et c&apos;est parti.
      </p>

      {/* Choix du rôle */}
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl2 bg-rose/40 p-1">
        {(["cliente", "prestataire"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-xl2 px-3 py-2 text-sm font-medium transition ${
              role === r ? "bg-ivoire text-cacao shadow-soft" : "text-cacao/60"
            }`}
          >
            {r === "cliente" ? "Je suis cliente" : "Je suis Zuriste"}
          </button>
        ))}
      </div>

      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="role" value={role} />

        <Field label="Nom complet" name="full_name" type="text" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Téléphone (WhatsApp)"
          name="phone"
          type="tel"
          placeholder="074 00 00 00"
          autoComplete="tel"
        />
        <Field
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />

        {state?.error && (
          <p className="rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao">
            {state.error}
          </p>
        )}

        <SubmitButton>Créer mon compte</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-cacao/60">
        Déjà inscrite ?{" "}
        <Link href="/login" className="font-medium text-or underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cacao/80">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl2 border border-sable bg-ivoire px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or"
      />
    </label>
  );
}
