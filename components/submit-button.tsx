"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl2 bg-cacao px-5 py-3 font-medium text-ivoire shadow-soft transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "Un instant…" : children}
    </button>
  );
}
