// Calcul des créneaux disponibles (logique pure, testable, sans accès réseau).
// Principe : pour chaque plage de disponibilité du jour, on génère des départs
// pas à pas, et on retire ceux qui chevauchent un RDV déjà pris.

export const SLOT_STEP_MIN = 30; // un créneau proposé toutes les 30 min
export const BUFFER_MIN = 0; // battement entre deux RDV
export const DEFAULT_SERVICE_MIN = 60; // durée par défaut si non renseignée

export type Range = { start: string; end: string };
export type Busy = { start: string; minutes: number };

function toMin(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return h * 60 + (m || 0);
}
function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function computeSlots(opts: {
  ranges: Range[];
  busy: Busy[];
  serviceMinutes: number;
  stepMin?: number;
  bufferMin?: number;
  minStartMin?: number; // départ minimum autorisé (ex. heure actuelle si aujourd'hui)
}): string[] {
  const step = opts.stepMin ?? SLOT_STEP_MIN;
  const buffer = opts.bufferMin ?? BUFFER_MIN;
  const dur = opts.serviceMinutes > 0 ? opts.serviceMinutes : DEFAULT_SERVICE_MIN;
  const minStart = opts.minStartMin ?? 0;

  const busy = opts.busy.map((b) => {
    const s = toMin(b.start);
    return [s - buffer, s + (b.minutes || DEFAULT_SERVICE_MIN) + buffer] as [
      number,
      number
    ];
  });

  const out: string[] = [];
  for (const r of opts.ranges) {
    const rs = toMin(r.start);
    const re = toMin(r.end);
    for (let t = rs; t + dur <= re; t += step) {
      if (t < minStart) continue;
      const end = t + dur;
      const overlaps = busy.some(([bs, be]) => t < be && end > bs);
      if (!overlaps) out.push(toHHMM(t));
    }
  }
  return [...new Set(out)].sort();
}
