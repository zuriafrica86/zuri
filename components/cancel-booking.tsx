"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { cancelBooking } from "@/app/dashboard/booking-actions";
import { reasonsFor, type CancelResult } from "@/lib/cancel-reasons";

export function CancelBooking({
  bookingId,
  role,
}: {
  bookingId: string;
  role: "cliente" | "prestataire";
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [state, action, pending] = useActionState<CancelResult, FormData>(
    cancelBooking,
    {}
  );
  const reasons = reasonsFor(role);

  if (state?.ok) {
    return <p className="mt-3 text-sm text-cacao/50">Rendez-vous annulé.</p>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 rounded-xl2 border border-sable px-4 py-2 text-sm font-medium text-cacao/70 transition hover:bg-rose/30"
      >
        Annuler le RDV
      </button>
    );
  }

  return (
    <form
      action={action}
      className="mt-3 space-y-3 rounded-xl2 border border-sable bg-rose/20 p-3"
    >
      <input type="hidden" name="booking_id" value={bookingId} />
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-cacao">
          Pourquoi annules-tu ce RDV ?
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer"
          className="text-cacao/40 hover:text-cacao"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        {reasons.map((r) => (
          <label
            key={r.key}
            className="flex cursor-pointer items-start gap-2 text-sm text-cacao/80"
          >
            <input
              type="radio"
              name="reason"
              value={r.key}
              checked={selected === r.key}
              onChange={() => setSelected(r.key)}
              className="mt-0.5 accent-or"
            />
            {r.label}
          </label>
        ))}
      </div>

      {selected === "autre" && (
        <textarea
          name="autre"
          rows={2}
          placeholder="Précise ton motif"
          className="w-full rounded-xl2 border border-sable bg-white px-3 py-2 text-sm text-cacao placeholder:text-cacao/30 focus:border-or"
        />
      )}

      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!selected || pending}
          className="rounded-xl2 bg-cacao px-4 py-2 text-sm font-medium text-ivoire transition hover:bg-cacao/90 disabled:opacity-50"
        >
          {pending ? "Annulation…" : "Confirmer l'annulation"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl2 border border-sable px-4 py-2 text-sm text-cacao/70 hover:bg-rose/30"
        >
          Retour
        </button>
      </div>
    </form>
  );
}
