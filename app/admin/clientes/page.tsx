import { createClient } from "@/lib/supabase/server";

interface Cliente {
  id: string;
  full_name: string;
  email: string | null;
  created_at: string;
}

export default async function AdminClientesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at")
    .eq("role", "cliente")
    .order("created_at", { ascending: false });
  const clientes = (data as Cliente[] | null) ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl">Clientes</h1>
      <p className="mt-1 text-sm text-cacao/60">
        Comptes clientes ({clientes.length})
      </p>

      {clientes.length === 0 ? (
        <p className="mt-6 text-sm text-cacao/50">Aucune cliente inscrite.</p>
      ) : (
        <ul className="mt-6 divide-y divide-sable rounded-xl2 border border-sable bg-white">
          {clientes.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.full_name}</p>
                <p className="truncate text-sm text-cacao/60">{c.email ?? "—"}</p>
              </div>
              <span className="shrink-0 text-xs text-cacao/40">
                {new Date(c.created_at).toLocaleDateString("fr-FR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
