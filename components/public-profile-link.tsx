"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";

export function PublicProfileLink({
  path,
  approved,
}: {
  path: string;
  approved: boolean;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!approved) {
    return (
      <div className="rounded-xl2 border border-sable bg-white p-4 text-sm text-cacao/60">
        Ton profil public sera visible et partageable dès que ton compte est
        validé.
      </div>
    );
  }

  const fullUrl = (origin || "https://zuriafrica.app") + path;
  const display = fullUrl.replace(/^https?:\/\//, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // presse-papiers indisponible — on ignore
    }
  }

  return (
    <div className="rounded-xl2 border border-sable bg-white p-5 shadow-soft">
      <p className="text-sm text-cacao/60">Mon profil public</p>
      <p className="mt-1 break-all font-medium text-cacao">{display}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-or px-4 py-2 text-sm font-medium text-cacao transition hover:bg-or-clair"
        >
          <ExternalLink className="h-4 w-4" /> Voir mon profil
        </a>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sable px-4 py-2 text-sm font-medium text-cacao transition hover:bg-rose/30"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copié !" : "Copier le lien"}
        </button>
      </div>
      <p className="mt-2 text-xs text-cacao/50">
        Partage ce lien sur tes réseaux pour recevoir des réservations.
      </p>
    </div>
  );
}
