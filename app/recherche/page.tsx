import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { ProviderCard } from "@/components/provider-card";
import { SearchFilters } from "@/components/search-filters";

interface ServiceRow {
  price_min: number;
  price_max: number | null;
  univers: string | null;
  categorie: string | null;
}
interface ProviderRow {
  id: string;
  business_name: string;
  profile_photo: string | null;
  ville: string;
  quartier: string | null;
  dispo: string;
  lieu: string | null;
  verified: boolean;
  ambassadrice: boolean;
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
  const univers = str(sp.univers);
  const categorie = str(sp.categorie);
  const lieu = str(sp.lieu);
  const prix = str(sp.prix);
  const maxPrice = prix ? parseInt(prix, 10) : null;

  const supabase = await createClient();
  let query = supabase
    .from("providers")
    .select(
      "id, business_name, profile_photo, ville, quartier, dispo, lieu, verified, ambassadrice, rating_avg, rating_count, services(price_min, price_max, univers, categorie)"
    )
    .eq("status", "approved")
    .neq("dispo", "masque"); // les profils masqués n'apparaissent jamais
  if (ville) query = query.ilike("ville", `%${ville}%`);

  const { data } = await query.order("rating_avg", { ascending: false });
  const rows = (data as ProviderRow[] | null) ?? [];

  let providers = rows.map((p) => {
    const servs = p.services ?? [];
    const minPrice = servs.length
      ? Math.min(...servs.map((s) => s.price_min))
      : null;
    return { ...p, minPrice, servs };
  });

  // Filtre univers / catégorie (la Zuriste a au moins un service correspondant)
  if (univers)
    providers = providers.filter((p) =>
      p.servs.some(
        (s) =>
          s.univers === univers &&
          (!categorie || s.categorie === categorie)
      )
    );

  // Filtre lieu (les_deux satisfait les deux demandes)
  if (lieu === "chez_zuriste")
    providers = providers.filter(
      (p) => p.lieu === "chez_zuriste" || p.lieu === "les_deux"
    );
  if (lieu === "chez_cliente")
    providers = providers.filter(
      (p) => p.lieu === "chez_cliente" || p.lieu === "les_deux"
    );

  // Filtre prix
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
            Devenir Zuriste
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="font-display text-3xl">Trouve ta Zuriste</h1>
        <SearchFilters current={{ ville, univers, categorie, lieu, prix }} />

        <p className="mt-6 text-sm text-cacao/60">
          {providers.length} Zuriste{providers.length > 1 ? "s" : ""}
        </p>

        {providers.length === 0 ? (
          <div className="mt-4 rounded-xl2 border border-dashed border-sable bg-white p-10 text-center text-cacao/50">
            Aucune Zuriste ne correspond. Essaie d&apos;élargir tes filtres.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <ProviderCard
                key={p.id}
                provider={{
                  id: p.id,
                  business_name: p.business_name,
                  profile_photo: p.profile_photo,
                  ville: p.ville,
                  quartier: p.quartier ?? "",
                  dispo: p.dispo,
                  verified: p.verified,
                  ambassadrice: p.ambassadrice,
                  rating_avg: p.rating_avg,
                  rating_count: p.rating_count,
                  minPrice: p.minPrice,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
