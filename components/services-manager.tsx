"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  addService,
  updateService,
  deleteService,
} from "@/app/dashboard/services/actions";
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
  duree_minutes: number | null;
  description: string | null;
}

interface FieldsInitial {
  univers: string;
  categorie: string;
  prestation: string;
  nameCustom: string;
  price: number | "";
  dureeH: number;
  dureeM: number;
  description: string;
}

export function ServicesManager({
  services,
  targetUserId,
}: {
  services: ServiceItem[];
  targetUserId?: string;
}) {
  const [state, action] = useActionState<ServiceResult, FormData>(
    addService,
    null
  );
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state?.ok) setFormKey((k) => k + 1);
  }, [state]);

  return (
    <div className="space-y-6">
      {/* Liste des services */}
      {services.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-sable bg-white px-6 py-12 text-center">
          <p className="font-medium text-cacao">
            Aucune prestation pour l&apos;instant
          </p>
          <p className="mt-1 text-sm text-cacao/50">
            Ajoute ta première prestation avec le formulaire ci-dessous.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-display text-xl">
            Tes prestations
            <span className="ml-2 align-middle text-base font-normal text-cacao/40">
              {services.length}
            </span>
          </h2>
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} targetUserId={targetUserId} />
          ))}
        </div>
      )}

      {/* Ajout d'un service */}
      <form
        key={formKey}
        action={action}
        className="space-y-3.5 rounded-4xl border border-sable bg-white p-5 shadow-soft"
      >
        {targetUserId && (
          <input type="hidden" name="target_user_id" value={targetUserId} />
        )}
        <h2 className="flex items-center gap-2 font-display text-xl">
          <Plus className="h-5 w-5 text-or" aria-hidden />
          Ajouter un service
        </h2>
        <ServiceFields />
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

/* ---------- Carte de service : affichage + édition complète en ligne ---------- */
function ServiceCard({
  service: s,
  targetUserId,
}: {
  service: ServiceItem;
  targetUserId?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState<ServiceResult, FormData>(
    updateService,
    null
  );

  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (editing) {
    return (
      <form
        action={action}
        className="space-y-3.5 rounded-xl2 border-2 border-or/70 bg-white p-4 shadow-soft animate-fade-in"
      >
        {targetUserId && (
          <input type="hidden" name="target_user_id" value={targetUserId} />
        )}
        <input type="hidden" name="service_id" value={s.id} />
        <h3 className="font-display text-lg">Modifier le service</h3>
        <ServiceFields initial={buildInitial(s)} />
        {state?.error && (
          <p className="rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao">
            {state.error}
          </p>
        )}
        <div className="flex gap-2">
          <SubmitButton>Enregistrer</SubmitButton>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="shrink-0 rounded-xl2 border border-sable px-4 py-3 text-sm font-medium text-cacao/70 transition hover:bg-rose/30"
          >
            Annuler
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-xl2 border border-sable bg-white p-4 transition duration-250 ease-soft hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {s.univers && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-cacao/40">
              {s.univers}
              {s.categorie ? ` · ${s.categorie}` : ""}
            </p>
          )}
          <p className="font-medium text-cacao">{s.name}</p>
          {s.description && (
            <p className="mt-1 text-sm text-cacao/60">{s.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Modifier ${s.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-cacao/50 transition hover:bg-rose/30 hover:text-cacao"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
          <form action={deleteService}>
            {targetUserId && (
              <input type="hidden" name="target_user_id" value={targetUserId} />
            )}
            <input type="hidden" name="service_id" value={s.id} />
            <button
              type="submit"
              aria-label={`Supprimer ${s.name}`}
              onClick={(e) => {
                if (!confirm(`Supprimer « ${s.name} » ?`)) e.preventDefault();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-cacao/40 transition hover:bg-rose/30 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="font-medium text-cacao">
          {formatPrice(s.price_min, s.price_max)}
          <span className="text-cacao/50"> FCFA</span>
        </span>
        {s.duree_estim && (
          <>
            <span className="text-cacao/30">·</span>
            <span className="text-cacao/55">{s.duree_estim}</span>
          </>
        )}
      </div>
    </div>
  );
}

// Valeurs initiales pour l'édition : déduit si la prestation vient du catalogue ou est "Autre".
function buildInitial(s: ServiceItem): FieldsInitial {
  const univers = s.univers ?? "";
  const categorie = s.categorie ?? "";
  const list = univers && categorie ? prestationsOf(univers, categorie) : [];
  const isCatalog = !!s.name && list.includes(s.name);
  return {
    univers,
    categorie,
    prestation: isCatalog ? s.name : s.name ? AUTRE : "",
    nameCustom: isCatalog ? "" : s.name ?? "",
    price: s.price_min,
    dureeH: s.duree_minutes ? Math.floor(s.duree_minutes / 60) : 0,
    dureeM: s.duree_minutes ? s.duree_minutes % 60 : 0,
    description: s.description ?? "",
  };
}

/* ---------- Champs d'un service (cascade univers/catégorie/prestation + prix/durée/desc) ---------- */
function ServiceFields({ initial }: { initial?: FieldsInitial }) {
  const [univers, setUnivers] = useState(initial?.univers ?? "");
  const [categorie, setCategorie] = useState(initial?.categorie ?? "");
  const [prestation, setPrestation] = useState(initial?.prestation ?? "");

  const categories = univers ? categoriesOf(univers).map((c) => c.nom) : [];
  const prestations =
    univers && categorie ? prestationsOf(univers, categorie) : [];

  return (
    <>
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
          defaultValue={initial?.nameCustom ?? ""}
          placeholder="Nom de la prestation"
          required
        />
      )}

      <Field
        label="Prix (FCFA)"
        name="price_min"
        type="number"
        inputMode="numeric"
        defaultValue={initial?.price ?? ""}
        placeholder="15000"
        required
      />

      <DureeFields
        defaultH={initial?.dureeH ?? 0}
        defaultM={initial?.dureeM ?? 0}
      />

      <Textarea
        label="Description (optionnel)"
        name="description"
        defaultValue={initial?.description ?? ""}
        placeholder="Détails, ce qui est inclus…"
      />
    </>
  );
}

function formatPrice(min: number, max: number | null): string {
  const f = (n: number) => n.toLocaleString("fr-FR");
  return max && max > min ? `${f(min)} – ${f(max)}` : f(min);
}

const fieldClass =
  "h-12 w-full rounded-xl2 border border-sable bg-white px-4 text-cacao transition focus:border-or focus:shadow-focus focus:outline-none disabled:opacity-50";

function DureeFields({
  defaultH = 0,
  defaultM = 0,
}: {
  defaultH?: number;
  defaultM?: number;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-cacao/80">
        Durée estimée (optionnel)
      </span>
      <div className="flex gap-2">
        <select
          name="duree_h"
          defaultValue={defaultH ? String(defaultH) : ""}
          className={fieldClass}
        >
          <option value="">Heures</option>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
            <option key={h} value={h}>
              {h} h
            </option>
          ))}
        </select>
        <select
          name="duree_min"
          defaultValue={defaultM ? String(defaultM) : ""}
          className={fieldClass}
        >
          <option value="">Minutes</option>
          {[0, 15, 30, 45].map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>
      </div>
    </div>
  );
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
        className={fieldClass}
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
        className="h-12 w-full rounded-xl2 border border-sable bg-white px-4 text-cacao placeholder:text-cacao/30 transition focus:border-or focus:shadow-focus focus:outline-none"
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
        className="w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao placeholder:text-cacao/30 transition focus:border-or focus:shadow-focus focus:outline-none"
      />
    </label>
  );
}
