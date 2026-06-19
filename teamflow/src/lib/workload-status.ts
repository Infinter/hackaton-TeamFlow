// Logique de surcharge (FR7) — fonctions PURES, sans I/O.
// La surcharge est dérivée des données déjà renvoyées par `workload_by_assignee`
// (Story 3.1) : aucune requête SQL dédiée. Colocalisable avec un test unitaire
// dès qu'un runner de tests sera installé.

export type CapacityState = "ok" | "near" | "over";

// Seuil d'alerte « proche de la capacité » : 90 % de la capacité.
const NEAR_THRESHOLD = 0.9;

// État de capacité d'un collaborateur :
//  - "over"  : charge strictement supérieure à la capacité (surcharge, AC#1)
//  - "near"  : charge >= 90 % de la capacité (vigilance, sans être en surcharge)
//  - "ok"    : situation saine (AC#3)
// Capacité nulle ou négative : tout chargement > 0 est traité comme surcharge,
// une charge nulle reste "ok" (pas de division, pas d'alerte injustifiée).
export function capacityState(load: number, capacity: number): CapacityState {
  if (load > capacity) return "over";
  if (capacity > 0 && load >= capacity * NEAR_THRESHOLD) return "near";
  return "ok";
}

// Vrai si le collaborateur est en surcharge (charge agrégée > capacité hebdo).
export function isOverloaded(row: {
  total_load_hours: number;
  weekly_capacity_hours: number;
}): boolean {
  return (
    capacityState(
      Number(row.total_load_hours),
      Number(row.weekly_capacity_hours),
    ) === "over"
  );
}

// Taux d'avancement global (FR8) en pourcentage entier arrondi : ratio des tâches
// terminées sur le total. Fonction PURE, sans I/O.
// Garde-fou (AC#4) : total <= 0 → 0 % (jamais de division par zéro / NaN).
export function completionRate(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}
