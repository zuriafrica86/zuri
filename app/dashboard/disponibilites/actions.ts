"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

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

  const rows: {
    provider_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[] = [];
  for (const d of DAYS) {
    if (!formData.get(`day_${d}`)) continue;
    const start = String(formData.get(`start_${d}`) || "").trim();
    const end = String(formData.get(`end_${d}`) || "").trim();
    if (!start || !end) continue;
    rows.push({
      provider_id: provider.id,
      day_of_week: d,
      start_time: start,
      end_time: end,
    });
  }

  // On remplace l'ensemble des créneaux à chaque enregistrement.
  const admin = createAdminClient();
  await admin.from("availability").delete().eq("provider_id", provider.id);
  if (rows.length > 0) await admin.from("availability").insert(rows);

  revalidatePath("/dashboard/disponibilites");
}
