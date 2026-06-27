import Link from "next/link";
import { Sparkles, BadgeCheck, Star, Circle } from "lucide-react";

export interface CardProvider {
  id: string;
  slug: string;
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

export function ProviderCard({ provider: p }: { provider: CardProvider }) {
  return (
    <Link
      href={`/zuriste/${p.slug}`}
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
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-or px-2 py-0.5 text-xs font-medium text-cacao shadow-soft">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Ambassadrice
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-medium">{p.business_name}</h3>
          {p.verified && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-or">
              <BadgeCheck className="h-4 w-4" aria-hidden />
              Vérifiée
            </span>
          )}
        </div>
        <p className="text-sm text-cacao/60">
          {p.quartier ? `${p.quartier}, ` : ""}
          {p.ville}
        </p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-cacao/70">
            {p.rating_count > 0 ? (
              <>
                <Star className="h-4 w-4 text-or" aria-hidden />
                {p.rating_avg.toFixed(1)} ({p.rating_count})
              </>
            ) : (
              "Nouvelle"
            )}
          </span>
          {p.minPrice != null && (
            <span className="font-medium text-cacao">
              dès {p.minPrice.toLocaleString("fr-FR")} FCFA
            </span>
          )}
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-cacao/50">
          <Circle
            className={
              p.dispo === "disponible"
                ? "h-2.5 w-2.5 fill-green-500 text-green-500"
                : "h-2.5 w-2.5 fill-cacao/30 text-cacao/30"
            }
            aria-hidden
          />
          {p.dispo === "disponible" ? "Disponible" : "Indisponible"}
        </p>
      </div>
    </Link>
  );
}
