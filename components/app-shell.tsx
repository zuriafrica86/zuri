import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { LogoutButton } from "@/components/logout-button";
import { Logo } from "@/components/logo";

// Coquille d'application : barre latérale quand l'utilisateur est connecté,
// en-tête public simple sinon. Utilisée par le dashboard et les pages
// de navigation (recherche, bibliothèque) pour garder la sidebar partout.
export async function AppShell({
  children,
  requireAuth = false,
  maxWidth = "3xl",
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
  maxWidth?: "3xl" | "5xl";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && requireAuth) redirect("/login");

  const mw = maxWidth === "5xl" ? "max-w-5xl" : "max-w-3xl";

  if (!user) {
    return (
      <div className="min-h-screen">
        <header className="flex items-center justify-between border-b border-sable px-6 py-4">
          <Logo />
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-cacao/70 hover:text-cacao">
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-xl2 bg-cacao px-4 py-2 font-medium text-ivoire hover:bg-cacao/90"
            >
              Devenir Zuriste
            </Link>
          </nav>
        </header>
        <main className={`mx-auto ${mw} px-6 py-6`}>{children}</main>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role ?? "cliente";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar role={role} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-end border-b border-sable px-6 py-3">
          <LogoutButton />
        </header>
        <main className={`mx-auto ${mw} px-6 py-6`}>{children}</main>
      </div>
    </div>
  );
}
