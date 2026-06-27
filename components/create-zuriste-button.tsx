"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { CreateZuristeForm } from "@/components/create-zuriste-form";

export function CreateZuristeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl2 bg-cacao px-4 py-2.5 text-sm font-medium text-ivoire transition hover:bg-cacao/90"
      >
        <UserPlus className="h-4 w-4" aria-hidden /> Créer une Zuriste
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-cacao/30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-sable px-5 py-4">
              <h2 className="font-display text-xl text-cacao">
                Créer une Zuriste
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-cacao/50 hover:bg-rose/30"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="px-5 py-4">
              <CreateZuristeForm embedded />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
