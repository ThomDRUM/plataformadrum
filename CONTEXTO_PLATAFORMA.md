# Contexto da Plataforma DRUM — para Business Logic & Design Analyst

## Visão geral

DRUM é uma plataforma de desenvolvimento guiado para **sucessores de negócios de família e empreendedores**. Não é um LMS nem um dashboard de SaaS — é editorial, calma, reflexiva. Tom de produto: acompanhamento de jornada, não "curso".

**Stack:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind v4, shadcn/ui (variante base-ui, sem Radix `asChild`), Supabase (Postgres + Auth + RLS).

**Projeto Supabase:** `gepzsdbwzozruubptozv` — `drum-plataforma`, região `sa-east-1`.

## Papéis (roles)

`profiles.role`: **student** | **admin** | **mentor**

- Sem auto-cadastro — contas são criadas pelo admin via Supabase Auth Admin API.
- Cada papel tem seu próprio grupo de rotas: `(student)`, `(admin)`, `(mentor)`.

## Estrutura de rotas (atual)

- `(student)/` — `momento`, `competencia`, `reflexoes`, `repertorio`
- `(admin)/admin/` — `mentorados` (lista + `[id]` + `novo`), `trilhas`, `modulos`, `competencias`, `repertorio`, `reflexoes`, `entregas`, `familias`, `projetos`
- `(mentor)/mentor/` — `familia`, `projeto`, `cronograma` (cada um com `_components`)
- `/login`, `/auth/callback`

## Dois eixos de dados

Esse é o ponto-chave para o analista: a plataforma tem dois modelos de dados distintos.

### Eixo 1 — Trilha de formação (conteúdo pedagógico, estruturado e fixo)

```
trails → modules → competencies → {
  repertoire_items (conteúdo de estudo, nível 1-3, externo ou interno)
  reflections → reflection_questions → reflection_answers (por usuário)
  deliverables → deliverable_submissions (draft/submitted/completed)
}
```

- `user_module_status`: progresso por usuário/módulo, setado manualmente pelo admin (`not_started`/`in_progress`/`completed`). Não há progressão automática.
- `user_repertoire_consumed`: marca o que o usuário já consumiu.
- `achievements`: lista de conquistas por usuário (checklist).
- Volume hoje: 1 trilha, 8 módulos, 32 competências, 33 itens de repertório, 16 reflexões / 44 perguntas, 8 entregáveis.

### Eixo 2 — Família e Projeto (contexto de negócio do cliente)

```
families (história, missão, visão, valores)
  → family_members (árvore genealógica: parent_id, spouse_id, generation, family_role, business_role, works_in_business)
  → projects (status active/completed/paused, duração, datas)
       → project_overview (intention, MWTA, ponto A, ponto B)
       → project_desired_outcomes (lista ordenada)
       → project_rules (lista ordenada)
       → project_roles (quem faz o quê no projeto)
       → project_schedule → project_events (cronograma com status a_comecar/em_andamento/concluido)

mentor_projects: liga mentor (profiles) ↔ projeto (N:N)
profiles.project_id: liga o estudante ao seu projeto
```

Isso é essencialmente o **MWTA/IDOARRT** da metodologia DRUM, modelado em tabelas — provavelmente o foco de onde o analista vai trabalhar, já que é a parte mais "lógica de negócio" e mais nova.

## Decisões de produto a destacar

1. **Progressão manual** — não existe regra de desbloqueio automático. O admin decide quando um módulo está em andamento/concluído.
2. **mentor ≠ admin** — o mentor tem sua própria área (`/mentor`), vê família, projeto e cronograma dos seus mentorados via `mentor_projects`. Isso é separado do admin operacional.
3. **Repertório tem 3 níveis** (`level` 1-3) e pode ser conteúdo externo (link) ou interno (`content_html`).
4. **Entregáveis são por competência**, podem ter mais de um por competência (`is_primary` marca o principal).
5. Tabelas de família/projeto são todas **ordenadas por `order_index`** quando são listas (outcomes, rules, roles, schedule) — a ordem de exibição é editorial, não cronológica/alfabética.

## Particularidades técnicas (Next.js 16)

Relevantes apenas se ele for tocar em código:

- `middleware.ts` não existe → é `proxy.ts`, função `proxy()`.
- Botões shadcn usam `@base-ui/react/button`, sem `asChild` — usar `<LinkButton>` (`src/components/ui/link-button.tsx`).
- `Select.onValueChange` recebe `string | null`.
