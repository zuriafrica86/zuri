import { createClient } from "@/lib/supabase/server";

interface Cliente {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export default async function AdminClientesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, email, created_at")
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
        <div className="mt-6 overflow-x-auto rounded-xl2 border border-sable bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-sable text-left text-xs text-cacao/50">
                <th className="px-4 py-2 font-medium">Prénom</th>
                <th className="px-4 py-2 font-medium">Nom</th>
                <th className="px-4 py-2 font-medium">Téléphone</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Inscription</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const parts = (c.full_name || "").trim().split(" ");
                const prenom = parts[0] || "—";
                const nom = parts.slice(1).join(" ") || "—";
                return (
                  <tr
                    key={c.id}
                    className="border-b border-sable/60 last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-cacao">
                      {prenom}
                    </td>
                    <td className="px-4 py-2.5">{nom}</td>
                    <td className="px-4 py-2.5">{c.phone || "—"}</td>
                    <td className="px-4 py-2.5">{c.email || "—"}</td>
                    <td className="px-4 py-2.5 text-cacao/60">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
