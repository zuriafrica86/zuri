import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function SecuritePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-sable px-6 py-4">
        <Logo />
        <LogoutButton />
      </header>
      <div className="mx-auto max-w-md px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl">Sécurité</h1>
          <Link
            href="/dashboard"
            className="text-sm text-cacao/60 hover:text-cacao"
          >
            ← Retour
          </Link>
        </div>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
