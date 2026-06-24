"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestBooking } from "@/app/coiffeuse/booking-actions";
import type { BookingResult } from "@/app/coiffeuse/booking-types";
import { SubmitButton } from "@/components/submit-button";

export interface RdvService {
  id: string;
  name: string;
  price_min: number;
  price_max: number | null;
}

export function RdvForm({
  providerId,
  services,
}: {
  providerId: string;
  services: RdvService[];
}) {
  const [state, action] = useActionState<BookingResult, FormData>(
    requestBooking,
    null
  );

  if (state?.ok) {
    return (
      <div className="mt-6 rounded-xl2 border border-sable bg-white p-6 text-center">
        <p className="text-3xl">✅</p>
        <h2 className="mt-2 font-display text-xl">Demande envoyée !</h2>
        <p className="mt-2 text-cacao/70">
          La Zuriste va confirmer ton rendez-vous. Tu recevras son contact
          WhatsApp dès qu&apos;elle aura accepté.
        </p>
        <Link
          href="/recherche"
          className="mt-4 inline-block rounded-xl2 bg-or px-4 py-2 font-medium text-cacao hover:bg-or-clair"
        >
          Découvrir d&apos;autres Zuristes →
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="provider_id" value={providerId} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-cacao/80">
          Prestation (optionnel)
        </span>
        <select
          name="service_id"
          defaultValue=""
          className="w-full rounded-xl2 border border-sable bg-white px-4 py-3"
        >
          <option value="">— Choisir —</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — dès {s.price_min.toLocaleString("fr-FR")} FCFA
            </option>
          ))}
        </select>
      </label>

      <Field label="Date souhaitée" name="date_souhaitee" type="date" required />
      <Field label="Heure (optionnel)" name="heure_souhaitee" type="time" />
      <Textarea
        label="Un mot pour la Zuriste (optionnel)"
        name="note"
        placeholder="Ex : box braids longueur taille, plutôt le week-end"
      />

      {state?.error && (
        <p className="rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao">
          {state.error}
        </p>
      )}

      <SubmitButton>Envoyer la demande</SubmitButton>
      <p className="text-center text-xs text-cacao/50">
        🔒 Le numéro de la Zuriste te sera communiqué une fois le RDV confirmé.
      </p>
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
        className="w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao focus:border-or"
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
