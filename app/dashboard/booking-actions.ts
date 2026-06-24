"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function confirmBooking(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("booking_id") || "");
  if (id) {
    await supabase.from("bookings").update({ status: "confirme" }).eq("id", id);
  }
  revalidatePath("/dashboard/rdv");
}

export async function refuseBooking(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("booking_id") || "");
  if (id) {
    await supabase.from("bookings").update({ status: "refuse" }).eq("id", id);
  }
  revalidatePath("/dashboard/rdv");
}
