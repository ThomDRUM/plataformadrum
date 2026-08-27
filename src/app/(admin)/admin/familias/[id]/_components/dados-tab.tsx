"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateFamilyField } from "@/lib/actions/admin/families";
import { Field, TextField, TextAreaField } from "@/components/admin/form-fields";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FamilyField = "name" | "business_name" | "history" | "mission" | "vision" | "values";

interface Props {
  familyId: string;
  /** Chamado depois de gravar — o dialog de detalhe usa para recarregar. */
  onSaved?: () => void;
  /** Solta a coluna de leitura: a tela mantém `max-w-2xl`, o dialog usa a largura toda. */
  className?: string;
  family: {
    name: string;
    business_name: string;
    history: string;
    mission: string;
    vision: string;
    values: string;
  };
}

const LONG_FIELDS: { field: FamilyField; label: string }[] = [
  { field: "history", label: "História" },
  { field: "mission", label: "Missão" },
  { field: "vision", label: "Visão" },
  { field: "values", label: "Valores" },
];

export function DadosTab({ familyId, family, onSaved, className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(family);

  function save(field: FamilyField, value: string) {
    startTransition(async () => {
      const result = await updateFamilyField(familyId, field, value);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Salvo.");
      router.refresh();
      onSaved?.();
    });
  }

  function set(field: FamilyField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  const dirty = (Object.keys(values) as FamilyField[]).filter(
    (field) => values[field] !== family[field]
  );

  return (
    <div className={cn("max-w-2xl", className)}>
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Dados da família</FrameTitle>
          <FrameDescription>
            História, missão, visão e valores também são editáveis pelo mentor na área
            dele. As alterações são salvas ao sair do campo.
          </FrameDescription>
        </FrameHeader>

        <FramePanel>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome da família">
                <TextField
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => values.name !== family.name && save("name", values.name)}
                />
              </Field>

              <Field label="Nome do negócio">
                <TextField
                  value={values.business_name}
                  onChange={(e) => set("business_name", e.target.value)}
                  onBlur={() =>
                    values.business_name !== family.business_name &&
                    save("business_name", values.business_name)
                  }
                />
              </Field>
            </div>

            {LONG_FIELDS.map(({ field, label }) => (
              <Field key={field} label={label}>
                <TextAreaField
                  rows={4}
                  value={values[field]}
                  onChange={(e) => set(field, e.target.value)}
                  onBlur={() => values[field] !== family[field] && save(field, values[field])}
                />
              </Field>
            ))}
          </div>
        </FramePanel>

        <FrameFooter>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isPending || dirty.length === 0}
              onClick={() => dirty.forEach((field) => save(field, values[field]))}
            >
              Salvar tudo
            </Button>
            <p className="text-xs text-muted-foreground">
              {isPending
                ? "Salvando…"
                : dirty.length > 0
                  ? `${dirty.length} ${dirty.length === 1 ? "campo" : "campos"} sem salvar`
                  : "Tudo salvo."}
            </p>
          </div>
        </FrameFooter>
      </Frame>
    </div>
  );
}
