import {
  BadgeCheck,
  Star,
  MapPin,
  Calendar,
  Clock,
  Lock,
  Circle,
  ArrowLeft,
} from "lucide-react";
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

const fmt = (n: number) => n.toLocaleString("fr-FR");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("providers")
    .select("business_name, bio, profile_photo, ville")
    .eq("slug", slug)
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select(
      "id, business_name, bio, profile_photo, ville, quartier, dispo, lieu, verified, ambassadrice, rating_avg, rating_count"
    )
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!provider) notFound();
  const pid = provider.id;

  const { data: servicesData } = await supabase
    .from("services")
    .select("*")
    .eq("provider_id", pid)
    .order("price_min");
  const { data: portfolioData } = await supabase
    .from("portfolio_photos")
    .select("id, type, image_url, image_url_after, caption")
    .eq("provider_id", pid)
    .order("created_at", { ascending: false });
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("provider_id", pid)
    .eq("status", "visible")
    .order("created_at", { ascending: false });

  const services = (servicesData as ServiceRow[] | null) ?? [];
  const portfolio = (portfolioData as PortfolioRow[] | null) ?? [];
  const reviews = (reviewsData as ReviewRow[] | null) ?? [];

  const { data: availData } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time")
    .eq("provider_id", pid)
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
    max && max > min ? `${fmt(min)} – ${fmt(max)}` : fmt(min);

  const minPrice = services.length
    ? Math.min(...services.map((s) => s.price_min))
    : null;
  const disponible = provider.dispo === "disponible";

  return (
    <main className="min-h-screen">
      {/* En-tête */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sable/70 bg-white/85 px-5 py-3.5 backdrop-blur md:px-8">
        <Logo />
        <Link
          href="/recherche"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-cacao/60 transition hover:bg-rose/30 hover:text-cacao"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Toutes les Zuristes
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10">
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_340px] md:items-start md:gap-12">
          {/* ----------------------- COLONNE CONTENU ----------------------- */}
          <div className="animate-fade-in-up">
            {/* Héros : portrait éditorial + identité */}
            <section className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <div className="relative aspect-[4/5] w-44 shrink-0 overflow-hidden rounded-4xl bg-rose/40 shadow-soft sm:w-52">
                {provider.profile_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={provider.profile_photo}
                    alt={provider.business_name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 pb-1">
                {provider.verified && (
                  <span className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-or">
                    <BadgeCheck className="h-4 w-4" aria-hidden />
                    Vérifiée
                  </span>
                )}
                <h1 className="font-display text-3xl leading-tight sm:text-4xl">
                  {provider.business_name}
                </h1>
                {provider.ambassadrice && (
                  <span className="mt-2 inline-block rounded-full bg-or px-3 py-0.5 text-xs font-medium text-cacao">
                    Ambassadrice
                  </span>
                )}

                <p className="mt-3 flex items-center gap-1.5 text-cacao/70">
                  <MapPin className="h-4 w-4 shrink-0 text-cacao/40" aria-hidden />
                  {provider.quartier ? `${provider.quartier}, ` : ""}
                  {provider.ville}
                </p>

                {/* Puces : note + disponibilité */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {provider.rating_count > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose/40 px-3 py-1 text-sm font-medium text-cacao">
                      <Star className="h-4 w-4 fill-or text-or" aria-hidden />
                      {provider.rating_avg.toFixed(1)}
                      <span className="font-normal text-cacao/50">
                        ({provider.rating_count})
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-rose/40 px-3 py-1 text-sm text-cacao/70">
                      Nouvelle sur Zuri
                    </span>
                  )}

                  {dispoLabel[provider.dispo] && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose/40 px-3 py-1 text-sm text-cacao/70">
                      <Circle
                        className={
                          disponible
                            ? "h-2.5 w-2.5 fill-green-500 text-green-500"
                            : "h-2.5 w-2.5 fill-cacao/30 text-cacao/30"
                        }
                        aria-hidden
                      />
                      {dispoLabel[provider.dispo]}
                    </span>
                  )}
                </div>

                {provider.lieu && (
                  <p className="mt-3 text-sm text-cacao/60">
                    {lieuLabel[provider.lieu] ?? ""}
                  </p>
                )}
              </div>
            </section>

            {/* Réservation — version mobile (inline) */}
            <div className="mt-7 md:hidden">
              <BookingCard slug={slug} minPrice={minPrice} />
            </div>

            {/* Sections */}
            <div className="mt-10 space-y-11">
              {provider.bio && (
                <Section title="À propos">
                  <p className="whitespace-pre-line leading-relaxed text-cacao/80">
                    {provider.bio}
                  </p>
                </Section>
              )}

              {portfolio.length > 0 && (
                <Section title="Réalisations" count={portfolio.length}>
                  <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                    {portfolio.map((it) => (
                      <PortfolioTile
                        key={it.id}
                        item={it}
                        author={provider.business_name}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {services.length > 0 && (
                <Section title="Prestations" count={services.length}>
                  <div className="divide-y divide-sable overflow-hidden rounded-xl2 border border-sable bg-white">
                    {services.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-start justify-between gap-4 p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-cacao">{s.name}</p>
                          {s.duree_estim && (
                            <p className="mt-0.5 text-sm text-cacao/50">
                              {s.duree_estim}
                            </p>
                          )}
                          {s.description && (
                            <p className="mt-1 text-sm text-cacao/60">
                              {s.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 whitespace-nowrap font-medium text-cacao">
                          {price(s.price_min, s.price_max)}
                          <span className="text-cacao/50"> FCFA</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {availDays.length > 0 && (
                <Section title="Disponibilités">
                  <div className="divide-y divide-sable overflow-hidden rounded-xl2 border border-sable bg-white">
                    {availDays.map((d) => (
                      <div
                        key={d}
                        className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                      >
                        <span className="flex items-center gap-2 font-medium text-cacao">
                          <Clock className="h-4 w-4 text-or" aria-hidden />
                          {DAY_NAMES[d]}
                        </span>
                        <span className="text-cacao/70">
                          {availMap[d]
                            .map((r) => `${r.start} – ${r.end}`)
                            .join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              <Section
                title="Avis"
                count={reviews.length > 0 ? reviews.length : undefined}
              >
                {reviews.length === 0 ? (
                  <p className="text-sm text-cacao/50">
                    Pas encore d&apos;avis.
                  </p>
                ) : (
                  <>
                    {provider.rating_count > 0 && (
                      <div className="mb-5 flex items-center gap-3">
                        <span className="font-display text-4xl text-cacao">
                          {provider.rating_avg.toFixed(1)}
                        </span>
                        <div>
                          <Stars n={Math.round(provider.rating_avg)} />
                          <p className="mt-0.5 text-sm text-cacao/50">
                            {provider.rating_count} avis
                          </p>
                        </div>
                      </div>
                    )}
                    <ul className="divide-y divide-sable">
                      {reviews.map((r, i) => (
                        <li key={i} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <Stars n={r.rating} />
                            <span className="text-xs text-cacao/40">
                              {new Date(r.created_at).toLocaleDateString(
                                "fr-FR",
                                { month: "long", year: "numeric" }
                              )}
                            </span>
                          </div>
                          {r.comment && (
                            <p className="mt-1.5 leading-relaxed text-cacao/80">
                              {r.comment}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Section>
            </div>
          </div>

          {/* ----------------- COLONNE RÉSERVATION (desktop) ----------------- */}
          <aside className="hidden md:block">
            <div className="sticky top-24">
              <BookingCard slug={slug} minPrice={minPrice} />
            </div>
          </aside>
        </div>
      </div>

      {/* Barre de réservation fixe (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-sable bg-white/95 px-5 py-3 backdrop-blur md:hidden">
        <div className="min-w-0">
          {minPrice !== null ? (
            <>
              <p className="text-xs text-cacao/50">À partir de</p>
              <p className="font-medium leading-tight text-cacao">
                {fmt(minPrice)} FCFA
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-cacao">Réserver</p>
          )}
        </div>
        <Link
          href={`/zuriste/${slug}/rdv`}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl2 bg-cacao px-5 py-3 font-medium text-ivoire shadow-soft transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
        >
          <Calendar className="h-4 w-4" aria-hidden />
          Demander un RDV
        </Link>
      </div>
    </main>
  );
}

/* ----------------------------- Composants ----------------------------- */

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 font-display text-2xl text-cacao">
        {title}
        {typeof count === "number" && (
          <span className="ml-2 align-middle text-base font-normal text-cacao/40">
            {count}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

function BookingCard({
  slug,
  minPrice,
}: {
  slug: string;
  minPrice: number | null;
}) {
  return (
    <div className="rounded-4xl border border-sable bg-white p-5 shadow-soft">
      {minPrice !== null && (
        <p className="mb-3 text-cacao/70">
          À partir de{" "}
          <span className="font-display text-2xl text-cacao">
            {fmt(minPrice)}
          </span>{" "}
          FCFA
        </p>
      )}
      <Link
        href={`/zuriste/${slug}/rdv`}
        className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-cacao px-5 py-3.5 font-medium text-ivoire shadow-soft transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
      >
        <Calendar className="h-4 w-4" aria-hidden />
        Demander un RDV
      </Link>
      <p className="mt-3 flex items-start gap-1.5 text-sm text-cacao/55">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Le contact de la Zuriste se débloque après confirmation du RDV.
      </p>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5 text-or" aria-label={`${n} sur 5`}>
      {Array.from({ length: 5 }).map((_, j) => (
        <Star
          key={j}
          className={`h-4 w-4 ${j < n ? "fill-or" : "fill-transparent text-sable"}`}
          aria-hidden
        />
      ))}
    </span>
  );
}

function PortfolioTile({
  item,
  author,
}: {
  item: PortfolioRow;
  author: string;
}) {
  const alt = item.caption || `Réalisation de ${author}`;
  return (
    <figure className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl2 bg-rose/30">
        {item.type === "avant_apres" && item.image_url_after ? (
          <div className="grid h-full grid-cols-2">
            <TilePhoto src={item.image_url} alt={`Avant — ${alt}`} label="Avant" />
            <TilePhoto
              src={item.image_url_after}
              alt={`Après — ${alt}`}
              label="Après"
            />
          </div>
        ) : (
          <TilePhoto src={item.image_url} alt={alt} />
        )}
      </div>
      {item.caption && (
        <figcaption className="mt-1.5 line-clamp-1 text-sm text-cacao/55">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );
}

function TilePhoto({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label?: string;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-250 ease-soft group-hover:scale-[1.04]"
      />
      {label && (
        <span className="absolute left-2 top-2 rounded-full bg-cacao/70 px-2 py-0.5 text-[10px] font-medium text-ivoire backdrop-blur">
          {label}
        </span>
      )}
    </div>
  );
}
