// Ancienne URL conservée en redirection vers la nouvelle URL SEO /zuriste/[slug].
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LegacyProfileRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("providers")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (!data?.slug) notFound();
  redirect(`/zuriste/${data.slug}`);
}
