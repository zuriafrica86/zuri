import Link from "next/link";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { ModelCard } from "@/components/model-card";
import { fetchModels, type ModelItem } from "@/lib/models";
import { universList } from "@/lib/catalog";

export default async function ModelesPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const { u } = await searchParams;
  const univers = u && universList().includes(u) ? u : undefined;
  const models = await fetchModels({ univers });

  const tabs = [{ key: "", label: "Tout" }].concat(
    universList().map((nom) => ({ key: nom, label: nom }))
  );

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-sable px-6 py-4">
        <Logo />
        <LogoutButton />
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl">Bibliothèque de modèles</h1>
            <p className="mt-1 text-sm text-cacao/60">
              Trouve un modèle qui te plaît et réserve en un clic.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 text-sm text-cacao/60 hover:text-cacao"
          >
            ← Retour
          </Link>
        </div>

        {/* Filtres par univers */}
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = (univers ?? "") === t.key;
            const href = t.key ? `/modeles?u=${encodeURIComponent(t.key)}` : "/modeles";
            return (
              <Link
                key={t.key || "all"}
                href={href}
                className={
                  active
                    ? "rounded-xl2 bg-cacao px-3 py-1.5 text-sm font-medium text-ivoire"
                    : "rounded-xl2 border border-sable px-3 py-1.5 text-sm text-cacao/70 hover:bg-rose/30"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {models.length === 0 ? (
          <div className="rounded-xl2 border border-sable bg-white p-6 text-center text-sm text-cacao/60">
            Aucun modèle pour l&apos;instant dans cette catégorie. Reviens
            bientôt — les Zuristes ajoutent leurs réalisations !
          </div>
        ) : (
          <div className="space-y-8">
            {groupByCategorie(models).map(([categorie, items]) => (
              <section key={categorie}>
                <h2 className="mb-3 font-display text-xl">{categorie}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((m) => (
                    <ModelCard key={m.id} m={m} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// Regroupe les modèles par catégorie (en conservant l'ordre d'apparition).
function groupByCategorie(
  models: ModelItem[]
): [string, ModelItem[]][] {
  const groups = new Map<string, ModelItem[]>();
  for (const m of models) {
    const key = m.categorie ?? "Autres";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  return Array.from(groups.entries());
}
