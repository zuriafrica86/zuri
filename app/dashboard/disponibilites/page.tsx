import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { saveAvailability } from "./actions";

const DAYS = [
  { d: 1, label: "Lundi" },
  { d: 2, label: "Mardi" },
  { d: 3, label: "Mercredi" },
  { d: 4, label: "Jeudi" },
  { d: 5, label: "Vendredi" },
  { d: 6, label: "Samedi" },
  { d: 0, label: "Dimanche" },
];

interface Slot {
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
}

export default async function DisponibilitesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "prestataire") redirect("/dashboard");

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const existing: Record<number, { start: string; end: string }> = {};
  if (provider) {
    const { data } = await supabase
      .from("availability")
      .select("day_of_week, start_time, end_time")
      .eq("provider_id", provider.id);
    for (const r of (data as Slot[] | null) ?? []) {
      existing[r.day_of_week] = {
        start: (r.start_time ?? "09:00").slice(0, 5),
        end: (r.end_time ?? "18:00").slice(0, 5),
      };
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl">Mes disponibilités</h1>
        <p className="mt-1 text-sm text-cacao/60">
          Coche les jours où tu souhaites être disponible et indique tes
          horaires. Ils apparaîtront sur ton profil.
        </p>
      </div>

      {!provider ? (
        <div className="rounded-xl2 border border-sable bg-white p-5">
          <p className="text-cacao/70">
            Tu dois d&apos;abord créer ton profil.
          </p>
        </div>
      ) : (
        <form
          action={saveAvailability}
          className="space-y-3 rounded-xl2 border border-sable bg-white p-5"
        >
          {DAYS.map(({ d, label }) => {
            const has = d in existing;
            const start = existing[d]?.start ?? "09:00";
            const end = existing[d]?.end ?? "18:00";
            return (
              <div
                key={d}
                className="flex flex-wrap items-center gap-3 border-b border-sable pb-3 last:border-0 last:pb-0"
              >
                <label className="flex w-32 items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name={`day_${d}`}
                    value="1"
                    defaultChecked={has}
                    className="h-4 w-4 rounded border-sable accent-or"
                  />
                  {label}
                </label>
                <div className="flex items-center gap-2 text-sm text-cacao/70">
                  <input
                    type="time"
                    name={`start_${d}`}
                    defaultValue={start}
                    className="rounded-xl2 border border-sable bg-white px-3 py-1.5"
                  />
                  <span>à</span>
                  <input
                    type="time"
                    name={`end_${d}`}
                    defaultValue={end}
                    className="rounded-xl2 border border-sable bg-white px-3 py-1.5"
                  />
                </div>
              </div>
            );
          })}
          <SubmitButton>Enregistrer mes disponibilités</SubmitButton>
        </form>
      )}
    </>
  );
}
