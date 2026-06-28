"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { universList, categoriesOf, VILLES } from "@/lib/catalog";

export function SearchFilters({
  current,
}: {
  current: {
    ville: string;
    univers: string;
    categorie: string;
    lieu: string;
    prix: string;
  };
}) {
  const [univers, setUnivers] = useState(current.univers || "");
  const [categorie, setCategorie] = useState(current.categorie || "");
  const cats = univers ? categoriesOf(univers).map((c) => c.nom) : [];
  const hasFilters = Object.values(current).some(Boolean);

  const field =
    "h-11 w-full rounded-xl2 border border-sable bg-white px-3.5 text-sm text-cacao placeholder:text-cacao/30 transition focus:border-or focus:shadow-focus focus:outline-none disabled:opacity-50";

  return (
    <div className="mt-5">
      <form
        method="get"
        className="grid grid-cols-2 gap-2.5 rounded-xl2 border border-sable bg-white p-3 shadow-soft md:grid-cols-6"
      >
        <select name="ville" defaultValue={current.ville} className={field}>
          <option value="">Toutes les villes</option>
          {VILLES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          name="univers"
          value={univers}
          onChange={(e) => {
            setUnivers(e.target.value);
            setCategorie("");
          }}
          className={field}
        >
          <option value="">Tous les univers</option>
          {universList().map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <select
          name="categorie"
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          disabled={!univers}
          className={field}
        >
          <option value="">Toutes catégories</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select name="lieu" defaultValue={current.lieu} className={field}>
          <option value="">Tout lieu</option>
          <option value="chez_zuriste">Chez la Zuriste</option>
          <option value="chez_cliente">Chez la cliente</option>
        </select>

        <input
          name="prix"
          type="number"
          inputMode="numeric"
          defaultValue={current.prix}
          placeholder="Prix max (FCFA)"
          className={field}
        />

        <button
          type="submit"
          className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl2 bg-cacao px-4 text-sm font-medium text-ivoire transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98] md:col-span-1"
        >
          <Search className="h-4 w-4" aria-hidden />
          Rechercher
        </button>
      </form>

      {hasFilters && (
        <div className="mt-2 text-right">
          <Link
            href="/recherche"
            className="text-sm text-cacao/50 underline-offset-2 transition hover:text-cacao hover:underline"
          >
            Effacer les filtres
          </Link>
        </div>
      )}
    </div>
  );
}
