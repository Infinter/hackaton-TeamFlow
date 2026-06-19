---
baseline_commit: 82914a53c7d100cde5112f379aab1369e4983db4
---

# Story 1.4 : Portefeuille filtrable

Status: review

## Story

En tant qu'**utilisateur** (manager ou collaborateur),
je veux **consulter toutes les tâches et les filtrer**,
afin de **retrouver rapidement le travail qui m'intéresse**.

## Acceptance Criteria

1. **Liste complète** — sur `/tasks`, toutes les tâches s'affichent (titre, nom de l'assigné, priorité, statut via `StatusBadge`, échéance) ; un état vide explicite est affiché si aucune tâche en base.
2. **Filtres URL** — `TaskFilters` permet de filtrer par statut (`?status=`), assigné (`?assignee=`), priorité (`?priority=`) et échéance (`?due_before=`) ; les filtres actifs sont portés par les query params, l'URL est partageable et restaure les filtres au rechargement.
3. **Résultats vides** — si aucune tâche ne correspond aux filtres actifs, un message explicite est affiché (pas d'erreur).
4. **Lien "Nouvelle tâche"** conservé — le bouton conditionnel manager ajouté en Story 1.3 reste présent et fonctionnel.

## Tasks / Subtasks

- [x] Composant `StatusBadge` (AC: #1)
  - [x] `src/components/tasks/StatusBadge.tsx` → badge coloré pour `todo | in_progress | done`
- [x] Page `tasks/page.tsx` — refonte avec liste, filtres et état vide (AC: #1, #2, #3, #4)
  - [x] `await searchParams` (Promise en Next.js 16) → extraire `status`, `assignee`, `priority`, `due_before`
  - [x] Requête Supabase avec jointure `profiles!tasks_assignee_id_fkey(full_name)` et filtres server-side
  - [x] Récupérer liste des profiles pour peupler le select assigné dans `TaskFilters`
  - [x] Afficher tableau de tâches (ou état vide) + passer props à `TaskFilters`
  - [x] Conserver le lien conditionnel "Nouvelle tâche" (manager uniquement)
- [x] Composant `TaskFilters` (AC: #2)
  - [x] `src/components/tasks/TaskFilters.tsx` → Client Component avec `useSearchParams` + `useRouter`
  - [x] Sélects : statut, assigné (UUID), priorité ; input date pour `due_before`
  - [x] `router.push` avec `URLSearchParams` mis à jour à chaque changement

## Dev Notes

### ⚠️ Breaking change Next.js 16 : `searchParams` est une Promise

Dans Next.js 16 (v16.2.9), `searchParams` dans `page.tsx` est une **Promise** — `await` obligatoire.
(Confirmé dans `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`)

```typescript
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; assignee?: string; priority?: string; due_before?: string }>
}) {
  const { status, assignee, priority, due_before } = await searchParams
  // ...
}
```

### Requête Supabase — jointure profiles pour l'assigné

La FK se nomme `tasks_assignee_id_fkey` (voir `src/lib/types.ts#Relationships` de la table `tasks`).
Utiliser l'alias `assignee:profiles!tasks_assignee_id_fkey(full_name)` :

```typescript
const supabase = await createClient()

let query = supabase
  .from('tasks')
  .select(`
    id,
    title,
    priority,
    status,
    due_date,
    estimated_load_hours,
    assignee_id,
    assignee:profiles!tasks_assignee_id_fkey(full_name)
  `)
  .order('created_at', { ascending: false })

if (status)     query = query.eq('status', status as 'todo' | 'in_progress' | 'done')
if (assignee)   query = query.eq('assignee_id', assignee)
if (priority)   query = query.eq('priority', priority as 'low' | 'medium' | 'high')
if (due_before) query = query.lte('due_date', due_before)

const { data: tasks } = await query
```

**Type local à déclarer dans la page :**
```typescript
type TaskWithAssignee = {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  due_date: string | null
  estimated_load_hours: number
  assignee_id: string | null
  assignee: { full_name: string } | null
}
```

### Récupération des profiles pour le filtre assigné

```typescript
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, full_name')
  .order('full_name')
```

Aucune nouvelle politique RLS nécessaire : la lecture de `profiles` est déjà autorisée (prouvée par `getCurrentProfile()` de Story 1.2).

### Composant `StatusBadge`

Fichier à créer : `src/components/tasks/StatusBadge.tsx`

**Pas** de `'use client'` — composant d'affichage pur, utilisable en Server ou Client Component.

```typescript
type Status = 'todo' | 'in_progress' | 'done'

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  todo:        { label: 'À faire',  className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En cours', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  done:        { label: 'Terminé',  className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
```

### Composant `TaskFilters`

Fichier à créer : `src/components/tasks/TaskFilters.tsx`

Client Component — `useSearchParams` (lecture) + `useRouter` + `usePathname` (écriture URL).

```typescript
'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'

type Profile = { id: string; full_name: string }

const selectClass =
  'rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring'

export function TaskFilters({ profiles }: { profiles: Profile[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={searchParams.get('status') ?? ''}
        onChange={e => updateFilter('status', e.target.value)}
        className={selectClass}
        aria-label="Filtrer par statut"
      >
        <option value="">Tous les statuts</option>
        <option value="todo">À faire</option>
        <option value="in_progress">En cours</option>
        <option value="done">Terminé</option>
      </select>

      <select
        value={searchParams.get('assignee') ?? ''}
        onChange={e => updateFilter('assignee', e.target.value)}
        className={selectClass}
        aria-label="Filtrer par assigné"
      >
        <option value="">Tous les assignés</option>
        {profiles.map(p => (
          <option key={p.id} value={p.id}>{p.full_name}</option>
        ))}
      </select>

      <select
        value={searchParams.get('priority') ?? ''}
        onChange={e => updateFilter('priority', e.target.value)}
        className={selectClass}
        aria-label="Filtrer par priorité"
      >
        <option value="">Toutes les priorités</option>
        <option value="low">Faible</option>
        <option value="medium">Moyenne</option>
        <option value="high">Haute</option>
      </select>

      <input
        type="date"
        value={searchParams.get('due_before') ?? ''}
        onChange={e => updateFilter('due_before', e.target.value)}
        className={selectClass}
        title="Échéance avant le"
        aria-label="Échéance avant le"
      />
    </div>
  )
}
```

### Page `tasks/page.tsx` — implémentation complète

Conserve le lien "Nouvelle tâche" de Story 1.3 + ajoute liste filtrée + TaskFilters.

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { StatusBadge } from '@/components/tasks/StatusBadge'

type TaskWithAssignee = {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  due_date: string | null
  estimated_load_hours: number
  assignee_id: string | null
  assignee: { full_name: string } | null
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Faible', medium: 'Moyenne', high: 'Haute',
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; assignee?: string; priority?: string; due_before?: string }>
}) {
  const { status, assignee, priority, due_before } = await searchParams

  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select(`
      id, title, priority, status, due_date, estimated_load_hours, assignee_id,
      assignee:profiles!tasks_assignee_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  if (status)     query = query.eq('status', status as 'todo' | 'in_progress' | 'done')
  if (assignee)   query = query.eq('assignee_id', assignee)
  if (priority)   query = query.eq('priority', priority as 'low' | 'medium' | 'high')
  if (due_before) query = query.lte('due_date', due_before)

  const { data: tasks } = await query
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').order('full_name')

  const profile = await getCurrentProfile()
  const isManager = profile?.role === 'manager'

  const typedTasks = (tasks ?? []) as TaskWithAssignee[]

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tâches</h1>
        {isManager && (
          <Link
            href="/tasks/new"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Nouvelle tâche
          </Link>
        )}
      </div>

      <TaskFilters profiles={profiles ?? []} />

      {typedTasks.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Aucune tâche ne correspond aux filtres sélectionnés.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Titre</th>
                <th className="pb-2 pr-4 font-medium">Assigné</th>
                <th className="pb-2 pr-4 font-medium">Priorité</th>
                <th className="pb-2 pr-4 font-medium">Statut</th>
                <th className="pb-2 font-medium">Échéance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {typedTasks.map(task => (
                <tr key={task.id}>
                  <td className="py-3 pr-4 font-medium">{task.title}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {task.assignee?.full_name ?? <span className="italic">Non assigné</span>}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {PRIORITY_LABEL[task.priority]}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {task.due_date
                      ? new Intl.DateTimeFormat('fr-FR').format(new Date(task.due_date))
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
```

### Pièges à éviter

- **NE PAS** oublier `await searchParams` — c'est une Promise en Next.js 16 (breaking change vs Next.js 14).
- **NE PAS** utiliser `useSearchParams()` dans un Server Component — uniquement dans `TaskFilters` (Client Component).
- **NE PAS** créer une Server Action pour la lecture — lire directement avec le client Supabase dans le Server Component.
- **NE PAS** stocker les filtres dans un état React global — l'URL est la source de vérité (AR8).
- **Jointure Supabase** : la FK se nomme `tasks_assignee_id_fkey` (confirmer dans `src/lib/types.ts`).
- **NE PAS** créer `TaskCard.tsx` séparé — l'affichage en tableau inline dans la page est suffisant.
- **NE PAS** oublier `(tasks ?? [])` — Supabase peut retourner `null` en cas de résultat vide.

### Contrat anti-conflits Git

- **Fichier modifié :** `src/app/(app)/tasks/page.tsx` (propriété Épique 1 — refonte, pas de conflit avec Épiques 2 & 3).
- **Fichiers créés :** `src/components/tasks/StatusBadge.tsx`, `src/components/tasks/TaskFilters.tsx`.
- **Fichiers en lecture seule :** `src/lib/auth.ts`, `src/lib/supabase/*`, `src/lib/types.ts`, `src/app/(app)/tasks/actions.ts`.
- `StatusBadge` sera réutilisé par Story 1.5 (détail tâche) — ne pas casser son interface.

### Learnings critiques de Story 1.3

- `createClient()` est **async** — toujours `await createClient()`.
- `getCurrentProfile()` est async et retourne `Profile | null`.
- Pas de composant Input/Select shadcn disponible — plain HTML avec classes Tailwind ci-dessus.
- Seuls `button.tsx` et `sonner.tsx` existent dans `src/components/ui/`.
- Les `redirect()` ne s'appliquent pas ici (page de lecture, pas de mutation).

### References

- [Source: architecture.md#AR8] — filtres via URL params, pas de state global
- [Source: architecture.md#Formats] — dates via `Intl.DateTimeFormat('fr-FR')`
- [Source: architecture.md#Patterns API & Communication] — lecture via client Supabase dans Server Components
- [Source: architecture.md#Anti-patterns à éviter] — ne pas stocker filtres dans state global
- [Source: epics.md#Story 1.4 : Portefeuille filtrable (FR2)]
- [Source: 1-3-creation-tache.md#Learnings critiques] — patterns createClient, getCurrentProfile, classes Tailwind
- [Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md] — searchParams est une Promise en Next.js 16

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (Dev Story Agent)

### Debug Log References

- `npx tsc --noEmit` → ✅ 0 erreur
- `npm run lint` → ✅ 0 erreur
- `npm run build` → ✅ compilé (Turbopack, 1090ms) — `/tasks` en mode `ƒ Dynamic`

### Completion Notes List

- **`StatusBadge.tsx`** : composant pur (pas de `'use client'`), 3 statuts avec couleurs Tailwind distinctes (muted / bleu / vert), compatible Server et Client Component.
- **`TaskFilters.tsx`** : Client Component, `useSearchParams` + `useRouter` + `usePathname`, 4 filtres (statut, assigné, priorité, due_before) mis à jour via `URLSearchParams` → `router.push`. URL partageable, filtres restaurés au rechargement (AC#2).
- **`tasks/page.tsx`** : `await searchParams` (Promise Next.js 16), requête Supabase avec jointure `profiles!tasks_assignee_id_fkey(full_name)` et 4 filtres server-side chainés. `Promise.all` pour les 3 lectures parallèles. Tableau avec `StatusBadge`, dates `Intl.DateTimeFormat('fr-FR')`, liens vers `/tasks/[id]`. État vide explicite (AC#3). Bouton "Nouvelle tâche" conservé pour managers (AC#4).

### File List

- `teamflow/src/components/tasks/StatusBadge.tsx` — **NOUVEAU**
- `teamflow/src/components/tasks/TaskFilters.tsx` — **NOUVEAU**
- `teamflow/src/app/(app)/tasks/page.tsx` — **MODIFIÉ** (refonte complète)
- `_bmad-output/implementation-artifacts/1-4-portefeuille-filtrable.md` — **MODIFIÉ** (story complétée)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — **MODIFIÉ**

## Change Log

| Date | Changement |
|---|---|
| 2026-06-19 | Story créée par CS workflow (bmad-create-story). |
| 2026-06-19 | Story 1.4 implémentée : StatusBadge, TaskFilters, tasks/page.tsx refondu avec liste filtrée. Build ✅ lint ✅ tsc ✅ |
