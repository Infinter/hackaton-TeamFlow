---
title: 'Refonte visuelle globale — mode sombre, sidebar, accent violet'
type: 'feature'
created: '2026-06-19'
status: 'done'
baseline_commit: '14e58d149d43ff77ad7121014eecc82549623829'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'interface de TeamFlow utilise le thème shadcn par défaut — palette monochrome neutre, navigation horizontale. Le résultat est fonctionnel mais sans identité visuelle.

**Approach:** Refonte du design system en mode sombre par défaut avec accent violet inspiré de Notion/Figma/Claude Code — sidebar fixe à gauche, nouvelle palette CSS, typographie resserrée.

## Boundaries & Constraints

**Always:**
- Conserver toutes les fonctionnalités existantes (liens, auth, signOut, filtres, rôles)
- Utiliser uniquement les variables CSS de `globals.css` — aucune couleur codée en dur dans les composants
- La palette doit couvrir `:root` (clair) ET `.dark` (sombre) — `.dark` est le défaut via classe sur `<html>`
- Rester dans le système Tailwind + shadcn existant — pas de nouvelle librairie CSS

**Ask First:**
- Si une page individuelle (tasks, board, workload) nécessite des changements structurels au-delà de l'héritage du layout

**Never:**
- Toucher la logique métier, Server Actions, requêtes Supabase
- Remplacer les composants shadcn/ui — les adapter via les variables CSS uniquement
- Ajouter une librairie d'icônes externe — SVG inline ou texte pour la sidebar

## I/O & Edge-Case Matrix

| Scenario | État | Comportement attendu | Gestion erreur |
|----------|------|----------------------|----------------|
| Manager connecté | `role === 'manager'` | Item "Charge" visible dans la sidebar | — |
| Collaborateur connecté | `role !== 'manager'` | Item "Charge" absent de la sidebar | — |
| Page active | URL = href d'un item nav | Item sidebar mis en évidence visuellement | — |
| Mobile < 768px | Viewport étroit | Sidebar masquée, contenu plein écran, pas de chevauchement | — |

</frozen-after-approval>

## Code Map

- `teamflow/src/app/globals.css` — variables CSS globales : palette, radius, sidebar tokens
- `teamflow/src/app/layout.tsx` — racine HTML : ajouter classe `dark`
- `teamflow/src/app/(app)/layout.tsx` — layout principal : top nav → sidebar + main content
- `teamflow/src/app/login/page.tsx` — page de connexion : adapter au fond sombre
- `teamflow/src/components/tasks/StatusBadge.tsx` — badges statut : harmoniser avec la nouvelle palette

## Tasks & Acceptance

**Execution:**
- [x] `teamflow/src/app/globals.css` — remplacer les valeurs de toutes les variables `:root` et `.dark` par la nouvelle palette sombre/violette (voir Design Notes) ; ajuster `--radius` à `0.5rem` ; conserver toutes les variables existantes, modifier leurs valeurs uniquement
- [x] `teamflow/src/app/layout.tsx` — ajouter `dark` aux `className` de `<html>` pour activer le mode sombre par défaut
- [x] `teamflow/src/app/(app)/layout.tsx` — réécrire : (1) garder la partie Server Component qui appelle `getCurrentProfile()` et calcule `isManager`/`visibleNavItems` ; (2) extraire le rendu de la sidebar dans un Client Component `<SidebarNav>` qui reçoit `visibleNavItems` en props et utilise `usePathname()` pour l'item actif ; (3) layout flex-row : sidebar 220px fixe + `<main>` flex-1 avec `overflow-y-auto`
- [x] `teamflow/src/app/login/page.tsx` — centrer le formulaire sur fond sombre avec une card légèrement élevée (`bg-card border border-border rounded-xl p-8`) ; aucun changement logique
- [x] `teamflow/src/components/tasks/StatusBadge.tsx` — ajuster les couleurs des badges `in_progress` et `done` pour cohérence avec la palette violet/sombre (éviter les bleus trop saturés sur fond sombre)

**Acceptance Criteria:**
- Given l'app chargée sans classe CSS manuelle, when la page s'affiche, then le fond est sombre et l'accent violet est visible dans la sidebar et les éléments primaires
- Given un utilisateur connecté, when il navigue entre Dashboard / Tâches / Tableau, then la sidebar reste fixe et l'item correspondant à l'URL courante est visuellement distinct des autres
- Given un manager connecté, when la sidebar s'affiche, then l'item "Charge" est présent ; pour un collaborateur, il est absent
- Given un viewport < 768px, when la page s'affiche, then la sidebar est masquée et le contenu occupe toute la largeur sans chevauchement
- Given le build Next.js, when `npm run build` s'exécute, then aucune erreur TypeScript ni de compilation

## Design Notes

Palette cible (variables `.dark`, inspirée Claude Code/Figma) :

```
--background:         oklch(0.12 0.02 285)   /* fond quasi-noir, légère teinte violet */
--foreground:         oklch(0.93 0.01 285)   /* blanc cassé */
--card:               oklch(0.17 0.02 285)   /* surfaces élevées */
--card-foreground:    oklch(0.93 0.01 285)
--sidebar:            oklch(0.14 0.02 285)   /* sidebar — distinct du fond */
--sidebar-foreground: oklch(0.80 0.02 285)
--primary:            oklch(0.65 0.25 285)   /* violet vif */
--primary-foreground: oklch(0.98 0 0)
--muted:              oklch(0.20 0.02 285)
--muted-foreground:   oklch(0.58 0.04 285)
--border:             oklch(1 0 0 / 0.08)    /* bordures très subtiles */
--input:              oklch(1 0 0 / 0.10)
--ring:               oklch(0.65 0.25 285)   /* focus ring = accent */
--sidebar-accent:     oklch(0.65 0.25 285 / 0.12) /* item actif sidebar bg */
--sidebar-accent-foreground: oklch(0.65 0.25 285)  /* item actif sidebar texte */
```

Palette `:root` (light mode, non-default) : garder les valeurs shadcn actuelles — le mode clair n'est pas la priorité.

Sidebar structure : `<aside>` flex-col, logo + titre en haut, `<nav>` avec items au milieu, `<form>` signOut en bas. Item actif : `bg-sidebar-accent text-sidebar-accent-foreground font-medium`. Sur mobile (`md:hidden` sur `<aside>`) : masquée, pas de drawer pour ce sprint.

Split Server/Client layout : la page parent reste `async function AppLayout()` Server Component ; elle rend `<SidebarNav items={visibleNavItems} />` qui est `'use client'` et gère `usePathname`.

## Verification

**Commands:**
- `cd teamflow && npm run build` -- expected: compilation sans erreur TypeScript ni ESLint

**Manual checks:**
- `/login` : fond sombre, formulaire centré sur une card, pas de zone blanche visible
- `/tasks` connecté : sidebar à gauche, item "Tâches" mis en évidence, contenu à droite
- Connecté en tant que collaborateur : "Charge" absent de la sidebar
- Viewport 375px : sidebar masquée, contenu plein écran

## Spec Change Log

## Suggested Review Order

**Design system — palette et tokens**

- Entrée principale : toutes les variables CSS sombre/violet, nouveaux tokens `--success`
  [`globals.css:53`](../../teamflow/src/app/globals.css#L53)

- Activation du mode sombre : classe `dark` sur `<html>`, rend `.dark` toujours actif
  [`layout.tsx:29`](../../teamflow/src/app/layout.tsx#L29)

**Restructure du layout — sidebar**

- Nouveau layout flex-row : `<aside>` sidebar + `<main>` flex-1
  [`(app)/layout.tsx:28`](../../teamflow/src/app/(app)/layout.tsx#L28)

- Délégation au client component `<SidebarNav>` avec filtrage rôle en amont
  [`(app)/layout.tsx:38`](../../teamflow/src/app/(app)/layout.tsx#L38)

**Client component SidebarNav — navigation active**

- `usePathname` + `aria-current`, détection item actif par exact match ou prefix
  [`SidebarNav.tsx:72`](../../teamflow/src/components/SidebarNav.tsx#L72)

- Icônes SVG inline par href avec fallback `DefaultIcon` pour routes futures
  [`SidebarNav.tsx:60`](../../teamflow/src/components/SidebarNav.tsx#L60)

**Page de connexion**

- Card élevée centrée sur `bg-background` — même fond sombre, surface distincte
  [`login/page.tsx:19`](../../teamflow/src/app/login/page.tsx#L19)

**Badges statut**

- `done` badge utilise `--success` CSS variable pour respecter la contrainte no-hardcode
  [`StatusBadge.tsx:6`](../../teamflow/src/components/tasks/StatusBadge.tsx#L6)
