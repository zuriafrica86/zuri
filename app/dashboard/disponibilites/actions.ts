"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Range = { start: string; end: string };

export async function saveAvailability(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!provider) return;

  // Le formulaire envoie un JSON { "1": [{start,end}, ...], "2": [...], ... }
  let parsed: Record<string, Range[]> = {};
  try {
    parsed = JSON.parse(String(formData.get("payload") || "{}"));
  } catch {
    parsed = {};
  }

  const rows: {
    provider_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[] = [];
  for (const [dStr, ranges] of Object.entries(parsed)) {
    const d = parseInt(dStr, 10);
    if (Number.isNaN(d) || d < 0 || d > 6) continue;
    for (const r of ranges ?? []) {
      const start = String(r?.start || "").trim();
      const end = String(r?.end || "").trim();
      if (!start || !end || end <= start) continue;
      rows.push({
        provider_id: provider.id,
        day_of_week: d,
        start_time: start,
        end_time: end,
      });
    }
  }

  // On remplace l'ensemble des créneaux à chaque enregistrement.
  const admin = createAdminClient();
  await admin.from("availability").delete().eq("provider_id", provider.id);
  if (rows.length > 0) await admin.from("availability").insert(rows);

  revalidatePath("/dashboard/disponibilites");
}
