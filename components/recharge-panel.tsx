"use client";

import { useActionState, useState } from "react";
import { startRecharge, type RechargeResult } from "@/app/dashboard/credit/recharge-actions";

const PRESETS = [2000, 5000, 10000, 20000];

export function RechargePanel() {
  const [state, action] = useActionState<RechargeResult, FormData>(
    startRecharge,
    null
  );
  const [amount, setAmount] = useState<number>(5000);

  return (
    <form
      action={action}
      className="mt-5 rounded-4xl border border-sable bg-white p-5 shadow-soft"
    >
      <p className="font-medium text-cacao">Recharger mon Crédit Zuri</p>
      <p className="mt-1 text-sm text-cacao/60">
        Paiement Mobile Money (Airtel / Moov) via la page sécurisée SingPay.
        1&nbsp;FCFA = 1&nbsp;Zuri.
      </p>

      <input type="hidden" name="amount" value={amount} />

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((v) => {
          const active = amount === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className={
                active
                  ? "rounded-full bg-cacao px-4 py-1.5 text-sm font-medium text-ivoire"
                  : "rounded-full border border-sable px-4 py-1.5 text-sm text-cacao/70 transition duration-250 ease-soft hover:bg-rose/30 hover:text-cacao"
              }
            >
              {v.toLocaleString("fr-FR")}
            </button>
          );
        })}
      </div>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-sm font-medium text-cacao/80">
          Ou un autre montant (FCFA)
        </span>
        <input
          type="number"
          min={500}
          step={500}
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          className="h-12 w-full rounded-xl2 border border-sable bg-white px-4 text-cacao transition focus:border-or focus:shadow-focus focus:outline-none"
        />
      </label>

      {state?.error && (
        <p className="mt-3 rounded-xl2 bg-rose/60 px-4 py-2.5 text-sm text-cacao">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        className="mt-4 w-full rounded-xl2 bg-cacao px-5 py-3 text-sm font-medium text-ivoire transition duration-250 ease-soft hover:bg-cacao/90 active:scale-[0.98]"
      >
        Payer {amount.toLocaleString("fr-FR")} FCFA
      </button>
    </form>
  );
}
