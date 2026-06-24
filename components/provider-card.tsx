import Link from "next/link";

export interface CardProvider {
  id: string;
  business_name: string;
  profile_photo: string | null;
  ville: string;
  quartier: string;
  dispo: string;
  verified: boolean;
  ambassadrice: boolean;
  rating_avg: number;
  rating_count: number;
  minPrice: number | null;
}

const dispoLabel: Record<string, string> = {
  disponible: "🟢 Disponible",
  indisponible: "⚪ Indisponible",
};

export function ProviderCard({ provider: p }: { provider: CardProvider }) {
  return (
    <Link
      href={`/coiffeuse/${p.id}`}
      className="group block overflow-hidden rounded-xl2 border border-sable bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-rose/30">
        {p.profile_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.profile_photo}
            alt={p.business_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-2xl text-cacao/20">
            ZURI
          </div>
        )}
        {p.ambassadrice && (
          <span className="absolute left-2 top-2 rounded-full bg-or px-2 py-0.5 text-xs font-medium text-cacao shadow-soft">
            ✨ Ambassadrice
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-medium">{p.business_name}</h3>
          {p.verified && (
            <span className="shrink-0 text-xs text-or">✔ Vérifiée</span>
          )}
        </div>
        <p className="text-sm text-cacao/60">
          {p.quartier ? `${p.quartier}, ` : ""}
          {p.ville}
        </p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-cacao/70">
            {p.rating_count > 0
              ? `⭐ ${p.rating_avg.toFixed(1)} (${p.rating_count})`
              : "Nouvelle"}
          </span>
          {p.minPrice != null && (
            <span className="font-medium text-cacao">
              dès {p.minPrice.toLocaleString("fr-FR")} FCFA
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-cacao/50">{dispoLabel[p.dispo] ?? ""}</p>
      </div>
    </Link>
  );
}
