export function SearchFilters({
  current,
}: {
  current: {
    ville: string;
    quartier: string;
    dispo: string;
    category: string;
    prix: string;
  };
}) {
  const input =
    "rounded-xl2 border border-sable bg-white px-3 py-2.5 text-sm text-cacao placeholder:text-cacao/30 focus:border-or";
  return (
    <form
      method="get"
      className="mt-6 grid grid-cols-2 gap-3 rounded-xl2 border border-sable bg-white p-4 md:grid-cols-6"
    >
      <input
        name="ville"
        defaultValue={current.ville}
        placeholder="Ville"
        className={input}
      />
      <input
        name="quartier"
        defaultValue={current.quartier}
        placeholder="Quartier"
        className={input}
      />
      <select name="category" defaultValue={current.category} className={input}>
        <option value="">Tous services</option>
        <option value="tresses">Tresses</option>
        <option value="coiffure">Coiffure</option>
      </select>
      <select name="dispo" defaultValue={current.dispo} className={input}>
        <option value="">Toute dispo</option>
        <option value="disponible">Disponible</option>
        <option value="occupee">Occupée</option>
        <option value="sur_rdv">Sur RDV</option>
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
