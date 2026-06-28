import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";

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
  const disponible = p.dispo === "disponible";
  return (
    <Link
      href={`/zuriste/${p.slug}`}
      className="group block overflow-hidden rounded-xl2 border border-sable bg-white transition duration-250 ease-soft hover:-translate-y-1 hover:shadow-card"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-rose/30">
        {p.profile_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.profile_photo}
            alt={p.business_name}
            className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl text-cacao/15">
            ZURI
          </div>
        )}

        {p.ambassadrice && (
          <span className="absolute left-2 top-2 rounded-full bg-or px-2.5 py-0.5 text-[11px] font-medium text-cacao shadow-soft">
            Ambassadrice
          </span>
        )}

        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-cacao/80 shadow-soft backdrop-blur">
          <span
            className={`h-2 w-2 rounded-full ${
              disponible ? "bg-green-500" : "bg-cacao/30"
            }`}
            aria-hidden
          />
          {disponible ? "Disponible" : "Indisponible"}
        </span>
      </div>

      <div className="p-3.5">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-medium text-cacao">
            {p.business_name}
          </h3>
          {p.verified && (
            <BadgeCheck
              className="h-4 w-4 shrink-0 text-or"
              aria-label="Vérifiée"
            />
          )}
        </div>
        <p className="truncate text-sm text-cacao/60">
          {p.quartier ? `${p.quartier}, ` : ""}
          {p.ville}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1 text-cacao/70">
            {p.rating_count > 0 ? (
              <>
                <Star className="h-4 w-4 fill-or text-or" aria-hidden />
                {p.rating_avg.toFixed(1)}
                <span className="text-cacao/40">({p.rating_count})</span>
              </>
            ) : (
              <span className="text-cacao/50">Nouvelle</span>
            )}
          </span>
          {p.minPrice != null && (
            <span className="shrink-0 font-medium text-cacao">
              dès {p.minPrice.toLocaleString("fr-FR")}
              <span className="text-cacao/50"> FCFA</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
