import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  price_min: number;
  price_max: number | null;
  duree_estim: string | null;
  description: string | null;
}
interface PortfolioRow {
  id: string;
  type: string;
  image_url: string;
  image_url_after: string | null;
  caption: string | null;
}
interface ReviewRow {
  rating: number;
  comment: string | null;
  created_at: string;
}

const dispoLabel: Record<string, string> = {
  disponible: "🟢 Disponible cette semaine",
  occupee: "🟠 Actuellement occupée",
  sur_rdv: "Sur rendez-vous",
};

export default async function CoiffeusePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select(
      "id, business_name, bio, profile_photo, ville, quartier, dispo, verified, rating_avg, rating_count"
    )
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!provider) notFound();

  const { data: servicesData } = await supabase
    .from("services")
    .select("*")
    .eq("provider_id", id)
    .order("price_min");
  const { data: portfolioData } = await supabase
    .from("portfolio_photos")
    .select("id, type, image_url, image_url_after, caption")
    .eq("provider_id", id)
    .order("created_at", { ascending: false });
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("provider_id", id)
    .eq("status", "visible")
    .order("created_at", { ascending: false });

  const services = (servicesData as ServiceRow[] | null) ?? [];
  const portfolio = (portfolioData as PortfolioRow[] | null) ?? [];
  const reviews = (reviewsData as ReviewRow[] | null) ?? [];

  const price = (min: number, max: number | null) =>
    max && max > min
      ? `${min.toLocaleString("fr-FR")} – ${max.toLocaleString("fr-FR")}`
      : `dès ${min.toLocaleString("fr-FR")}`;

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-sable px-6 py-4">
        <Logo />
        <Link
          href="/recherche"
          className="text-sm text-cacao/60 hover:text-cacao"
        >
          ← Toutes les coiffeuses
        </Link>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* En-tête */}
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-rose/40">
            {provider.profile_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={provider.profile_photo}
                alt={provider.business_name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl">
                {provider.business_name}
              </h1>
              {provider.verified && (
                <span className="text-sm text-or">✔ Vérifiée</span>
              )}
            </div>
            <p className="text-cacao/70">
              {provider.quartier}, {provider.ville}
            </p>
            <p className="mt-1 text-sm text-cacao/60">
              {provider.rating_count > 0
                ? `⭐ ${provider.rating_avg.toFixed(1)} (${provider.rating_count} avis)`
                : "Nouvelle sur ZURI"}{" "}
              · {dispoLabel[provider.dispo] ?? ""}
            </p>
          </div>
        </div>

        {/* CTA RDV */}
        <div className="mt-6 rounded-xl2 border border-sable bg-white p-4">
          <Link
            href={`/coiffeuse/${provider.id}/rdv`}
            className="block w-full rounded-xl2 bg-or px-5 py-3 text-center font-medium text-cacao shadow-soft transition hover:bg-or-clair"
          >
            📅 Demander un RDV
          </Link>
          <p className="mt-2 text-center text-sm text-cacao/60">
            🔒 Le contact de la coiffeuse se débloque après confirmation du RDV.
          </p>
        </div>

        {/* Bio */}
        {provider.bio && (
          <section className="mt-8">
            <h2 className="font-display text-xl">À propos</h2>
            <p className="mt-2 whitespace-pre-line text-cacao/80">
              {provider.bio}
            </p>
          </section>
        )}

        {/* Services */}
        {services.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl">Services</h2>
            <ul className="mt-3 space-y-2">
              {services.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between rounded-xl2 border border-sable bg-white p-3"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    {s.duree_estim && (
                      <p className="text-sm text-cacao/60">{s.duree_estim}</p>
                    )}
                    {s.description && (
                      <p className="mt-1 text-sm text-cacao/60">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 pl-3 font-medium text-cacao">
                    {price(s.price_min, s.price_max)} FCFA
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl">Réalisations</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {portfolio.map((it) => (
                <div
                  key={it.id}
                  className="overflow-hidden rounded-xl2 border border-sable bg-white"
                >
                  {it.type === "avant_apres" && it.image_url_after ? (
                    <div className="grid grid-cols-2">
                      <PhotoBadge src={it.image_url} badge="Avant" />
                      <PhotoBadge src={it.image_url_after} badge="Après" />
                    </div>
                  ) : (
                    <PhotoBadge src={it.image_url} />
                  )}
                  {it.caption && (
                    <p className="px-3 py-2 text-sm text-cacao/60">
                      {it.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Avis */}
        <section className="mt-8">
          <h2 className="font-display text-xl">Avis</h2>
          {reviews.length === 0 ? (
            <p className="mt-2 text-sm text-cacao/50">Pas encore d&apos;avis.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {reviews.map((r, i) => (
                <li
                  key={i}
                  className="rounded-xl2 border border-sable bg-white p-3"
                >
                  <p className="text-or">{"⭐".repeat(r.rating)}</p>
                  {r.comment && (
                    <p className="mt-1 text-sm text-cacao/80">{r.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function PhotoBadge({ src, badge }: { src: string; badge?: string }) {
  return (
    <div className="relative aspect-square">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {badge && (
        <span className="absolute left-1 top-1 rounded bg-cacao/70 px-1.5 py-0.5 text-[10px] text-ivoire">
          {badge}
        </span>
      )}
    </div>
  );
}
