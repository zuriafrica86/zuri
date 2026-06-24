"use client";

import { useActionState, useEffect, useState } from "react";
import { addService, deleteService } from "@/app/dashboard/services/actions";
import type { ServiceResult } from "@/app/dashboard/services/types";
import { SubmitButton } from "@/components/submit-button";
import { universList, categoriesOf, prestationsOf, AUTRE } from "@/lib/catalog";

export interface ServiceItem {
  id: string;
  name: string;
  univers: string | null;
  categorie: string | null;
  category: string | null;
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
  const [univers, setUnivers] = useState("");
  const [categorie, setCategorie] = useState("");
  const [prestation, setPrestation] = useState("");
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state?.ok) {
      setUnivers("");
      setCategorie("");
      setPrestation("");
      setFormKey((k) => k + 1);
    }
  }, [state]);

  const categories = univers ? categoriesOf(univers).map((c) => c.nom) : [];
  const prestations =
    univers && categorie ? prestationsOf(univers, categorie) : [];

  return (
    <div className="space-y-8">
      {/* Liste des services */}
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
            className="flex items-start justify-between rounded-xl2 border border-sable bg-ivoire p-4"
          >
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs uppercase tracking-wide text-or">
                {s.univers}
                {s.categorie ? ` · ${s.categorie}` : ""}
              </p>
              <p className="mt-0.5 text-sm text-cacao/70">
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

      {/* Ajout d'un service */}
      <form
        key={formKey}
        action={action}
        className="space-y-4 rounded-xl2 border border-sable bg-ivoire p-5"
      >
        <h2 className="font-display text-xl">Ajouter un service</h2>

        <Select
          label="Univers"
          name="univers"
          value={univers}
          onChange={(v) => {
            setUnivers(v);
            setCategorie("");
            setPrestation("");
          }}
          options={universList()}
          placeholder="Choisir un univers"
        />

        <Select
          label="Catégorie"
          name="categorie"
          value={categorie}
          onChange={(v) => {
            setCategorie(v);
            setPrestation("");
          }}
          options={categories}
          placeholder="Choisir une catégorie"
          disabled={!univers}
        />

        <Select
          label="Prestation"
          name="prestation"
          value={prestation}
          onChange={setPrestation}
          options={prestations}
          placeholder="Choisir une prestation"
          disabled={!categorie}
        />

        {prestation === AUTRE && (
          <Field
            label="Précise ta prestation"
            name="name_custom"
            placeholder="Nom de la prestation"
            required
          />
        )}

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

        <Field label="Durée estimée (optionnel)" name="duree_estim" placeholder="4-6h" />

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

function Select({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cacao/80">
        {label}
      </span>
      <select
        name={name}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl2 border border-sable bg-ivoire px-4 py-3 text-cacao disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
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
        className="w-full rounded-xl2 border border-sable bg-ivoire px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or"
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
        className="w-full rounded-xl2 border border-sable bg-ivoire px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or"
      />
    </label>
  );
}
