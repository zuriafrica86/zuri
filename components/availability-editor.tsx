"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { saveAvailability } from "@/app/dashboard/disponibilites/actions";

type Range = { start: string; end: string };
type DayState = Record<number, Range[]>;

const DAYS = [
  { d: 1, label: "Lundi" },
  { d: 2, label: "Mardi" },
  { d: 3, label: "Mercredi" },
  { d: 4, label: "Jeudi" },
  { d: 5, label: "Vendredi" },
  { d: 6, label: "Samedi" },
  { d: 0, label: "Dimanche" },
];

export function AvailabilityEditor({ initial }: { initial: DayState }) {
  const [days, setDays] = useState<DayState>(initial);

  function addRange(d: number) {
    setDays((prev) => {
      const ranges = prev[d] ?? [];
      const last = ranges[ranges.length - 1];
      const next = last ? { start: last.end, end: "" } : { start: "09:00", end: "18:00" };
      return { ...prev, [d]: [...ranges, next] };
    });
  }

  function removeRange(d: number, i: number) {
    setDays((prev) => ({
      ...prev,
      [d]: (prev[d] ?? []).filter((_, idx) => idx !== i),
    }));
  }

  function updateRange(d: number, i: number, field: keyof Range, value: string) {
    setDays((prev) => ({
      ...prev,
      [d]: (prev[d] ?? []).map((r, idx) =>
        idx === i ? { ...r, [field]: value } : r
      ),
    }));
  }

  return (
    <form
      action={saveAvailability}
      className="space-y-2.5 rounded-xl2 border border-sable bg-white p-5"
    >
      <input type="hidden" name="payload" value={JSON.stringify(days)} />

      {DAYS.map(({ d, label }) => {
        const ranges = days[d] ?? [];
        return (
          <div
            key={d}
            className="border-b border-sable py-3 first:pt-0 last:border-0 last:pb-0"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-cacao">{label}</span>
              <button
                type="button"
                onClick={() => addRange(d)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-or hover:bg-or/10"
              >
                <Plus className="h-4 w-4" aria-hidden /> Ajouter une plage
              </button>
            </div>

            {ranges.length === 0 ? (
              <p className="mt-1 text-sm text-cacao/40">Indisponible ce jour</p>
            ) : (
              <div className="mt-2 space-y-2">
                {ranges.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={r.start}
                      onChange={(e) =>
                        updateRange(d, i, "start", e.target.value)
                      }
                      className="rounded-xl2 border border-sable bg-white px-3 py-1.5 text-cacao"
                    />
                    <span className="text-cacao/60">à</span>
                    <input
                      type="time"
                      value={r.end}
                      onChange={(e) => updateRange(d, i, "end", e.target.value)}
                      className="rounded-xl2 border border-sable bg-white px-3 py-1.5 text-cacao"
                    />
                    <button
                      type="button"
                      onClick={() => removeRange(d, i)}
                      aria-label="Retirer cette plage"
                      className="ml-1 rounded-lg p-1.5 text-cacao/40 hover:bg-rose/30 hover:text-cacao"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-1">
        <SubmitButton>Enregistrer mes disponibilités</SubmitButton>
      </div>
    </form>
  );
}
