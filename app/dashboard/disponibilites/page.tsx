import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityEditor } from "@/components/availability-editor";

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

  const initial: Record<number, { start: string; end: string }[]> = {};
  if (provider) {
    const { data } = await supabase
      .from("availability")
      .select("day_of_week, start_time, end_time")
      .eq("provider_id", provider.id)
      .order("start_time");
    for (const r of (data as Slot[] | null) ?? []) {
      (initial[r.day_of_week] ??= []).push({
        start: (r.start_time ?? "09:00").slice(0, 5),
        end: (r.end_time ?? "18:00").slice(0, 5),
      });
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl">Mes disponibilités</h1>
        <p className="mt-1 text-sm text-cacao/60">
          Ajoute une ou plusieurs plages horaires par jour (par exemple 9h–12h
          et 14h–18h). Elles apparaîtront sur ton profil.
        </p>
      </div>

      {!provider ? (
        <div className="rounded-xl2 border border-sable bg-white p-5">
          <p className="text-cacao/70">Tu dois d&apos;abord créer ton profil.</p>
        </div>
      ) : (
        <AvailabilityEditor initial={initial} />
      )}
    </>
  );
}
