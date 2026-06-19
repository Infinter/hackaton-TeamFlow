# TeamFlow Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Permettre la création et la gestion d'un portefeuille de tâches centralisé.
- Répartir le travail entre plusieurs collaborateurs de façon claire et traçable.
- Donner aux managers une vision en temps réel de la charge de chaque membre de l'équipe.
- Faciliter l'ajustement rapide des affectations lorsque les priorités évoluent.
- Suivre l'avancement global du travail et identifier les points de saturation ou les retards.

### Background Context

Une organisation doit répartir un volume de tâches entre plusieurs collaborateurs tout en garantissant une distribution équilibrée, le respect des échéances et l'absence de surcharge. Aujourd'hui, ces arbitrages reposent souvent sur des outils dispersés (tableurs, messageries, suivis informels) qui rendent la charge réelle de chacun difficile à percevoir et l'adaptation aux changements de priorités laborieuse.

TeamFlow vise à fournir un espace unique où les tâches sont créées, confiées, planifiées, exécutées et suivies. L'application doit rendre visible la charge de chaque personne, mettre en évidence les goulets d'étranglement et permettre au manager de réagir vite quand le contexte change.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-06-19 | 0.1 | Création initiale du PRD | John (PM) |

## Requirements

### Functional

1. **FR1:** Le système permet à un utilisateur autorisé de créer une tâche avec un titre, une description, une priorité, une estimation de charge (en heures ou jours) et une échéance.
2. **FR2:** Le système permet de consulter le portefeuille complet des tâches avec filtres (statut, assigné, priorité, échéance).
3. **FR3:** Le manager peut affecter une tâche à un collaborateur, et réaffecter une tâche existante à une autre personne.
4. **FR4:** Le système permet de planifier une tâche en lui attribuant une date de début et une échéance.
5. **FR5:** Le collaborateur peut mettre à jour le statut d'avancement d'une tâche (ex. À faire, En cours, Terminé) et y consigner sa progression.
6. **FR6:** Le système calcule et affiche la charge de travail agrégée par collaborateur sur une période donnée.
7. **FR7:** Le système met en évidence visuellement les situations de surcharge (charge supérieure à la capacité) et les tâches en retard (échéance dépassée et non terminées).
8. **FR8:** Le système affiche un indicateur d'avancement global de l'ensemble du portefeuille de tâches.
9. **FR9:** Le manager peut ajuster les affectations et la planification par une interaction simple (ex. glisser-déposer ou édition directe) et voir l'impact immédiat sur la charge.
10. **FR10:** Le système distingue deux rôles, Collaborateur et Manager, avec des permissions différenciées (le Manager affecte et planifie ; le Collaborateur consulte et met à jour ses propres tâches).

### Non Functional

1. **NFR1:** Les vues de charge et d'avancement doivent refléter les changements d'affectation en moins de 2 secondes.
2. **NFR2:** L'interface doit être utilisable sans formation préalable pour les actions clés (créer, affecter, planifier, suivre).
3. **NFR3:** L'application doit rester lisible et fonctionnelle pour une équipe allant jusqu'à 50 collaborateurs et plusieurs centaines de tâches actives.
4. **NFR4:** Les données de tâches et d'affectations doivent être persistées de manière fiable et cohérente.
5. **NFR5:** L'accès aux fonctions est conditionné par le rôle de l'utilisateur (contrôle d'accès basé sur les rôles).

