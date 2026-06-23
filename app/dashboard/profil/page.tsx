import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import {
  ProviderProfileForm,
  type ProviderInitial,
} from "@/components/provider-profile-form";

export default async function ProfilPage() {
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

  // Réservé aux coiffeuses.
  if (profile?.role !== "prestataire") redirect("/dashboard");

  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-sable px-6 py-4">
        <Logo />
        <LogoutButton />
      </header>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <ProviderProfileForm
          userId={user.id}
          initial={(provider as ProviderInitial) ?? null}
        />
      </div>
    </main>
  );
}
