"use client";

import { useActionState, useState } from "react";
import { Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import { purchaseBoost, type BoostResult } from "@/app/dashboard/booster/actions";
import { BOOST_DURATIONS, boostPrice, type BoostType } from "@/lib/boost";

export interface Realisation {
  id: string;
  image: string;
  label: string;
}

export function BoostCatalog({
  balance,
  realisations,
}: {
  balance: number;
  realisations: Realisation[];
}) {
  const [state, action] = useActionState<BoostResult, FormData>(
    purchaseBoost,
    null
  );

  return (
    <div className="space-y-4">
      {state?.error && (
        <p className="rounded-xl2 bg-rose/60 px-4 py-2.5 text-sm text-cacao">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="flex items-center gap-1.5 rounded-xl2 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          <Sparkles className="h-4 w-4" aria-hidden /> Ta mise en avant est
          active&nbsp;!
        </p>
      )}

      <ProfilCard action={action} balance={balance} />
      <RealisationCard
        action={action}
        balance={balance}
        realisations={realisations}
      />
    </div>
  );
}

function DurationChips({
  type,
  days,
  setDays,
}: {
  type: BoostType;
  days: number;
  setDays: (d: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {BOOST_DURATIONS.map((d) => {
        const active = days === d;
        return (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={
              active
                ? "rounded-full bg-cacao px-3.5 py-1.5 text-sm font-medium text-ivoire"
                : "rounded-full border border-sable px-3.5 py-1.5 text-sm text-cacao/70 transition duration-250 ease-soft hover:bg-rose/30 hover:text-cacao"
            }
          >
            {d} j · {boostPrice(type, d).toLocaleString("fr-FR")}
          </button>
        );
      })}
    </div>
  );
}

function BuyButton({
  price,
  balance,
}: {
  price: number;
  balance: number;
}) {
  const afford = balance >= price;
  if (!afford) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-xl2 bg-cacao/30 px-5 py-2.5 text-sm font-medium text-ivoire"
        >
          Booster ({price.toLocaleString("fr-FR")} Zuri)
        </button>
        <span className="text-sm text-cacao/60">
          Crédit insuffisant —{" "}
          <Link
            href="/dashboard/credit"
            className="font-medium text-cacao underline underline-offset-2"
          >
            recharger
          </Link>
        </span>
      </div>
    );
  }
  return (
    <button
      type="submit"
      className="mt-4 rounded-xl2 bg-cacao px-5 py-2.5 text-sm font-medium text-ivoire transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
    >
      Booster ({price.toLocaleString("fr-FR")} Zuri)
    </button>
  );
}

function ProfilCard({
  action,
  balance,
}: {
  action: (formData: FormData) => void;
  balance: number;
}) {
  const [days, setDays] = useState<number>(7);
  const price = boostPrice("profil", days);

  return (
    <form
      action={action}
      className="rounded-4xl border border-sable bg-white p-5 shadow-soft"
    >
      <input type="hidden" name="type" value="profil" />
      <input type="hidden" name="days" value={days} />
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl2 bg-rose/40 text-cacao">
          <Rocket className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h3 className="font-display text-lg text-cacao">Booster mon profil</h3>
          <p className="mt-0.5 text-sm text-cacao/65">
            Ton profil apparaît plus haut dans les résultats de recherche.
          </p>
        </div>
      </div>
      <DurationChips type="profil" days={days} setDays={setDays} />
      <BuyButton price={price} balance={balance} />
    </form>
  );
}

function RealisationCard({
  action,
  balance,
  realisations,
}: {
  action: (formData: FormData) => void;
  balance: number;
  realisations: Realisation[];
}) {
  const [days, setDays] = useState<number>(7);
  const [selected, setSelected] = useState<string>(
    realisations[0]?.id ?? ""
  );
  const price = boostPrice("realisation", days);
  const current = realisations.find((r) => r.id === selected);

  return (
    <form
      action={action}
      className="rounded-4xl border border-sable bg-white p-5 shadow-soft"
    >
      <input type="hidden" name="type" value="realisation" />
      <input type="hidden" name="days" value={days} />
      <input type="hidden" name="target_id" value={selected} />
      <input type="hidden" name="target_label" value={current?.label ?? ""} />

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl2 bg-rose/40 text-cacao">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h3 className="font-display text-lg text-cacao">
            Booster une réalisation
          </h3>
          <p className="mt-0.5 text-sm text-cacao/65">
            Une photo précise est mise en avant dans la bibliothèque. Certaines
            réalisations attirent bien plus de clientes que d&apos;autres.
          </p>
        </div>
      </div>

      {realisations.length === 0 ? (
        <p className="mt-4 rounded-xl2 bg-rose/20 px-4 py-3 text-sm text-cacao/70">
          Ajoute d&apos;abord une photo dans{" "}
          <Link
            href="/dashboard/portfolio"
            className="font-medium text-cacao underline underline-offset-2"
          >
            ton portfolio
          </Link>
          .
        </p>
      ) : (
        <>
          <p className="mb-2 mt-4 text-sm font-medium text-cacao/80">
            Choisis la réalisation
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {realisations.map((r) => {
              const active = r.id === selected;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelected(r.id)}
                  aria-label={r.label}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl2 border-2 transition ${
                    active ? "border-cacao" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.image}
                    alt={r.label}
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
          <DurationChips type="realisation" days={days} setDays={setDays} />
          <BuyButton price={price} balance={balance} />
        </>
      )}
    </form>
  );
}
