import Link from "next/link";
import type { ModelItem } from "@/lib/models";

export function ModelCard({ m }: { m: ModelItem }) {
  return (
    <div className="overflow-hidden rounded-xl2 border border-sable bg-white shadow-soft">
      <Link
        href={`/zuriste/${m.providerSlug}`}
        className="block aspect-square bg-rose/30"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={m.image}
          alt={m.serviceName}
          className="h-full w-full object-cover"
        />
      </Link>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{m.serviceName}</p>
        <p className="truncate text-xs text-cacao/60">
          dès {m.price.toLocaleString("fr-FR")} FCFA · {m.providerName}
        </p>
        <Link
          href={`/zuriste/${m.providerSlug}/rdv?service=${m.serviceId}`}
          className="mt-2 block rounded-xl2 bg-or px-3 py-2 text-center text-sm font-medium text-cacao transition hover:bg-or-clair"
        >
          Choisir ce modèle
        </Link>
      </div>
    </div>
  );
}
