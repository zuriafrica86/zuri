import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { ConfirmButton } from "@/components/confirm-button";
import {
  approveProvider,
  rejectProvider,
  deleteUser,
} from "@/app/admin/actions";

interface PendingProvider {
  id: string;
  business_name: string;
  ville: string;
  quartier: string;
  profile_photo: string | null;
}
interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/dashboard");

  // Statistiques
  const { count: approvedCount } = await supabase
    .from("providers")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");
  const { count: pendingCount } = await supabase
    .from("providers")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  const { count: clientesCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "cliente");
  const { count: contactsCount } = await supabase
    .from("contact_events")
    .select("*", { count: "exact", head: true });

  // À valider
  const { data: pendingData } = await supabase
    .from("providers")
    .select("id, business_name, ville, quartier, profile_photo")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const pending = (pendingData as PendingProvider[] | null) ?? [];

  // Tous les comptes
  const { data: usersData } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("created_at", { ascending: false });
  const users = (usersData as UserRow[] | null) ?? [];

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-sable px-6 py-4">
        <Logo />
        <LogoutButton />
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl">Administration</h1>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Coiffeuses actives" value={approvedCount ?? 0} />
          <Stat label="En attente" value={pendingCount ?? 0} />
          <Stat label="Clientes" value={clientesCount ?? 0} />
          <Stat label="Contacts" value={contactsCount ?? 0} />
        </div>

        {/* À valider */}
        <section className="mt-10">
          <h2 className="font-display text-xl">
            À valider {pending.length > 0 && `(${pending.length})`}
          </h2>
          {pending.length === 0 ? (
            <p className="mt-2 text-sm text-cacao/50">
              Aucune coiffeuse en attente.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {pending.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl2 border border-sable bg-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-rose/40">
                      {p.profile_photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.profile_photo}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="font-medium">{p.business_name}</p>
                      <p className="text-sm text-cacao/60">
                        {p.quartier}, {p.ville}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <form action={approveProvider}>
                      <input type="hidden" name="provider_id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-xl2 bg-or px-3 py-2 text-sm font-medium text-cacao hover:bg-or-clair"
                      >
                        Valider
                      </button>
                    </form>
                    <form action={rejectProvider}>
                      <input type="hidden" name="provider_id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-xl2 border border-sable px-3 py-2 text-sm text-cacao/70 hover:bg-rose/30"
                      >
                        Refuser
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Comptes */}
        <section className="mt-10">
          <h2 className="font-display text-xl">Tous les comptes</h2>
          <ul className="mt-3 divide-y divide-sable rounded-xl2 border border-sable bg-white">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.full_name}</p>
                  <p className="truncate text-sm text-cacao/60">
                    {u.email ?? "—"} ·{" "}
                    <span className="uppercase tracking-wide text-or">
                      {u.role}
                    </span>
                  </p>
                </div>
                {u.role !== "admin" && (
                  <form action={deleteUser}>
                    <input type="hidden" name="user_id" value={u.id} />
                    <ConfirmButton
                      message={`Supprimer définitivement le compte de ${u.full_name} et toutes ses données ?`}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      Supprimer
                    </ConfirmButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl2 border border-sable bg-white p-4 text-center">
      <p className="font-display text-3xl text-cacao">{value}</p>
      <p className="mt-1 text-xs text-cacao/60">{label}</p>
    </div>
  );
}
