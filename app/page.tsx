import Link from "next/link";
import { Logo } from "@/components/logo";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo />
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="font-medium text-cacao/70 hover:text-cacao">
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

      <section className="relative mx-auto max-w-3xl px-6 pb-20 pt-16 text-center sm:pt-24">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-or">
          Beauté locale · Gabon
        </p>
        <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl">
          Trouve ta Zuriste
          <br />
          <span className="italic text-or">de confiance.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-cacao/70">
          Tresses, twists, coiffures protectrices. Découvre des portfolios,
          compare, et réserve un rendez-vous près de chez toi.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/recherche"
            className="rounded-xl2 bg-or px-7 py-3.5 font-medium text-cacao shadow-soft transition hover:bg-or-clair"
          >
            Trouver une Zuriste
          </Link>
          <Link
            href="/login"
            className="rounded-xl2 border border-sable px-7 py-3.5 font-medium text-cacao transition hover:bg-ivoire"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
        <p className="mt-10 text-sm text-cacao/50">
          Découvre les profils et les réalisations. La prise de RDV arrive très bientôt.
        </p>
      </section>
    </main>
  );
}
