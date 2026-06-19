# Story 3.2: Surcharges & retards (FR7)

Status: ready-for-dev

## Story

En tant que **manager**,
je veux **repérer visuellement les collaborateurs en surcharge et les tâches en retard**,
afin de **réagir avant que la situation ne dégénère**.

## Acceptance Criteria

1. **Surcharge** — quand la charge agrégée d'un collaborateur dépasse sa `weekly_capacity_hours`, `OverloadFlag` / `CapacityIndicator` met sa barre en évidence.
2. **Retard** — une tâche dont `due_date < now()` et `status <> 'done'` est marquée « en retard » visuellement (portefeuille et/ou tableau de bord).
3. **État sain** — aucune surcharge ni retard ⇒ aucun signal d'alerte affiché.

## Tasks / Subtasks

- [ ] Logique SQL surcharge/retard (AC: #1, #2)
  - [ ] Étendre `supabase/views_workload.sql` : indicateur de surcharge (`charge > weekly_capacity_hours`) et critère de retard (`due_date < now() AND status <> 'done'`)
- [ ] Composants d'alerte (AC: #1, #2, #3)
  - [ ] `src/components/workload/OverloadFlag.tsx`, `CapacityIndicator.tsx`
  - [ ] Marquage « en retard » réutilisable

## Dev Notes

- Surcharge : `charge_agrégée > weekly_capacity_hours`. Retard : `due_date < now() AND status <> 'done'`. [Source: architecture.md#Moteur de calcul de charge (vues Postgres)]
- Tout dans `views_workload.sql` (Épique 3), pas dans `schema.sql`. [Source: epics.md#Contrat anti-conflits Git]
- Composants dans `src/components/workload/` (possédé par l'Épique 3). Si le marquage « en retard » doit apparaître dans le portefeuille (Épique 1), exposer un petit composant/utilitaire dans `workload/` consommé en lecture seule — ne pas modifier les fichiers de l'Épique 1.

### Project Structure Notes

- Fichiers : extension `supabase/views_workload.sql`, `src/components/workload/{OverloadFlag,CapacityIndicator}.tsx`.
- Dépend de 3.1 (vues de charge existantes). Aucune dépendance vers l'Épique 2.

### References

- FR7 [Source: prd.md#Requirements]
- [Source: epics.md#Story 3.2 : Surcharges & retards (FR7)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
