import { PublicHeader } from "@/components/public-header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <PublicHeader overlay />
      <main className="min-h-screen md:grid md:grid-cols-[1.05fr_1fr]">
        {/* Panneau de marque (gauche, desktop) */}
        <section className="relative hidden overflow-hidden bg-cacao px-12 py-14 text-ivoire md:flex md:flex-col md:justify-center">
          <div className="tresse absolute right-0 top-0 h-full w-3" aria-hidden />
          <div className="max-w-md">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-or-clair">
              Beauté locale · Gabon
            </p>
            <h1 className="font-display text-3xl leading-tight md:text-5xl">
              Trouve une Zuriste de confiance, près de chez toi.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-ivoire/80">
              Découvre des portfolios, compare, et réserve un rendez-vous. Le
              contact se débloque dès que ta Zuriste confirme.
            </p>
          </div>
          <p className="mt-8 text-sm text-ivoire/60">
            Pro de la beauté ? Transforme ton talent en clientes régulières.
          </p>
        </section>

        {/* Formulaire (droite) — padding haut pour dégager le header en overlay */}
        <section className="flex flex-col justify-center px-6 pb-10 pt-28 sm:px-12 md:py-10">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </section>
      </main>
    </div>
  );
}
