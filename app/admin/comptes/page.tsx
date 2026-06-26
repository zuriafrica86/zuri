import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteUser } from "@/app/admin/actions";

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
}

export default async function AdminComptesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("created_at", { ascending: false });
  const users = (data as UserRow[] | null) ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl">Comptes</h1>
      <p className="mt-1 text-sm text-cacao/60">
        Tous les comptes de la plateforme ({users.length})
      </p>

      <ul className="mt-6 divide-y divide-sable rounded-xl2 border border-sable bg-white">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{u.full_name}</p>
              <p className="truncate text-sm text-cacao/60">
                {u.email ?? "—"} ·{" "}
                <span className="uppercase tracking-wide text-or">{u.role}</span>
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
    </div>
  );
}
