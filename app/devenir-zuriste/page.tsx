import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
  Check,
  ArrowRight,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";

export const metadata: Metadata = {
  title: "Devenir Zuriste — Développe ton activité avec Zuri",
  description:
    "Transforme ton talent beauté en revenus réguliers. Plus de visibilité, plus de clientes, un agenda rempli. Découvre combien tu peux gagner avec Zuri.",
  openGraph: {
    title: "Devenir Zuriste — Développe ton activité avec Zuri",
    description:
      "Transforme ton talent beauté en revenus réguliers : plus de visibilité, plus de clientes, un agenda rempli.",
    images: [{ url: "/devenir-hero-full.jpg" }],
  },
};

const POURQUOI = [
  {
    icon: Users,
    titre: "Plus de visibilité",
    texte:
      "Ton profil est vu par des centaines de clientes près de chez toi.",
  },
  {
    icon: CalendarCheck,
    titre: "Des rendez-vous réguliers",
    texte: "Remplis ton agenda et fidélise ta clientèle.",
  },
  {
    icon: TrendingUp,
    titre: "Augmente tes revenus",
    texte: "Développe ton activité et gagne en stabilité financière.",
  },
  {
    icon: ShieldCheck,
    titre: "Zuri s'occupe du reste",
    texte: "Avis clientes, support et accompagnement au quotidien.",
  },
];

const CONCRET = [
  {
    montant: "180 000 FCFA / mois",
    points: [
      "Complément de revenu sérieux",
      "Paiement du loyer + charges",
      "Plus d'indépendance financière",
    ],
    exemple: "4 clientes / semaine = 45 000 FCFA / semaine",
  },
  {
    montant: "300 000 FCFA / mois",
    points: [
      "Revenu proche d'un salaire stable",
      "Supérieur à beaucoup d'emplois locaux",
      "Confort et stabilité financière",
    ],
    exemple: "5 clientes / semaine = 75 000 FCFA / semaine",
  },
  {
    montant: "Potentiel top profil",
    points: [
      "30 clientes / mois",
      "450 000 FCFA / mois",
      "5,4 millions FCFA / an",
    ],
    exemple: "Un revenu équivalent à un cadre supérieur local !",
  },
];

const ETAPES = [
  {
    n: "01",
    titre: "Crée ton profil",
    texte: "Présente ton talent, tes prestations et tes réalisations.",
  },
  {
    n: "02",
    titre: "Reçois des demandes",
    texte: "Les clientes près de chez toi réservent un créneau.",
  },
  {
    n: "03",
    titre: "Gère tes rendez-vous",
    texte: "Valide, organise ton agenda, garde la main sur ton planning.",
  },
  {
    n: "04",
    titre: "Réalise et encaisse",
    texte: "Tu fais ce que tu sais faire de mieux, et tu reçois tes revenus.",
  },
];

export default function DevenirZuristePage() {
  return (
    <div className="bg-white">
      <PublicHeader light />

      {/* HERO plein écran */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/devenir-hero-full.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-cacao/90 via-cacao/65 to-cacao/20"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 py-28 sm:px-10">
          <div className="max-w-xl text-ivoire">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-or">
              Rejoins la communauté Zuri
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] sm:text-6xl">
              Développe ton activité et{" "}
              <span className="italic text-or">gagne plus</span> avec Zuri.
            </h1>
            <p className="mt-5 text-lg text-ivoire/85">
              Plus de visibilité, plus de clientes, plus de revenus. Ton talent
              mérite d'être vu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl2 bg-or px-6 py-3.5 font-medium text-cacao shadow-soft transition hover:bg-or-clair"
              >
                Créer mon profil Zuriste
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#gains"
                className="inline-flex items-center gap-2 rounded-xl2 border border-ivoire/40 px-6 py-3.5 font-medium text-ivoire transition hover:bg-ivoire/10"
              >
                Combien je peux gagner ?
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* POURQUOI — bandeau cacao */}
      <section className="bg-cacao py-28 text-ivoire md:py-36">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <h2 className="text-center font-display text-3xl md:text-4xl">
            Pourquoi rejoindre <span className="italic text-or">Zuri</span> ?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {POURQUOI.map((p) => (
              <div key={p.titre}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-or/20 text-or">
                  <p.icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-xl">{p.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ivoire/70">
                  {p.texte}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GAINS — la pièce maîtresse */}
      <section
        id="gains"
        className="mx-auto max-w-6xl px-6 py-28 sm:px-10 md:py-36"
      >
        <h2 className="font-display text-3xl text-cacao md:text-4xl">
          Combien peux-tu <span className="italic text-or">gagner</span> avec
          Zuri ?
        </h2>
        <p className="mt-3 text-cacao/60">
          Projections basées sur un panier moyen de 15 000 FCFA par cliente.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {/* 6 mois */}
          <div className="rounded-[24px] border border-sable bg-rose/20 p-7">
            <span className="inline-block rounded-full bg-or px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cacao">
              À 6 mois
            </span>
            <p className="mt-3 text-sm font-medium text-cacao/60">
              Activité en développement
            </p>
            <div className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="font-display text-3xl text-cacao">10–15</p>
                <p className="text-sm text-cacao/60">clientes / mois</p>
              </div>
              <div>
                <p className="font-display text-3xl text-cacao">180 000</p>
                <p className="text-sm text-cacao/60">FCFA / mois en moyenne</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-white p-5">
              <p className="text-sm text-cacao/60">Sur 6 mois</p>
              <p className="font-display text-2xl text-cacao md:text-3xl">
                900 000 à 1 100 000 FCFA
              </p>
            </div>
          </div>

          {/* 1 an */}
          <div className="rounded-[24px] border border-cacao/10 bg-cacao p-7 text-ivoire">
            <span className="inline-block rounded-full bg-or px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cacao">
              À 1 an
            </span>
            <p className="mt-3 text-sm font-medium text-ivoire/60">
              Activité stable et régulière
            </p>
            <div className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="font-display text-3xl">15–25</p>
                <p className="text-sm text-ivoire/60">clientes / mois</p>
              </div>
              <div>
                <p className="font-display text-3xl">300 000</p>
                <p className="text-sm text-ivoire/60">FCFA / mois en moyenne</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-or p-5 text-cacao">
              <p className="text-sm text-cacao/70">Sur 12 mois</p>
              <p className="font-display text-2xl md:text-3xl">
                2,5 à 3,5 millions FCFA
              </p>
            </div>
          </div>
        </div>

        {/* Concrètement */}
        <h3 className="mt-16 font-display text-2xl text-cacao md:text-3xl">
          Ce que ça représente <span className="italic text-or">concrètement</span>
        </h3>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {CONCRET.map((c) => (
            <div
              key={c.montant}
              className="flex flex-col rounded-[20px] border border-sable bg-white p-6 shadow-soft"
            >
              <p className="font-display text-xl text-cacao">{c.montant}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {c.points.map((pt) => (
                  <li
                    key={pt}
                    className="flex items-start gap-2 text-sm text-cacao/75"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-or"
                      aria-hidden
                    />
                    {pt}
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-xl bg-rose/30 px-4 py-3 text-sm font-medium text-cacao">
                {c.exemple}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="mx-auto max-w-6xl px-6 py-28 sm:px-10 md:py-36">
        <div className="grid gap-10 md:grid-cols-[1fr_0.9fr] md:items-center">
          <div>
            <h2 className="font-display text-3xl text-cacao md:text-4xl">
              Comment ça <span className="italic text-or">marche</span> ?
            </h2>
            <ol className="mt-10 space-y-6">
              {ETAPES.map((e) => (
                <li key={e.n} className="flex gap-4">
                  <span className="font-display text-2xl text-or">{e.n}</span>
                  <div>
                    <h3 className="font-display text-lg text-cacao">
                      {e.titre}
                    </h3>
                    <p className="mt-1 text-sm text-cacao/70">{e.texte}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="overflow-hidden rounded-[24px] shadow-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/devenir-step.jpg"
              alt="Une Zuriste sourit, prête à accueillir ses clientes"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Important */}
        <div className="mt-14 rounded-[20px] border border-or/40 bg-rose/20 p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-or">
            Important
          </p>
          <p className="mt-2 text-cacao/80">
            Zuri ne garantit pas un revenu fixe, mais augmente fortement le
            nombre de clientes et la régularité de tes rendez-vous. Ce que tu
            gagnes dépend de ton talent, de ta disponibilité et de ton sérieux.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/devenir-cta.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-cacao/80" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center text-ivoire md:py-36">
          <h2 className="font-display text-4xl leading-tight md:text-5xl">
            Ton talent mérite <span className="italic text-or">d'être vu</span>.
          </h2>
          <p className="mt-4 text-lg text-ivoire/80">
            Rejoins Zuri et transforme ta passion en revenus.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl2 bg-or px-7 py-3.5 font-medium text-cacao shadow-soft transition hover:bg-or-clair"
          >
            Créer mon profil Zuriste
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p className="mt-4 text-sm text-ivoire/60">
            Déjà inscrite ?{" "}
            <Link href="/login" className="underline hover:text-ivoire">
              Me connecter
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
