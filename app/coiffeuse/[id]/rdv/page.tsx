// Ancienne URL conservée en redirection vers /zuriste/[slug]/rdv.
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LegacyRdvRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { id } = await params;
  const { service } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("providers")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (!data?.slug) notFound();
  const q = service ? `?service=${service}` : "";
  redirect(`/zuriste/${data.slug}/rdv${q}`);
}
