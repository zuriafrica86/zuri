"use client";

import { useActionState, useEffect, useState } from "react";
import { addService, deleteService } from "@/app/dashboard/services/actions";
import type { ServiceResult } from "@/app/dashboard/services/types";
import { SubmitButton } from "@/components/submit-button";

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price_min: number;
  price_max: number | null;
  duree_estim: string | null;
  description: string | null;
}

export function ServicesManager({ services }: { services: ServiceItem[] }) {
  const [state, action] = useActionState<ServiceResult, FormData>(
    addService,
    null
  );
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state?.ok) setFormKey((k) => k + 1);
  }, [state]);

  return (
    <div className="space-y-8">
      {/* Liste des services existants */}
      <div className="space-y-3">
        {services.length === 0 && (
          <p className="text-sm text-cacao/50">
            Aucun service pour l&apos;instant. Ajoute ta première prestation
            ci-dessous.
          </p>
        )}
        {services.map((s) => (
          <div
            key={s.id}
            className="flex items-start justify-between rounded-xl2 border border-sable bg-white p-4"
          >
            <div>
              <p className="font-medium">
                {s.name}{" "}
                <span className="text-xs uppercase tracking-wide text-or">
                  {s.category}
                </span>
              </p>
              <p className="text-sm text-cacao/70">
                {formatPrice(s.price_min, s.price_max)} FCFA
                {s.duree_estim ? ` · ${s.duree_estim}` : ""}
              </p>
              {s.description && (
                <p className="mt-1 text-sm text-cacao/60">{s.description}</p>
              )}
            </div>
            <form action={deleteService}>
              <input type="hidden" name="service_id" value={s.id} />
              <button
                type="submit"
                className="rounded-lg px-2 py-1 text-sm text-cacao/50 hover:bg-rose/30 hover:text-cacao"
                aria-label={`Supprimer ${s.name}`}
              >
                Supprimer
              </button>
            </form>
          </div>
        ))}
      </div>

      {/* Formulaire d'ajout */}
      <form
        key={formKey}
        action={action}
        className="space-y-4 rounded-xl2 border border-sable bg-white p-5"
      >
        <h2 className="font-display text-xl">Ajouter un service</h2>

        <Field label="Nom du service" name="name" placeholder="Box braids longues" required />

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-cacao/80">
              Catégorie
            </span>
            <select
              name="category"
              defaultValue="tresses"
              className="w-full rounded-xl2 border border-sable bg-white px-4 py-3"
            >
              <option value="tresses">Tresses</option>
              <option value="coiffure">Coiffure</option>
            </select>
          </label>
          <Field
            label="Durée estimée"
            name="duree_estim"
            placeholder="4-6h"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Prix de départ (FCFA)"
            name="price_min"
            type="number"
            inputMode="numeric"
            placeholder="15000"
            required
          />
          <Field
            label="Prix max (optionnel)"
            name="price_max"
            type="number"
            inputMode="numeric"
            placeholder="25000"
          />
        </div>

        <Textarea
          label="Description (optionnel)"
          name="description"
          placeholder="Détails, ce qui est inclus…"
        />

        {state?.error && (
          <p className="rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao">
            {state.error}
          </p>
        )}

        <SubmitButton>Ajouter le service</SubmitButton>
      </form>
    </div>
  );
}

function formatPrice(min: number, max: number | null): string {
  const f = (n: number) => n.toLocaleString("fr-FR");
  return max && max > min ? `${f(min)} – ${f(max)}` : `dès ${f(min)}`;
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cacao/80">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or"
      />
    </label>
  );
}

function Textarea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cacao/80">
        {label}
      </span>
      <textarea
        {...props}
        rows={2}
        className="w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or"
      />
    </label>
  );
}
