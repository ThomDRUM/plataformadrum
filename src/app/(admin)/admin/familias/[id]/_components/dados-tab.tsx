"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateFamilyField } from "@/lib/actions/admin/families";
import { Field, TextField, TextAreaField } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

type FamilyField = "name" | "business_name" | "history" | "mission" | "vision" | "values";

interface Props {
  familyId: string;
  family: {
    name: string;
    business_name: string;
    history: string;
    mission: string;
    vision: string;
    values: string;
  };
}

const LONG_FIELDS: { field: FamilyField; label: string; hint?: string }[] = [
  { field: "history", label: "História" },
  { field: "mission", label: "Missão" },
  { field: "vision", label: "Visão" },
  { field: "values", label: "Valores" },
];

export function DadosTab({ familyId, family }: Props) {
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
    });
  }

  function set(field: FamilyField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <p className="text-xs text-muted-foreground">
        História, missão, visão e valores também são editáveis pelo mentor na área dele.
      </p>

      <Field label="Nome da família">
        <div className="flex items-center gap-2">
          <TextField
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => values.name !== family.name && save("name", values.name)}
          />
        </div>
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

      <p className="text-xs text-muted-foreground">
        {isPending ? "Salvando…" : "As alterações são salvas ao sair do campo."}
      </p>

      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={isPending}
        onClick={() => {
          (Object.keys(values) as FamilyField[])
            .filter((f) => values[f] !== family[f])
            .forEach((f) => save(f, values[f]));
        }}
      >
        Salvar tudo
      </Button>
    </div>
  );
}
