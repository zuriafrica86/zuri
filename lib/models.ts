import { createClient } from "@/lib/supabase/server";

export interface ModelItem {
  id: string;
  image: string;
  serviceId: string;
  serviceName: string;
  price: number;
  univers: string | null;
  categorie: string | null;
  providerId: string;
  providerName: string;
}

type Rel<T> = T | T[] | null;
interface RawRow {
  id: string;
  image_url: string;
  image_url_after: string | null;
  type: string;
  service_id: string;
  services: Rel<{
    id: string;
    name: string;
    price_min: number;
    univers: string | null;
    categorie: string | null;
  }>;
  providers: Rel<{ id: string; business_name: string }>;
}

function one<T>(rel: Rel<T>): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

// Photos de portfolio reliées à une prestation, issues de Zuristes
// validées et visibles. Sert à la Bibliothèque de modèles.
export async function fetchModels(opts?: {
  univers?: string;
  limit?: number;
}): Promise<ModelItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("portfolio_photos")
    .select(
      `id, image_url, image_url_after, type, service_id,
       services!inner ( id, name, price_min, univers, categorie ),
       providers!inner ( id, business_name, status, dispo, credit_paused )`
    )
    .not("service_id", "is", null)
    .eq("providers.status", "approved")
    .neq("providers.dispo", "masque")
    .eq("providers.credit_paused", false)
    .order("created_at", { ascending: false });

  if (opts?.univers) q = q.eq("services.univers", opts.univers);
  if (opts?.limit) q = q.limit(opts.limit);

  const { data } = await q;
  const rows = (data as unknown as RawRow[] | null) ?? [];

  return rows
    .map((r): ModelItem | null => {
      const svc = one(r.services);
      const prov = one(r.providers);
      if (!svc || !prov) return null;
      const image =
        r.type === "avant_apres" && r.image_url_after
          ? r.image_url_after
          : r.image_url;
      return {
        id: r.id,
        image,
        serviceId: svc.id,
        serviceName: svc.name,
        price: svc.price_min,
        univers: svc.univers,
        categorie: svc.categorie,
        providerId: prov.id,
        providerName: prov.business_name,
      };
    })
    .filter((m): m is ModelItem => m !== null);
}
