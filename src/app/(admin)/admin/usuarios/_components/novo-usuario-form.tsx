"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { createUser } from "@/lib/actions/admin/users";
import { Field, TextField, SelectField, FormError } from "@/components/admin/form-fields";
import { normalize } from "@/components/admin/table-toolbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MentorOption {
  id: string;
  fullName: string;
}

interface StudentOption {
  id: string;
  fullName: string;
  projectId: string | null;
  familyName: string | null;
}

interface Props {
  trails: { id: string; title: string; trail_type: string }[];
  families: { id: string; name: string; projectId: string | null }[];
  mentors: MentorOption[];
  students: StudentOption[];
  /**
   * Chamado com o id do usuário recém-criado. Sem isso, o formulário navega
   * para a tela dele — que é o que a rota `/novo` quer; o sheet, aberto de
   * dentro da lista, prefere fechar e ficar na lista.
   */
  onCreated?: (userId: string) => void;
  /** Botão de cancelar: um link de volta na rota, um `SheetClose` no sheet. */
  cancel?: React.ReactNode;
  className?: string;
}

export function NovoUsuarioForm({
  trails,
  families,
  mentors,
  students,
  onCreated,
  cancel,
  className,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("student");
  const [familyId, setFamilyId] = useState("");
  const [mentorIds, setMentorIds] = useState<string[]>([]);
  const [studentIds, setStudentIds] = useState<string[]>([]);

  const projectId = families.find((f) => f.id === familyId)?.projectId ?? null;

  function toggle(ids: string[], id: string) {
    return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  }

  function handleRoleChange(nextRole: string) {
    setRole(nextRole);
    // Os vínculos são específicos do papel — trocar de papel os invalida.
    setMentorIds([]);
    setStudentIds([]);
  }

  function handleFamilyChange(nextFamilyId: string) {
    setFamilyId(nextFamilyId);
    // O mentor entra pelo projeto da família; sem projeto não há onde vinculá-lo.
    const nextProjectId = families.find((f) => f.id === nextFamilyId)?.projectId ?? null;
    if (!nextProjectId) setMentorIds([]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createUser({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        fullName: String(form.get("full_name") ?? "").trim(),
        role: role as "student" | "mentor" | "admin",
        studentType: (String(form.get("student_type") ?? "") || null) as
          | "successor"
          | "succeeded"
          | null,
        trailId: String(form.get("trail_id") ?? "") || null,
        projectId: role === "student" ? projectId : null,
        // Mentor: o vínculo com cada mentorado é, no banco, o projeto dele.
        mentorProjectIds:
          role === "mentor"
            ? students
                .filter((s) => studentIds.includes(s.id))
                .flatMap((s) => (s.projectId ? [s.projectId] : []))
            : [],
        mentorIds: role === "student" ? mentorIds : [],
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Usuário criado, vínculo não: vale avisar em vez de sumir com o erro, mas
      // não é motivo para manter o formulário aberto — o vínculo se refaz na
      // tela do usuário.
      if (result.data.linkError) {
        toast.error(`Usuário criado, mas o vínculo falhou: ${result.data.linkError}`);
      }

      router.refresh();

      if (onCreated) {
        onCreated(result.data.id);
        return;
      }

      router.push(`/admin/usuarios/${result.data.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
      <FormError message={error} />

      <Field label="Nome completo">
        <TextField name="full_name" required minLength={2} autoComplete="off" />
      </Field>

      <Field label="E-mail" hint="É com este e-mail que a pessoa vai entrar na plataforma.">
        <TextField name="email" type="email" required autoComplete="off" />
      </Field>

      <Field label="Senha provisória" hint="Mínimo de 6 caracteres.">
        <TextField name="password" type="text" required minLength={6} autoComplete="new-password" />
      </Field>

      <Field label="Papel">
        <SelectField name="role" value={role} onChange={(e) => handleRoleChange(e.target.value)}>
          <option value="student">Mentorado</option>
          <option value="mentor">Mentor</option>
          <option value="admin">Admin</option>
        </SelectField>
      </Field>

      {role === "student" && (
        <Field label="Tipo de mentorado">
          <SelectField name="student_type" defaultValue="">
            <option value="">Não definido</option>
            <option value="successor">Sucessor</option>
            <option value="succeeded">Sucedido</option>
          </SelectField>
        </Field>
      )}

      {role !== "admin" && (
        <Field label="Formação" hint="Pode ser definida depois.">
          <SelectField name="trail_id" defaultValue="">
            <option value="">Nenhuma</option>
            {trails.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </SelectField>
        </Field>
      )}

      {role === "student" && (
        <>
          <Field label="Família" hint="Vincula o mentorado ao projeto da família.">
            <SelectField
              name="family_id"
              value={familyId}
              onChange={(e) => handleFamilyChange(e.target.value)}
            >
              <option value="">Nenhuma</option>
              {families.map((f) => (
                <option key={f.id} value={f.id} disabled={!f.projectId}>
                  {f.name}
                  {!f.projectId ? " (sem projeto)" : ""}
                </option>
              ))}
            </SelectField>
          </Field>

          <VinculoField
            label="Mentores"
            hint={
              projectId
                ? "Quem for marcado passa a acompanhar o projeto desta família."
                : "Escolha uma família primeiro — o mentor é vinculado ao projeto dela, não à pessoa."
            }
            empty="Nenhum mentor cadastrado ainda."
            searchPlaceholder="Buscar mentor"
            disabled={!projectId}
            selected={mentorIds}
            onToggle={(id) => setMentorIds((ids) => toggle(ids, id))}
            items={mentors.map((m) => ({ id: m.id, label: m.fullName }))}
          />
        </>
      )}

      {role === "mentor" && (
        <VinculoField
          label="Mentorados"
          hint="O mentor passa a atender a família de cada mentorado marcado — e, com ela, os outros mentorados do mesmo projeto."
          empty="Nenhum mentorado cadastrado ainda."
          searchPlaceholder="Buscar mentorado ou família"
          selected={studentIds}
          onToggle={(id) => setStudentIds((ids) => toggle(ids, id))}
          items={students.map((s) => ({
            id: s.id,
            label: s.fullName,
            hint: s.familyName ?? "Sem família — vincule uma para poder atribuir um mentor",
            disabled: !s.projectId,
          }))}
        />
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Criando…" : "Criar usuário"}
        </Button>
        {cancel}
      </div>
    </form>
  );
}

/**
 * Lista de vínculos com checkbox, em vez de um `select multiple`: a seleção é de
 * várias pessoas e precisa dizer por que uma opção está indisponível (mentorado
 * sem família não tem projeto onde receber o mentor).
 *
 * Não usa `Field` porque aquele é um `<label>` e aqui cada linha já tem o seu.
 */
function VinculoField({
  label,
  hint,
  empty,
  searchPlaceholder,
  items,
  selected,
  onToggle,
  disabled,
}: {
  label: string;
  hint: string;
  empty: string;
  searchPlaceholder: string;
  items: { id: string; label: string; hint?: string; disabled?: boolean }[];
  selected: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");

  // O hint entra na busca junto com o nome: nas listas de mentorados ele é a
  // família, e procurar pela família é tão natural quanto pela pessoa.
  const term = normalize(query.trim());
  const filtered = term
    ? items.filter((item) => normalize(`${item.label} ${item.hint ?? ""}`).includes(term))
    : items;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        {/* A busca pode esconder quem já está marcado — o contador evita a
            impressão de que a seleção se perdeu. */}
        {selected.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {selected.length} {selected.length === 1 ? "selecionado" : "selecionados"}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className={cn("space-y-1.5", disabled && "opacity-50")}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              disabled={disabled}
              className="h-8 pl-8"
            />
          </div>

          <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-input">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-muted-foreground">
                Nada encontrado para “{query.trim()}”.
              </li>
            ) : (
              filtered.map((item) => {
                const itemDisabled = disabled || item.disabled;
                return (
                  <li key={item.id}>
                    <label
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2",
                        itemDisabled ? "cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      <Checkbox
                        checked={selected.includes(item.id)}
                        onCheckedChange={() => onToggle(item.id)}
                        disabled={itemDisabled}
                      />
                      <span className={cn("min-w-0", item.disabled && "opacity-50")}>
                        <span className="block truncate text-sm">{item.label}</span>
                        {item.hint && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.hint}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      <span className="block text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}
