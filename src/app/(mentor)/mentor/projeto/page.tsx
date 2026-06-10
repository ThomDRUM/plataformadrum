"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Check, X, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK = {
  intention: `Fornecer uma plataforma de sucessão com metodologias e repertórios desenhados para que o facilitador consiga planejar a sucessão patrimonial e da gestão do negócio familiar. Isso será feito a partir da conscientização dos membros, facilitação de alinhamentos e estruturação da governança com acordos, documentos e fóruns formais.`,
  desiredOutcomes: [
    "Ter o diagnóstico inicial das quatro dimensões (individual, relacional, empreendedora e estrutural) e confirmar entendimento com o cliente.",
    "Construir as trilhas de desenvolvimento para a próxima geração.",
    "Construir as trilhas de transição: desenvolvimento e trabalho com a geração sênior.",
    "Definir os encontros e alinhamentos necessários.",
    "Elaborar e adequar as estruturas de governança: familiar (protocolo familiar, política de empregabilidade, conselho familiar e assembleia), patrimonial (acordo de quotistas, contrato social) e corporativa (conselho de administração, mandato estratégico).",
  ],
  mwta: "",
  pointA: `A família é de origem chinesa, têm três sucedidos e seis membros da próxima geração e uma empresa operacional que está financeiramente saudável e crescendo. A liderança é concentrada em um dos irmãos que fundou a empresa junto ao pai. Um dos sucessores trabalha na empresa e outra tem interesse em entrar, os outros, a princípio, não tem interesse em participar do dia a dia da empresa. A família tem dificuldade de comunicação e organização e pensa sobre a sucessão do negócio, pois se preocupa com a ausência do Ricardo, o principal executivo e liderança da família. Não existe governança de qualquer tipo e falta clareza sobre vários pontos em relação à sucessão.`,
  pointB: `A família está harmônica, com uma boa comunicação e tem um planejamento da sucessão. Para os sucedidos, ficou mais claro a visão de negócio e o que eles desejam com a empresa. Todos da nova geração têm uma boa noção do que significa fazer parte de uma família empreendedora. A organização da governança familiar, da propriedade e do negócio está estruturada e cada integrante da família é envolvido nos fóruns que lhe cabem. Os instrumentos jurídicos e de sucessão estão implementados e conversam com os alinhamentos feitos durante o processo.`,
  rules: [
    { id: "1", title: "Auto responsabilização", description: "Somos protagonistas das nossas escolhas e dos resultados que elas trazem para nós. Se você escolheu estar aqui, esteja 100%." },
    { id: "2", title: "Aprendizado peer to peer", description: "Acreditamos que a melhor forma de aprender é com conversas. Um par pode ser alguém que já viveu ou vive dilemas similares ao seu e que se interessa pelos seus temas e contexto." },
    { id: "3", title: "Confidencialidade", description: "O que você fala aqui permanece aqui. Nenhuma resposta, exercício ou reflexão será compartilhada com mais ninguém." },
    { id: "4", title: "Confiança no processo", description: "Criamos as condições para que reflexões e mudanças aconteçam. Nosso convite principal é ter um desejo de crescer, se entregar às dinâmicas e não ter expectativas pré-definidas." },
    { id: "5", title: "Capacidade de diálogo", description: "Escutar ativamente e se colocar. Nesse processo, os facilitadores DRUM vão estar concentrados em te escutar e perceber aquilo que está por trás das palavras." },
    { id: "6", title: "Prazer na transformação", description: "Transformação é um processo e o passo de se propor a fazer isso já é grande parte do caminho. A capacidade de mudar as lentes que se olha o mundo é sem dúvida uma das habilidades mais importantes do ser humano." },
  ],
  roles: [
    { id: "1", person: "Guel", description: "Guel é o responsável por atuar como expert em sucessão, suportando o facilitador nos desafios durante o processo de entendimento e execução do planejamento sucessório." },
    { id: "2", person: "Thom", description: "Thom é o responsável por gerenciar o caminho de aprendizagem, garantir a plena utilização da plataforma por todos e a avaliação do serviço." },
    { id: "3", person: "Alex", description: "Alex tem o papel de facilitador e vai atuar junto da família conduzindo o processo, aplicando as metodologias da DRUM e traduzindo os aprendizados para a realidade de cada integrante." },
  ],
};

// ── Shared components ──────────────────────────────────────────────────────────

function SectionTitle({ title, help, italic }: { title: string; help?: string; italic?: boolean }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {help && (
        <p className={cn("text-sm text-muted-foreground mt-1", italic && "italic")}>{help}</p>
      )}
    </div>
  );
}

function CollapsibleInstructions({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Ver instruções
      </button>
      {open && (
        <div className="mt-2 p-4 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

function EditableText({
  value, onChange, rows = 5, placeholder = "—",
}: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEdit() { setDraft(value); setEditing(true); }
  function save() { onChange(draft); setEditing(false); }
  function cancel() { setDraft(value); setEditing(false); }

  if (editing) {
    return (
      <div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={rows}
          autoFocus
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex items-center gap-3 mt-2">
          <button onClick={save} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
            <Check className="w-3 h-3" /> Salvar
          </button>
          <button onClick={cancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <p className={cn("text-sm leading-relaxed pr-8", value ? "text-foreground" : "text-muted-foreground/40")}>
        {value || placeholder}
      </p>
      <button
        onClick={startEdit}
        className="absolute top-0 right-0 p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        title="Editar"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ProjetoPage() {
  const [intention, setIntention] = useState(MOCK.intention);
  const [outcomes, setOutcomes] = useState(MOCK.desiredOutcomes);
  const [mwta, setMwta] = useState(MOCK.mwta);
  const [pointA, setPointA] = useState(MOCK.pointA);
  const [pointB, setPointB] = useState(MOCK.pointB);
  const [rules] = useState(MOCK.rules);
  const [roles, setRoles] = useState(MOCK.roles);
  const [openRuleId, setOpenRuleId] = useState<string | null>(null);
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);
  const [editingOutcomes, setEditingOutcomes] = useState(false);
  const [outcomeDrafts, setOutcomeDrafts] = useState(MOCK.desiredOutcomes);

  function saveOutcomes() { setOutcomes(outcomeDrafts); setEditingOutcomes(false); }
  function cancelOutcomes() { setOutcomeDrafts(outcomes); setEditingOutcomes(false); }
  function addOutcome() { setOutcomeDrafts([...outcomeDrafts, ""]); }
  function removeOutcome(i: number) { setOutcomeDrafts(outcomeDrafts.filter((_, idx) => idx !== i)); }
  function updateOutcome(i: number, v: string) { setOutcomeDrafts(outcomeDrafts.map((o, idx) => idx === i ? v : o)); }

  function addRole() { setRoles([...roles, { id: Date.now().toString(), person: "", description: "" }]); }
  function removeRole(id: string) { setRoles(roles.filter(r => r.id !== id)); }
  function updateRole(id: string, field: "person" | "description", v: string) {
    setRoles(roles.map(r => r.id === id ? { ...r, [field]: v } : r));
  }

  return (
    <div className="max-w-3xl space-y-12">

      {/* Page header */}
      <div>
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium mb-2">
          Família Rodrigues
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Projeto</h1>
      </div>

      {/* ── Intenção ── */}
      <section>
        <SectionTitle title="Intenção" help="A intenção principal do projeto como um todo." />
        <EditableText value={intention} onChange={setIntention} rows={5} />
      </section>

      {/* ── Desired Outcome ── */}
      <section>
        <SectionTitle title="Desired Outcome" help="Os resultados concretos esperados ao final do processo." />

        {!editingOutcomes ? (
          <div className="group relative">
            <div className="space-y-2 pr-8">
              {outcomes.map((o, i) => (
                <div key={i} className="flex gap-3 text-sm text-foreground leading-relaxed">
                  <span className="text-muted-foreground/40 tabular-nums flex-shrink-0">{i + 1}.</span>
                  <span>{o}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setOutcomeDrafts(outcomes); setEditingOutcomes(true); }}
              className="absolute top-0 right-0 p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {outcomeDrafts.map((o, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-muted-foreground/40 text-sm mt-2.5 tabular-nums flex-shrink-0 w-4">{i + 1}.</span>
                <textarea
                  value={o}
                  onChange={(e) => updateOutcome(i, e.target.value)}
                  rows={2}
                  placeholder="Resultado esperado..."
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                />
                <button onClick={() => removeOutcome(i)} className="mt-2 p-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={addOutcome} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
              <Plus className="w-3.5 h-3.5" /> Adicionar resultado
            </button>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={saveOutcomes} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                <Check className="w-3 h-3" /> Salvar
              </button>
              <button onClick={cancelOutcomes} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            </div>
          </div>
        )}
      </section>

      {/* ── MWTA ── */}
      <section>
        <SectionTitle
          title="MWTA · Meet Where They Are"
          help="Permite acessarmos com precisão a realidade da família hoje. Nos ajudará a definir o escopo do projeto."
        />
        <CollapsibleInstructions>
          <p className="font-medium text-foreground/80">Preencha a partir das seguintes perguntas:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Quem é o público e como estão se sentindo?</li>
            <li>O que precisam hoje?</li>
            <li>Quais as suas necessidades agora?</li>
            <li>O que esperam da experiência?</li>
            <li>Algo os preocupa e gera tensão?</li>
          </ul>
        </CollapsibleInstructions>
        <EditableText value={mwta} onChange={setMwta} rows={5} placeholder="Descreva onde a família está hoje..." />
      </section>

      {/* ── Ponto A ── */}
      <section>
        <SectionTitle title="Ponto A" help="A fotografia do estado atual da família." italic />
        <CollapsibleInstructions>
          <p className="font-medium text-foreground/80">Descreva a situação atual como se fosse a fotografia da realidade hoje. Tente responder às seguintes perguntas:</p>
          <div className="space-y-2 mt-2">
            <div><span className="font-medium text-foreground/80">Individual:</span> qual é o entendimento dos membros sobre seus papéis, relação com a família e impacto em sua vida? Em relação à geração atual, quanto têm visão de futuro da família empreendedora? Em relação à próxima geração, quanto os indivíduos entendem se e como gostariam de se relacionar com a família empreendedora?</div>
            <div><span className="font-medium text-foreground/80">Relacional:</span> como acontecem as relações a partir do entendimento das dimensões envolvidas: a família, no negócio e na sociedade?</div>
            <div><span className="font-medium text-foreground/80">Empreendedora:</span> existe clareza e alinhamento sobre o futuro e planejamento estratégico do empreendimento?</div>
            <div><span className="font-medium text-foreground/80">Estrutural:</span> os entendimentos sobre como será a sucessão estão formalizados com instrumentos e políticas conhecidas por todos?</div>
          </div>
        </CollapsibleInstructions>
        <EditableText value={pointA} onChange={setPointA} rows={8} />
      </section>

      {/* ── Ponto B ── */}
      <section>
        <SectionTitle title="Ponto B" help="A fotografia do estado desejado para a família ao final do projeto." italic />
        <CollapsibleInstructions>
          <p className="font-medium text-foreground/80">Descreva o estado desejado ao final do processo. Considere as mesmas quatro dimensões:</p>
          <div className="space-y-2 mt-2">
            <div><span className="font-medium text-foreground/80">Individual:</span> como cada membro se vê em relação à família empreendedora? Qual é o seu papel e caminho?</div>
            <div><span className="font-medium text-foreground/80">Relacional:</span> como são as relações entre os membros? Existe harmonia e comunicação saudável?</div>
            <div><span className="font-medium text-foreground/80">Empreendedora:</span> a visão e estratégia do negócio estão claras e alinhadas entre as gerações?</div>
            <div><span className="font-medium text-foreground/80">Estrutural:</span> todos os instrumentos, acordos e políticas estão implementados e conhecidos?</div>
          </div>
        </CollapsibleInstructions>
        <EditableText value={pointB} onChange={setPointB} rows={8} />
      </section>

      {/* ── Regras ── */}
      <section>
        <SectionTitle title="Regras" help="Acordos de postura e convivência durante o processo." />
        <div className="space-y-2">
          {rules.map((rule) => {
            const isOpen = openRuleId === rule.id;
            return (
              <div key={rule.id} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenRuleId(isOpen ? null : rule.id)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  {isOpen
                    ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  }
                  <span className="text-sm font-medium text-foreground">{rule.title}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-border">
                    <p className="text-sm text-muted-foreground leading-relaxed">{rule.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Papeis ── */}
      <section>
        <SectionTitle title="Papeis" help="Quem faz o quê neste projeto." />
        <div className="space-y-2">
          {roles.map((role) => {
            const isOpen = openRoleId === role.id;
            return (
              <div key={role.id} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3">
                  <button onClick={() => setOpenRoleId(isOpen ? null : role.id)} className="flex-shrink-0">
                    {isOpen
                      ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                      : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    }
                  </button>
                  {isOpen ? (
                    <input
                      value={role.person}
                      onChange={(e) => updateRole(role.id, "person", e.target.value)}
                      className="flex-1 text-sm font-medium bg-transparent border-b border-border focus:outline-none py-0.5 placeholder:text-muted-foreground/40"
                      placeholder="Nome da pessoa..."
                    />
                  ) : (
                    <div className="flex-1 flex items-baseline gap-2 min-w-0">
                      <span className="text-sm font-medium text-foreground flex-shrink-0">{role.person || "Novo papel"}</span>
                      {role.description && (
                        <span className="text-xs text-muted-foreground/60 truncate">— {role.description.slice(0, 70)}…</span>
                      )}
                    </div>
                  )}
                  <button onClick={() => removeRole(role.id)} className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-border">
                    <textarea
                      value={role.description}
                      onChange={(e) => updateRole(role.id, "description", e.target.value)}
                      rows={3}
                      placeholder="Descrição do papel..."
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                    />
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={addRole} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
            <Plus className="w-3.5 h-3.5" /> Novo papel
          </button>
        </div>
      </section>

    </div>
  );
}
