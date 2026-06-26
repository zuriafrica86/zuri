"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "@/app/auth/actions";
import type { ActionResult } from "@/app/auth/types";
import { SubmitButton } from "@/components/submit-button";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, action] = useActionState<ActionResult, FormData>(login, null);
  const params = useSearchParams();
  const justVerified = params.get("verifie") === "1";

  return (
    <div>
      <h2 className="font-display text-2xl">Bon retour</h2>
      <p className="mt-2 text-sm text-cacao/60">Connecte-toi à ton espace ZURI.</p>

      {justVerified && (
        <p className="mt-6 rounded-xl2 bg-rose/50 px-4 py-3 text-sm text-cacao">
          Compte créé. Vérifie ta boîte mail pour confirmer, puis connecte-toi.
        </p>
      )}

      <form action={action} className="mt-6 space-y-3">
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        {state?.error && (
          <p className="rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao">
            {state.error}
          </p>
        )}

        <SubmitButton>Se connecter</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-cacao/60">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-or underline-offset-4 hover:underline">
          Créer un compte
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
        className="w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or"
      />
    </label>
  );
}
