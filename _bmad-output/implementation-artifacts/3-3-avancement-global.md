# Story 3.3: Avancement global du portefeuille (FR8)

Status: ready-for-dev

## Story

En tant que **manager**,
je veux **un indicateur d'avancement global du portefeuille**,
afin de **suivre la progression d'ensemble d'un coup d'œil**.

## Acceptance Criteria

1. **Indicateur** — sur `/dashboard`, un indicateur d'avancement global (ratio des tâches `done` sur le total) est affiché (pourcentage et/ou barre).
2. **Synthèse** — le tableau de bord rappelle une synthèse des surcharges et retards (Story 3.2).
3. **NFR1** — après qu'une tâche passe `done` ailleurs (et `revalidatePath`), l'indicateur reflète le nouvel état en moins de 2 secondes au rechargement.
4. **Cas vide** — portefeuille vide (0 tâche) ⇒ indicateur géré sans division par zéro.

## Tasks / Subtasks

- [ ] Vue d'avancement (AC: #1, #4)
  - [ ] Ajouter à `supabase/views_workload.sql` le ratio `done`/total (option : pondéré par heures)
- [ ] Tableau de bord (AC: #1, #2, #3, #4)
  - [ ] `src/app/(app)/dashboard/page.tsx` (indicateur global + rappel surcharges/retards)
  - [ ] Lecture via `src/lib/workload.ts`

## Dev Notes

- Avancement global (FR8) = ratio des tâches `done` sur le total (option pondérée par heures). [Source: architecture.md#Moteur de calcul de charge (vues Postgres)]
- Le rafraîchissement repose sur `revalidatePath` déclenché par les mutations des autres épiques — **couplage par revalidation, pas par code** : `/dashboard` relit simplement les vues. [Source: epics.md#Contrat anti-conflits Git]
- Gérer le cas 0 tâche (pas de division par zéro). [Source: epics.md#Story 3.3]
- `/dashboard` est la page de redirection par défaut après login (cohérence avec 1.1/1.2).

### Project Structure Notes

- Fichiers : extension `supabase/views_workload.sql`, `src/app/(app)/dashboard/page.tsx`.
- Dépend de 3.1 (vues) et 3.2 (synthèse surcharges/retards). Aucune dépendance de code vers les Épiques 1/2.

### References

- FR8 [Source: prd.md#Requirements]
- [Source: epics.md#Story 3.3 : Avancement global du portefeuille (FR8)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
