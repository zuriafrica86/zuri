import { MessageCircle } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { HelpForm } from "@/components/help-form";
import { ZURI_WHATSAPP } from "@/lib/catalog";

export const metadata = { title: "Besoin d'aide ? · Zuri" };

export default function AidePage() {
  const waText = encodeURIComponent(
    "Bonjour l'équipe Zuri, j'aurais besoin d'un coup de main :)"
  );

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <h1 className="font-display text-3xl text-cacao sm:text-4xl">
          Un souci ? On est là pour t&apos;aider
        </h1>
        <p className="mt-3 leading-relaxed text-cacao/70">
          Une question, un petit blocage, ou juste l&apos;envie d&apos;échanger
          avec nous&nbsp;? Écris-nous, on te répond vite et avec le sourire.
          Choisis ce qui te va&nbsp;: un message direct sur WhatsApp, ou le
          formulaire juste en dessous.
        </p>

        <div className="mt-6">
          <a
            href={`https://wa.me/${ZURI_WHATSAPP}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl2 bg-or px-5 py-3 font-medium text-cacao transition hover:bg-or-clair"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            Discuter sur WhatsApp
          </a>
        </div>

        <div className="mt-10 rounded-xl2 border border-sable bg-white p-6 sm:p-7">
          <h2 className="font-display text-xl text-cacao">Écris-nous</h2>
          <p className="mt-1 text-sm text-cacao/60">
            On revient vers toi par email, au plus vite.
          </p>
          <div className="mt-5">
            <HelpForm />
          </div>
        </div>
      </main>
    </div>
  );
}
