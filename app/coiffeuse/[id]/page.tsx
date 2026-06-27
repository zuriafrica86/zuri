import { BadgeCheck, Sparkles, Star, MapPin, Calendar, Clock, Lock, Circle } from "lucide-react";
import type { Metadata } from "next";
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
interface AvailRow {
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
}

const DAY_NAMES = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const dispoLabel: Record<string, string> = {
  disponible: "Disponible cette semaine",
  indisponible: "Actuellement indisponible",
};

const lieuLabel: Record<string, string> = {
  chez_zuriste: "Chez la Zuriste",
  chez_cliente: "Chez la cliente",
  les_deux: "Chez la Zuriste ou chez la cliente",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("providers")
    .select("business_name, bio, profile_photo, ville")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!p) return { title: "Profil introuvable — Zuri" };

  const title = `${p.business_name} — Zuri`;
  const description =
    (p.bio && p.bio.trim()) ||
    `Découvre les prestations de ${p.business_name}${
      p.ville ? `, Zuriste à ${p.ville}` : ""
    } et réserve un rendez-vous sur Zuri.`;
  const image = p.profile_photo || "/logo-zuri.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

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
      "id, business_name, bio, profile_photo, ville, quartier, dispo, lieu, verified, ambassadrice, rating_avg, rating_count"
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

  const { data: availData } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time")
    .eq("provider_id", id)
    .order("start_time");
  const availMap: Record<number, { start: string; end: string }[]> = {};
  for (const a of (availData as AvailRow[] | null) ?? []) {
    (availMap[a.day_of_week] ??= []).push({
      start: (a.start_time ?? "").slice(0, 5),
      end: (a.end_time ?? "").slice(0, 5),
    });
  }
  const availDays = DAY_ORDER.filter((d) => availMap[d]?.length);

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
          ← Toutes les Zuristes
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
              <h1 className="font-display text-2xl">
                {provider.business_name}
              </h1>
              {provider.verified && (
                <span className="flex items-center gap-1 text-sm text-or"><BadgeCheck className="h-4 w-4" aria-hidden />Vérifiée</span>
              )}
              {provider.ambassadrice && (
                <span className="rounded-full bg-or px-2 py-0.5 text-xs font-medium text-cacao">
                  <Sparkles className="inline h-3.5 w-3.5 align-[-0.15em]" aria-hidden /> Ambassadrice
                </span>
              )}
            </div>
            <p className="text-cacao/70">
              {provider.quartier ? `${provider.quartier}, ` : ""}
              {provider.ville}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-cacao/60">
              {provider.rating_count > 0 ? (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-or" aria-hidden />
                  {provider.rating_avg.toFixed(1)} ({provider.rating_count} avis)
                </span>
              ) : (
                <span>Nouvelle sur ZURI</span>
              )}
              <span className="text-cacao/30">·</span>
              <Circle
                className={
                  provider.dispo === "disponible"
                    ? "h-2.5 w-2.5 fill-green-500 text-green-500"
                    : "h-2.5 w-2.5 fill-cacao/30 text-cacao/30"
                }
                aria-hidden
              />
              {dispoLabel[provider.dispo] ?? ""}
            </p>
            {provider.lieu && (
              <p className="mt-1 flex items-center gap-1 text-sm text-cacao/60">
                <MapPin className="h-4 w-4" aria-hidden />
                {lieuLabel[provider.lieu] ?? ""}
              </p>
            )}
          </div>
        </div>

        {/* CTA RDV */}
        <div className="mt-6 rounded-xl2 border border-sable bg-white p-4">
          <Link
            href={`/coiffeuse/${provider.id}/rdv`}
            className="block w-full rounded-xl2 bg-or px-5 py-3 text-center font-medium text-cacao shadow-soft transition hover:bg-or-clair"
          >
            <Calendar className="inline h-4 w-4 align-[-0.2em]" aria-hidden /> Demander un RDV
          </Link>
          <p className="mt-2 text-center text-sm text-cacao/60">
            <Lock className="mr-1 inline h-3.5 w-3.5 align-[-0.15em]" aria-hidden />Le contact de la Zuriste se débloque après confirmation du RDV.
          </p>
        </div>

        {/* Bio */}
        {provider.bio && (
          <section className="mt-6">
            <h2 className="font-display text-xl">À propos</h2>
            <p className="mt-2 whitespace-pre-line text-cacao/80">
              {provider.bio}
            </p>
          </section>
        )}

        {/* Disponibilités */}
        {availDays.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-xl">Disponibilités</h2>
            <ul className="mt-3 space-y-1.5">
              {availDays.map((d) => (
                <li
                  key={d}
                  className="flex items-center gap-2 text-sm text-cacao/80"
                >
                  <Clock className="h-4 w-4 text-or" aria-hidden />
                  <span className="w-24 font-medium text-cacao">
                    {DAY_NAMES[d]}
                  </span>
                  <span>
                    {availMap[d]
                      .map((r) => `${r.start} – ${r.end}`)
                      .join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Services */}
        {services.length > 0 && (
          <section className="mt-6">
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
          <section className="mt-6">
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
        <section className="mt-6">
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
                  <p className="flex gap-0.5 text-or">{Array.from({ length: r.rating }).map((_, j) => (<Star key={j} className="h-4 w-4" aria-hidden />))}</p>
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
