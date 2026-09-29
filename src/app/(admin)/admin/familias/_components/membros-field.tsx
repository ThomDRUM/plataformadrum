"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import type { FamilyMemberInput } from "@/lib/actions/admin/families";
import { Field, TextField } from "@/components/admin/form-fields";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export interface MembroRow extends FamilyMemberInput {
  /** Id da linha em `family_members`, ou um id local enquanto a família não existe. */
  id: string;
}

/** A linha carrega um id só para a UI; a action recebe apenas os dados do membro. */
export function toMemberInput(row: MembroRow): FamilyMemberInput {
  return {
    name: row.name,
    familyRole: row.familyRole,
    businessRole: row.businessRole,
    generation: row.generation,
    worksInBusiness: row.worksInBusiness,
  };
}

interface Props {
  members: MembroRow[];
  onAdd: (member: FamilyMemberInput) => void;
  onRemove: (id: string) => void;
  /** Explica quando a alteração é gravada — difere entre criar e editar. */
  hint: string;
  disabled?: boolean;
}

const EMPTY: FamilyMemberInput = {
  name: "",
  familyRole: "",
  businessRole: "",
  generation: 1,
  worksInBusiness: false,
};

/**
 * Árvore genealógica (`family_members`) dentro do formulário da família.
 *
 * É uma lista rasa: nome, papéis e geração. Parentesco e cônjuge (`parent_id`,
 * `spouse_id`) continuam na tela do mentor, que tem o diagrama para isso — aqui
 * o admin só popula ou limpa a árvore.
 */
export function MembrosField({ members, onAdd, onRemove, hint, disabled }: Props) {
  const [draft, setDraft] = useState<FamilyMemberInput>(EMPTY);

  const canAdd = draft.name.trim().length >= 2;

  function set(patch: Partial<FamilyMemberInput>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function add() {
    if (!canAdd || disabled) return;
    onAdd({ ...draft, name: draft.name.trim() });
    // A geração fica: cadastrar irmãos em sequência é o caso comum.
    setDraft({ ...EMPTY, generation: draft.generation });
  }

  /**
   * Este bloco vive dentro do formulário da família, cujo submit cria ou salva
   * tudo. Enter aqui adiciona o membro em vez de disparar aquele submit.
   */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    add();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground">Membros da família</span>
        {members.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {members.length} {members.length === 1 ? "membro" : "membros"}
          </span>
        )}
      </div>

      {members.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-input">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-2 py-1 pl-3 pr-1">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{member.name}</span>
                {(member.familyRole || (member.worksInBusiness && member.businessRole)) && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {[member.familyRole, member.worksInBusiness ? member.businessRole : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </span>

              <Badge variant="secondary" size="sm" className="shrink-0 tabular-nums">
                G{member.generation}
              </Badge>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label={`Remover ${member.name}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(member.id)}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 rounded-lg border border-dashed border-input p-3">
        <Field label="Nome do membro">
          <TextField
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Nome completo"
            autoComplete="off"
            disabled={disabled}
          />
        </Field>

        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <Field label="Papel na família">
            <TextField
              value={draft.familyRole}
              onChange={(e) => set({ familyRole: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Fundador, Filha…"
              autoComplete="off"
              disabled={disabled}
            />
          </Field>

          <Field label="Geração">
            <TextField
              type="number"
              min={1}
              max={9}
              value={draft.generation}
              onChange={(e) => set({ generation: Number(e.target.value) || 1 })}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox
            checked={draft.worksInBusiness}
            onCheckedChange={(checked) => set({ worksInBusiness: checked })}
            disabled={disabled}
          />
          Trabalha na empresa
        </label>

        {draft.worksInBusiness && (
          <Field label="Papel na empresa">
            <TextField
              value={draft.businessRole}
              onChange={(e) => set({ businessRole: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="CEO, Diretora…"
              autoComplete="off"
              disabled={disabled}
            />
          </Field>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={disabled || !canAdd}
        >
          <Plus aria-hidden="true" />
          Adicionar membro
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
