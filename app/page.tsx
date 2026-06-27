import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { PublicHeader } from "@/components/public-header";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen">
      <PublicHeader />

      <section className="relative mx-auto max-w-3xl px-6 pb-20 pt-16 text-center sm:pt-24">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-or">
          Beauté locale · Gabon
        </p>
        <h1 className="font-display text-4xl leading-[1.05] sm:text-6xl">
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
            className="rounded-xl2 border border-sable px-7 py-3.5 font-medium text-cacao transition hover:bg-white"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
        <p className="mt-6 text-sm text-cacao/50">
          Découvre les profils et les réalisations. La prise de RDV arrive très bientôt.
        </p>
      </section>
    </main>
  );
}
