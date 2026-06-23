"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl2 bg-or px-5 py-3 font-medium text-cacao shadow-soft transition hover:bg-or-clair disabled:opacity-60"
    >
      {pending ? "Un instant…" : children}
    </button>
  );
}
