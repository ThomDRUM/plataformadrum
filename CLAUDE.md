# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config, eslint-config-next)
```

There is no test suite configured in this repo.

## Architecture

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript (strict) · Tailwind v4 · shadcn/ui (base-ui variant) · Supabase (Postgres + Auth + RLS).

**Product context:** DRUM is a guided-development platform for family-business successors and entrepreneurs — editorial and reflective in tone, not a generic LMS/SaaS dashboard. Deeper product/domain context lives in `CONTEXTO_PLATAFORMA.md` (business logic/data model) and `CONTEXTO-DESIGNER.md` (product/UX intent) — read these before non-trivial feature work, but verify claims against current code since they can drift (e.g. they describe an `(admin)` route group and routes like `/momento` and `/competencia` that no longer exist in `src/app`; the admin area currently lives disabled in `src/_disabled/`).

### Roles and route groups

`profiles.role` is `student` | `admin` | `mentor`. There is no self-signup — accounts are created by an admin via the Supabase Auth Admin API. Each role has its own route group under `src/app/`:

- `(student)/` — student's own learning trail (`/`, `/aprender`, `/modulo/[module_id]`)
- `(mentor)/mentor/` — mentor's view into a family's succession project (`aprender`, `alinhamentos`, `cronograma`, `familia`, `mentorados`, `projeto`)
- Admin routes are currently **disabled** (`src/_disabled/admin-route-group/`, excluded from both TS and ESLint) — not part of the live build.

`src/proxy.ts` handles auth-gating (redirects unauthenticated users to `/login`) and role-based redirect from `/` (admin → `/admin`, mentor → `/mentor/projeto`, student renders `/` directly as their home).

### Two data axes

The domain model (see `CONTEXTO_PLATAFORMA.md` for full detail) splits into two independent axes:

1. **Learning trail** (fixed pedagogical content): `trails → modules → competencies → { repertoire_items, reflections → reflection_questions → reflection_answers, deliverables → deliverable_submissions }`. Progress (`user_module_status`) is set **manually by an admin**, never derived automatically.
2. **Family & project** (client business context): `families → family_members` (genealogy tree with `parent_id`/`spouse_id`/`generation`) and `families → projects → { project_overview, project_desired_outcomes, project_rules, project_roles, project_schedule → project_events }`. `mentor_projects` links mentors (N:N) to projects; `profiles.project_id` links a student to their project. This models the DRUM methodology's MWTA/IDOARRT framework.

Lists tied to families/projects (outcomes, rules, roles, schedule) are ordered by `order_index` for editorial display order — not chronological or alphabetical.

### Supabase

- `src/lib/supabase/server.ts` — server client (Server Components/Actions), cookie-based session via `@supabase/ssr`.
- `src/lib/supabase/client.ts` — browser client.
- `src/lib/types/database.ts` — generated DB types (`Database`, `Tables<>`, `TablesInsert<>`, etc.); don't hand-edit, regenerate from the Supabase project (`gepzsdbwzozruubptozv`, `sa-east-1`) when the schema changes.
- Server Components can't set cookies — `setAll` in `server.ts` swallows that case silently since `proxy.ts` (the middleware-equivalent) is responsible for refreshing the session cookie.

### Structure conventions

- `src/lib/actions/` — Server Actions.
- `src/lib/{mentor,student}/` — role-scoped data-fetching/business-logic helpers consumed by that role's route group.
- `src/components/ui/` — shadcn/ui primitives (base-ui variant, see caveats in AGENTS.md above).
- `src/components/{layout,topic,admin}/` — feature-level components; `topic/*` backs the student's module/competency reading experience.
- Path alias `@/*` → `src/*`.
