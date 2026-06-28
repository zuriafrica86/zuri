import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { LogoutButton } from "@/components/logout-button";
import { PublicHeader } from "@/components/public-header";

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

  const mw = maxWidth === "5xl" ? "max-w-7xl" : "max-w-5xl";

  if (!user) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <main className={`mx-auto ${mw} px-5 py-7 md:px-8`}>{children}</main>
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
        <header className="sticky top-0 z-20 flex items-center justify-end border-b border-sable/70 bg-white/85 px-5 py-3 backdrop-blur md:px-8">
          <LogoutButton />
        </header>
        <main className={`mx-auto ${mw} px-5 py-7 md:px-8 md:py-9`}>
          {children}
        </main>
      </div>
    </div>
  );
}
