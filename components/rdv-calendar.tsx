"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Lock,
  Loader2,
} from "lucide-react";
import { useActionState } from "react";
import {
  requestBooking,
  getAvailableSlots,
} from "@/app/coiffeuse/booking-actions";
import type { BookingResult } from "@/app/coiffeuse/booking-types";
import { SubmitButton } from "@/components/submit-button";

export interface RdvService {
  id: string;
  name: string;
  price_min: number;
  price_max: number | null;
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function RdvCalendar({
  providerId,
  services,
  preselectedServiceId,
  availableWeekdays,
}: {
  providerId: string;
  services: RdvService[];
  preselectedServiceId?: string;
  availableWeekdays: number[];
}) {
  const [state, action] = useActionState<BookingResult, FormData>(
    requestBooking,
    null
  );

  const [serviceId, setServiceId] = useState(preselectedServiceId ?? "");
  const today = new Date();
  const todayStr = ymd(today);
  const [view, setView] = useState({
    y: today.getFullYear(),
    m: today.getMonth() + 1,
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Si la prestation change, on remet à zéro le choix de jour/heure.
  useEffect(() => {
    setSelectedDate(null);
    setSlots(null);
    setSelectedTime(null);
  }, [serviceId]);

  async function pickDay(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setSlots(null);
    setLoading(true);
    try {
      const s = await getAvailableSlots(providerId, serviceId || null, dateStr);
      setSlots(s);
    } finally {
      setLoading(false);
    }
  }

  if (state?.ok) {
    return (
      <div className="mt-6 rounded-xl2 border border-sable bg-white p-5 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-600" aria-hidden />
        <h2 className="mt-2 font-display text-xl">Demande envoyée !</h2>
        <p className="mt-2 text-cacao/70">
          La Zuriste va confirmer ton rendez-vous. Tu recevras son contact
          WhatsApp dès qu&apos;elle aura accepté.
        </p>
        <Link
          href="/recherche"
          className="mt-4 inline-block rounded-xl2 bg-or px-4 py-2 font-medium text-cacao hover:bg-or-clair"
        >
          Découvrir d&apos;autres Zuristes →
        </Link>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="mt-6 rounded-xl2 border border-sable bg-white p-5 text-cacao/70">
        Cette Zuriste n&apos;a pas encore de prestations réservables.
      </div>
    );
  }

  // Construction de la grille du mois (lundi en premier)
  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const firstWeekday = new Date(view.y, view.m - 1, 1).getDay();
  const offset = (firstWeekday + 6) % 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(view.y, view.m - 1, 1));

  function shiftMonth(delta: number) {
    const d = new Date(view.y, view.m - 1 + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }
  // ne pas reculer avant le mois courant
  const atCurrentMonth =
    view.y === today.getFullYear() && view.m === today.getMonth() + 1;

  const noAvailability = availableWeekdays.length === 0;

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="provider_id" value={providerId} />
      <input type="hidden" name="service_id" value={serviceId} />
      <input type="hidden" name="date_souhaitee" value={selectedDate ?? ""} />
      <input type="hidden" name="heure_souhaitee" value={selectedTime ?? ""} />

      {/* 1. Prestation */}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-cacao/80">
          1. Choisis ta prestation
        </span>
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao focus:border-or"
        >
          <option value="">— Choisir —</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — dès {s.price_min.toLocaleString("fr-FR")} FCFA
            </option>
          ))}
        </select>
      </label>

      {noAvailability && (
        <p className="rounded-xl2 bg-rose/50 px-4 py-3 text-sm text-cacao">
          Cette Zuriste n&apos;a pas encore indiqué ses disponibilités. Reviens
          bientôt !
        </p>
      )}

      {/* 2. Jour */}
      {serviceId && !noAvailability && (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-cacao/80">
            2. Choisis un jour
          </span>
          <div className="rounded-xl2 border border-sable bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                disabled={atCurrentMonth}
                aria-label="Mois précédent"
                className="rounded-lg p-1.5 text-cacao/70 hover:bg-rose/30 disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <span className="text-sm font-medium capitalize text-cacao">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Mois suivant"
                className="rounded-lg p-1.5 text-cacao/70 hover:bg-rose/30"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-[11px] text-cacao/50">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />;
                const date = new Date(view.y, view.m - 1, d);
                const dateStr = ymd(date);
                const weekday = date.getDay();
                const isPast = dateStr < todayStr;
                const open = availableWeekdays.includes(weekday);
                const disabled = isPast || !open;
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => pickDay(dateStr)}
                    className={`aspect-square rounded-lg text-sm transition ${
                      isSelected
                        ? "bg-or font-semibold text-cacao"
                        : disabled
                          ? "text-cacao/25"
                          : "text-cacao hover:bg-ivoire"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Créneau */}
      {selectedDate && (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-cacao/80">
            3. Choisis un créneau
          </span>
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl2 border border-sable bg-white px-4 py-4 text-sm text-cacao/60">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Recherche
              des créneaux…
            </div>
          ) : slots && slots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTime(t)}
                  className={`rounded-xl2 border px-2 py-2.5 text-sm transition ${
                    selectedTime === t
                      ? "border-or bg-or font-semibold text-cacao"
                      : "border-sable bg-white text-cacao hover:border-or"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl2 border border-sable bg-white px-4 py-3 text-sm text-cacao/60">
              Aucun créneau disponible ce jour. Essaie une autre date.
            </p>
          )}
        </div>
      )}

      {/* 4. Mot + envoi */}
      {selectedTime && (
        <>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-cacao/80">
              Un mot pour la Zuriste (optionnel)
            </span>
            <textarea
              name="note"
              rows={3}
              placeholder="Ex : box braids longueur taille"
              className="w-full rounded-xl2 border border-sable bg-white px-4 py-3 text-cacao placeholder:text-cacao/30 focus:border-or"
            />
          </label>

          {state?.error && (
            <p className="rounded-xl2 bg-rose/60 px-4 py-2 text-sm text-cacao">
              {state.error}
            </p>
          )}

          <SubmitButton>Réserver ce créneau</SubmitButton>
          <p className="text-center text-xs text-cacao/50">
            <Lock
              className="mr-1 inline h-3.5 w-3.5 align-[-0.15em]"
              aria-hidden
            />
            Le numéro de la Zuriste te sera communiqué une fois le RDV confirmé.
          </p>
        </>
      )}
    </form>
  );
}
