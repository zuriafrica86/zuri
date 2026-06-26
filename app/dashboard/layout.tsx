import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  const role = profile?.role ?? "cliente";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar role={role} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-end border-b border-sable px-6 py-3">
          <LogoutButton />
        </header>
        <main className="mx-auto max-w-3xl px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
