"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { confirmPrestation } from "@/app/dashboard/booking-actions";

export function ConfirmPrestation({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-xl2 bg-or px-4 py-2.5 text-sm font-medium text-cacao hover:bg-or-clair"
      >
        Confirmer la prestation
      </button>
    );
  }

  return (
    <form
      action={confirmPrestation}
      className="mt-3 space-y-3 rounded-xl2 border border-sable bg-ivoire/40 p-3"
    >
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />

      <p className="text-sm font-medium text-cacao">
        Comment s&apos;est passée ta prestation ?{" "}
        <span className="text-cacao/50">(note facultative)</span>
      </p>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          >
            <Star
              className={
                n <= rating
                  ? "h-7 w-7 fill-or text-or"
                  : "h-7 w-7 text-cacao/30"
              }
              aria-hidden
            />
          </button>
        ))}
      </div>

      <textarea
        name="comment"
        rows={2}
        placeholder="Un mot sur ton expérience (facultatif)"
        className="w-full rounded-xl2 border border-sable bg-white px-3 py-2 text-sm text-cacao placeholder:text-cacao/30 focus:border-or"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-xl2 bg-cacao px-4 py-2 text-sm font-medium text-ivoire hover:bg-cacao/90"
        >
          Confirmer
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl2 border border-sable px-4 py-2 text-sm text-cacao/70 hover:bg-rose/30"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
