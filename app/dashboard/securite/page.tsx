import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function SecuritePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl">Sécurité</h1>
          <Link
            href="/dashboard"
            className="text-sm text-cacao/60 hover:text-cacao"
          >
            ← Retour
          </Link>
        </div>
        <ChangePasswordForm />
      </>
  );
}
