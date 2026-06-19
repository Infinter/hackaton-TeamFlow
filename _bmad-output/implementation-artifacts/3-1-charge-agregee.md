# Story 3.1: Charge agrégée par collaborateur (FR6)

Status: ready-for-dev

## Story

En tant que **manager**,
je veux **voir la charge de travail agrégée de chaque collaborateur sur une période**,
afin de **comprendre comment le travail est réparti**.

## Acceptance Criteria

1. **Vue SQL** — `supabase/views_workload.sql` expose une vue de charge : `SUM(estimated_load_hours)` des tâches non `done` chevauchant la période, regroupée par `assignee_id`.
2. **Page charge** — sur `/workload`, après choix d'une période, `lib/workload.ts` lit la vue et `WorkloadBar` affiche la charge par collaborateur (heures cumulées vs `weekly_capacity_hours`).
3. **Charge nulle** — un collaborateur sans tâche active sur la période apparaît à 0 (et non absent).

## Tasks / Subtasks

- [ ] Vue SQL de charge (AC: #1)
  - [ ] `supabase/views_workload.sql` (fichier DÉDIÉ Épique 3, séparé de `schema.sql`) — exécuter dans Supabase
- [ ] Lecture de la charge (AC: #2, #3)
  - [ ] `src/lib/workload.ts` → lecture de la vue (période en paramètre)
- [ ] Page & composant (AC: #2, #3)
  - [ ] `src/app/(app)/workload/page.tsx` (sélecteur de période)
  - [ ] `src/components/workload/WorkloadBar.tsx`

## Dev Notes

- ⚠️ **Frontière Git** : les vues SQL vont dans **`supabase/views_workload.sql`** (PAS dans `schema.sql`, possédé par l'Épique 1) pour éviter tout conflit de merge. [Source: epics.md#Contrat anti-conflits Git]
- Moteur de charge exposé en **vues Postgres** (ou RPC) : une requête lisible et performante. [Source: architecture.md#Moteur de calcul de charge (vues Postgres)]
- Charge (FR6) = `SUM(estimated_load_hours)` des tâches non `done` chevauchant la période, groupé par `assignee_id`. [Source: architecture.md#Moteur de calcul de charge (vues Postgres)]
- Lecture en Server Component via `lib/workload.ts` (qui utilise `lib/supabase/server`). [Source: architecture.md#Flux de données]
- Volumes triviaux pour Postgres (NFR3 ≤ 50 users). [Source: architecture.md#Analyse du Contexte Projet]

### Project Structure Notes

- Fichiers : `supabase/views_workload.sql`, `src/lib/workload.ts`, `src/app/(app)/workload/page.tsx`, `src/components/workload/WorkloadBar.tsx`.
- Répertoires `workload/**` + `lib/workload.ts` possédés par l'Épique 3. Travaille sur les données de seed — aucune dépendance vers l'Épique 2.

### References

- FR6 [Source: prd.md#Requirements]
- [Source: epics.md#Story 3.1 : Charge agrégée par collaborateur (FR6)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
