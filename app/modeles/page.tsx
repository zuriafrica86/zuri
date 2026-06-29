import Link from "next/link";
import { AppShell } from "@/components/app-shell";
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
    <AppShell maxWidth="5xl">
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl sm:text-3xl">
          Bibliothèque de <span className="italic text-or">modèles</span>
        </h1>
        <p className="mt-1.5 text-cacao/60">
          Trouve un modèle qui te plaît et réserve en un clic.
        </p>

        {/* Filtres par univers */}
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = (univers ?? "") === t.key;
            const href = t.key
              ? `/modeles?u=${encodeURIComponent(t.key)}`
              : "/modeles";
            return (
              <Link
                key={t.key || "all"}
                href={href}
                className={
                  active
                    ? "rounded-full bg-cacao px-4 py-1.5 text-sm font-medium text-ivoire"
                    : "rounded-full border border-sable px-4 py-1.5 text-sm text-cacao/70 transition duration-250 ease-soft hover:bg-rose/30 hover:text-cacao"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {models.length === 0 ? (
          <div className="mt-5 rounded-4xl border border-dashed border-sable bg-white px-6 py-16 text-center">
            <p className="font-medium text-cacao">
              Aucun modèle dans cette catégorie
            </p>
            <p className="mt-1 text-sm text-cacao/50">
              Reviens bientôt — les Zuristes ajoutent leurs réalisations !
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-9">
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
    </AppShell>
  );
}

// Regroupe les modèles par catégorie (en conservant l'ordre d'apparition).
function groupByCategorie(models: ModelItem[]): [string, ModelItem[]][] {
  const groups = new Map<string, ModelItem[]>();
  for (const m of models) {
    const key = m.categorie ?? "Autres";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  return Array.from(groups.entries());
}
