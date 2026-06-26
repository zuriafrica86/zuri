import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen md:grid md:grid-cols-[1.05fr_1fr]">
      {/* Panneau de marque (gauche) */}
      <section className="relative hidden overflow-hidden bg-cacao px-12 py-14 text-ivoire md:flex md:flex-col md:justify-between">
        <div className="tresse absolute right-0 top-0 h-full w-3" aria-hidden />
        <Logo variant="light" />
        <div className="max-w-md">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-or-clair">
            Beauté locale · Gabon
          </p>
          <h1 className="font-display text-3xl leading-tight md:text-5xl">
            Trouve une Zuriste de confiance, près de chez toi.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ivoire/80">
            Découvre des portfolios, compare, et réserve un rendez-vous.
            Le contact se débloque dès que ta Zuriste confirme.
          </p>
        </div>
        <p className="text-sm text-ivoire/60">
          Pro de la beauté ? Transforme ton talent en clientes régulières.
        </p>
      </section>

      {/* Formulaire (droite) */}
      <section className="flex min-h-screen flex-col justify-center px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 md:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
