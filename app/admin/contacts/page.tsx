import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface ContactEvent {
  id: string;
  channel: string | null;
  created_at: string;
  cliente_id: string | null;
  providers: { business_name: string } | null;
}

export default async function AdminContactsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("contact_events")
    .select("id, channel, created_at, cliente_id, providers(business_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const events = (data as ContactEvent[] | null) ?? [];

  const clienteIds = [
    ...new Set(events.map((e) => e.cliente_id).filter(Boolean) as string[]),
  ];
  let names: Record<string, string> = {};
  if (clienteIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", clienteIds);
    names = Object.fromEntries(
      ((profs as { id: string; full_name: string }[] | null) ?? []).map((p) => [
        p.id,
        p.full_name,
      ])
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Contacts</h1>
      <p className="mt-1 text-sm text-cacao/60">
        Les mises en relation WhatsApp — ton signal de conversion ({events.length})
      </p>

      {events.length === 0 ? (
        <p className="mt-6 text-sm text-cacao/50">Aucun contact pour l&apos;instant.</p>
      ) : (
        <ul className="mt-6 divide-y divide-sable rounded-xl2 border border-sable bg-white">
          {events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-4 py-3">
              <MessageCircle className="h-4 w-4 text-cacao/50" aria-hidden />
              <span className="flex-1 text-sm">
                {e.cliente_id ? names[e.cliente_id] ?? "Cliente" : "Cliente"}{" "}
                <span className="text-cacao/40">→</span>{" "}
                <span className="font-medium">
                  {e.providers?.business_name ?? "Zuriste"}
                </span>
              </span>
              <span className="shrink-0 text-xs text-cacao/40">
                {fmt(e.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}
