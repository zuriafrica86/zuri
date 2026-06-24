import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { ProviderCard } from "@/components/provider-card";
import { SearchFilters } from "@/components/search-filters";

interface ServiceRow {
  price_min: number;
  price_max: number | null;
  category: string;
}
interface ProviderRow {
  id: string;
  business_name: string;
  profile_photo: string | null;
  ville: string;
  quartier: string;
  dispo: string;
  verified: boolean;
  rating_avg: number;
  rating_count: number;
  services: ServiceRow[] | null;
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : "";
  const ville = str(sp.ville);
  const quartier = str(sp.quartier);
  const dispo = str(sp.dispo);
  const category = str(sp.category);
  const prix = str(sp.prix);
  const maxPrice = prix ? parseInt(prix, 10) : null;

  const supabase = await createClient();
  let query = supabase
    .from("providers")
    .select(
      "id, business_name, profile_photo, ville, quartier, dispo, verified, rating_avg, rating_count, services(price_min, price_max, category)"
    )
    .eq("status", "approved");
  if (ville) query = query.ilike("ville", `%${ville}%`);
  if (quartier) query = query.ilike("quartier", `%${quartier}%`);
  if (dispo) query = query.eq("dispo", dispo);

  const { data } = await query.order("rating_avg", { ascending: false });
  const rows = (data as ProviderRow[] | null) ?? [];

  let providers = rows.map((p) => {
    const servs = p.services ?? [];
    const minPrice = servs.length
      ? Math.min(...servs.map((s) => s.price_min))
      : null;
    const categories = servs.map((s) => s.category);
    return { ...p, minPrice, categories };
  });
  if (category)
    providers = providers.filter((p) => p.categories.includes(category));
  if (maxPrice != null && !Number.isNaN(maxPrice))
    providers = providers.filter(
      (p) => p.minPrice != null && p.minPrice <= maxPrice
    );

  return (
    <main className="min-h-screen">
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
            Devenir coiffeuse
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="font-display text-3xl">Trouve ta coiffeuse</h1>
        <SearchFilters current={{ ville, quartier, dispo, category, prix }} />

        <p className="mt-6 text-sm text-cacao/60">
          {providers.length} coiffeuse{providers.length > 1 ? "s" : ""}
        </p>

        {providers.length === 0 ? (
          <div className="mt-4 rounded-xl2 border border-dashed border-sable bg-white p-10 text-center text-cacao/50">
            Aucune coiffeuse ne correspond. Essaie d&apos;élargir tes filtres.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
