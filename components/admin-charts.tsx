// Briques de visualisation 100% CSS (aucune dépendance externe).

export function fcfa(n: number): string {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export function fcfaShort(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + " M";
  if (n >= 1000) return Math.round(n / 1000) + " k";
  return String(n);
}

export function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl2 border p-4 ${
        accent ? "border-or/40 bg-or/10" : "border-sable bg-white"
      }`}
    >
      <p className="text-xs text-cacao/60">{label}</p>
      <p className="mt-1 font-display text-2xl text-cacao">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-cacao/40">{sub}</p>}
    </div>
  );
}

export function BarList({
  items,
  color = "bg-or",
  empty = "Aucune donnée pour l'instant.",
}: {
  items: { label: string; value: number; display: string }[];
  color?: string;
  empty?: string;
}) {
  if (items.length === 0)
    return <p className="text-sm text-cacao/50">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-cacao/80 sm:w-36">
            {it.label}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-ivoire/60">
            <div
              className={`h-full rounded ${color}`}
              style={{ width: `${Math.max(2, (it.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right text-sm font-medium text-cacao">
            {it.display}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrendBars({
  points,
  color = "bg-or",
}: {
  points: { label: string; value: number; display: string }[];
  color?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className="flex items-end justify-between gap-2">
      {points.map((p, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-cacao/50">
            {p.value > 0 ? p.display : ""}
          </span>
          <div
            className={`w-full max-w-[40px] rounded-t ${color}`}
            style={{
              height: Math.max(p.value > 0 ? 4 : 0, Math.round((p.value / max) * 96)),
            }}
            title={`${p.label} : ${p.display}`}
          />
          <span className="text-[10px] text-cacao/50">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
