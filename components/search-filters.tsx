"use client";

import { useState } from "react";
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

  const input =
    "rounded-xl2 border border-sable bg-ivoire px-3 py-2.5 text-sm text-cacao placeholder:text-cacao/30 focus:border-or disabled:opacity-50";

  return (
    <form
      method="get"
      className="mt-6 grid grid-cols-2 gap-3 rounded-xl2 border border-sable bg-ivoire p-4 md:grid-cols-6"
    >
      <select name="ville" defaultValue={current.ville} className={input}>
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
        className={input}
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
        className={input}
      >
        <option value="">Toutes catégories</option>
        {cats.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select name="lieu" defaultValue={current.lieu} className={input}>
        <option value="">Tout lieu</option>
        <option value="chez_zuriste">Chez la Zuriste</option>
        <option value="chez_cliente">Chez la cliente</option>
      </select>

      <input
        name="prix"
        type="number"
        inputMode="numeric"
        defaultValue={current.prix}
        placeholder="Prix max"
        className={input}
      />

      <button
        type="submit"
        className="rounded-xl2 bg-or px-4 py-2.5 text-sm font-medium text-cacao transition hover:bg-or-clair"
      >
        Rechercher
      </button>
    </form>
  );
}
