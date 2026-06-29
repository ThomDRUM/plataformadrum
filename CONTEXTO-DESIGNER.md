# DRUM — Contexto do produto para design

## O que é a DRUM

A DRUM é uma metodologia/empresa de desenvolvimento de sucessores em famílias empresárias e empreendedores. Essa plataforma é o **produto digital** que apoia esse processo — não é um LMS genérico, não é um dashboard de SaaS corporativo. O tom é **editorial, calmo, reflexivo**: a experiência deve parecer mais um caderno guiado de desenvolvimento do que uma ferramenta de produtividade.

A plataforma tem **três tipos de usuário**, com experiências completamente separadas:

1. **Mentorado (student)** — a pessoa em desenvolvimento (sucessor da empresa familiar)
2. **Mentor** — o facilitador DRUM que acompanha um projeto de sucessão de uma família específica
3. **Admin** — a equipe DRUM, que configura conteúdo e gerencia tudo

Não existe auto-cadastro. Todas as contas são criadas pelo admin.

---

## 1. Experiência do Mentorado

Essa é a trilha de desenvolvimento individual — pense em um percurso de formação com conteúdo, reflexão e entregas.

**Estrutura de navegação:**
- **Momento** (`/momento`) — a home do mentorado. Mostra o módulo atual da trilha.
- **Trilha** (`/competencia`) — visão de competências dentro de cada módulo
- **Repertório** (`/repertorio`) — biblioteca de materiais (artigos, vídeos, conteúdo interno) organizados por competência, com 3 níveis de profundidade
- **Reflexões** (`/reflexoes`) — perguntas reflexivas vinculadas a cada competência, com respostas salvas
- **Entregas** — tarefas/produções que o mentorado precisa entregar por competência

**Modelo de dados:** `trilha → módulos → competências → (repertório, reflexões, entregas)`. Cada mentorado tem **achievements** (conquistas) e um status manual por módulo (`não iniciado / em andamento / concluído`) — esse status é setado **manualmente pelo admin**, não automaticamente pelo sistema.

**O "módulo atual"** do mentorado (mostrado na home) é derivado: primeiro módulo "em andamento", senão primeiro "não iniciado", senão o último concluído.

---

## 2. Experiência do Mentor — *(área nova, ainda em validação visual)*

O mentor é o facilitador DRUM que acompanha **um projeto de sucessão de uma família específica**. Diferente do mentorado, o mentor não navega por trilhas de aprendizado — ele registra e acompanha informações estruturantes do projeto.

**Sidebar com 3 páginas:**

### Página 1 — Projeto (home do mentor)
Resumo estratégico do projeto de sucessão. Campos:
- **Intenção** — propósito do projeto (texto longo)
- **Desired Outcome** — lista numerada de resultados esperados
- **MWTA (Meet Where They Are)** — diagnóstico de onde a família está hoje, com instruções expansíveis (perguntas-guia)
- **Ponto A** — fotografia do estado atual da família (texto longo, com instruções detalhadas por dimensão: individual, relacional, empreendedora, estrutural)
- **Ponto B** — fotografia do estado desejado ao final do processo (mesma estrutura)
- **Regras** — acordos de convivência durante o processo (lista de accordion, somente leitura para o mentor — vem pré-definido)
- **Papeis** — quem faz o quê no projeto (lista editável de pessoa + descrição do papel)

**Padrão de edição:** todo campo segue o mesmo padrão visual — ícone de lápis → abre edição → botões "Salvar" / "Cancelar". Esse padrão foi recentemente padronizado em todas as três páginas (antes havia comportamentos diferentes em "Papeis" e "Eventos").

### Página 2 — Cronograma
Visualização tipo Gantt do cronograma do projeto:
- Régua de meses no topo, barras horizontais por etapa
- Cada etapa: título, data início/fim, status (a começar / em andamento / concluído), notas do mentor
- Algumas etapas têm **eventos** vinculados (datas específicas de encontros/marcos) — mostrados numa seção separada abaixo do Gantt, também editáveis no padrão lápis→editar→salvar

### Página 3 — Família
A parte mais visual e com mais potencial de refinamento de design:
- **Árvore familiar** — representação visual dos membros da família por geração
  - Cada pessoa: nome, iniciais (avatar circular), papel na família, papel na empresa (se houver), se trabalha ou não na empresa (diferenciado visualmente — preenchido vs. contorno)
  - Clique no nó abre painel lateral de edição
  - Suporta **cônjuges** — exibidos lado a lado com uma linha dupla horizontal entre eles (diferente da linha simples vertical que liga pai/filho)
  - Suporta reordenação de irmãos (mais à esquerda/direita) e adição de filhos sob um membro específico
- **Breve história da família** (texto longo)
- **Missão** / **Visão** / **Valores** (textos curtos)

> **Esse é provavelmente a página onde a colaboração com o designer é mais valiosa** — a árvore familiar é uma estrutura visual customizada (não é um componente de biblioteca), feita com CSS/flexbox simples, e ainda não passou por um refinamento visual dedicado.

---

## 3. Experiência do Admin

Gerencia todo o conteúdo e as pessoas:
- **Mentorados** — lista de mentorados, perfil individual, status por módulo
- **Famílias** — lista de famílias, dados gerais
- **Projetos** — lista de projetos de sucessão, vínculo com família e mentor
- **Trilhas / Módulos / Competências** — estrutura de conteúdo da trilha de desenvolvimento
- **Repertório / Reflexões / Entregas** — conteúdo associado a cada competência

---

## Stack técnico (contexto, não é o foco do designer)

Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (variante base-ui) + Supabase. Sem framework de design tokens customizado além do Tailwind padrão — paleta e tipografia ainda são as defaults do shadcn, é um ponto de abertura para o designer trazer identidade visual própria.

---

## Pontos abertos / oportunidades de design

1. **Identidade visual** — hoje a UI usa os tokens default do shadcn (cores neutras, tipografia padrão). Não há uma identidade visual DRUM aplicada ainda.
2. **Árvore familiar** — estrutura funcional mas visualmente básica; maior oportunidade de design dedicado.
3. **Onboarding/primeira impressão** — não há tela de boas-vindas ou onboarding guiado, o usuário cai direto na página principal do seu papel.
4. **Estados vazios** — existem alguns (ex: "nenhum evento ainda"), mas não foram pensados com cuidado visual.
5. **Responsividade mobile** — a plataforma foi construída pensando em desktop; não foi testada/adaptada para mobile.
