import Link from "next/link";
import type { ModelItem } from "@/lib/models";

export function ModelCard({ m }: { m: ModelItem }) {
  return (
    <div className="group overflow-hidden rounded-xl2 border border-sable bg-white transition duration-250 ease-soft hover:shadow-card">
      <Link
        href={`/zuriste/${m.providerSlug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-rose/30"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={m.image}
          alt={m.serviceName}
          className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.05]"
        />
        {m.sponsored && (
          <span className="absolute left-2 top-2 rounded-full bg-cacao/75 px-2 py-0.5 text-[10px] font-medium text-ivoire shadow-soft backdrop-blur">
            Mise en avant
          </span>
        )}
      </Link>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-cacao">
          {m.serviceName}
        </p>
        <p className="truncate text-xs text-cacao/55">
          dès {m.price.toLocaleString("fr-FR")} FCFA · {m.providerName}
        </p>
        <Link
          href={`/zuriste/${m.providerSlug}/rdv?service=${m.serviceId}`}
          className="mt-2.5 block rounded-xl2 bg-cacao px-3 py-2 text-center text-sm font-medium text-ivoire transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
        >
          Choisir ce modèle
        </Link>
      </div>
    </div>
  );
}
