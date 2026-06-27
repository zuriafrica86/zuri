"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendHelpMessage } from "@/app/aide/actions";
import type { HelpResult } from "@/app/aide/types";

const SUJETS = [
  "J'ai un souci technique",
  "J'ai un souci avec une Zuriste ou une cliente",
  "Parler à un membre de l'équipe Zuri",
];

const inputCls =
  "w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao placeholder:text-cacao/40 focus:border-or focus:outline-none";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl2 bg-cacao px-5 py-3 font-medium text-ivoire hover:bg-cacao/90 disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Envoi…" : "Envoyer le message"}
    </button>
  );
}

export function HelpForm() {
  const [state, action] = useActionState<HelpResult, FormData>(
    sendHelpMessage,
    {}
  );

  if (state?.ok) {
    return (
      <p className="rounded-xl2 bg-green-100 px-4 py-3 text-sm text-green-800">
        {state.ok}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input name="prenom" placeholder="Prénom" required className={inputCls} />
        <input name="nom" placeholder="Nom" className={inputCls} />
      </div>
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className={inputCls}
      />
      <input
        name="phone"
        type="tel"
        placeholder="Téléphone WhatsApp"
        className={inputCls}
      />
      <select name="sujet" defaultValue={SUJETS[0]} className={inputCls}>
        {SUJETS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <textarea
        name="message"
        rows={5}
        placeholder="Dis-nous tout, on t'écoute…"
        required
        className={inputCls}
      />
      {state?.error && (
        <p className="rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}
