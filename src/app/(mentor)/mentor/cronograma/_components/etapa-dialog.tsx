"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Field, TextField, TextAreaField, SelectField } from "@/components/admin/form-fields";
import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type EtapaStatus = "a_comecar" | "em_andamento" | "concluido";

export interface EtapaItem {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  status: EtapaStatus;
  mentor_notes: string;
}

interface Props {
  item: EtapaItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<EtapaItem>) => void;
  onSave: () => void;
  onDelete: () => void;
}

export function EtapaDialog({ item, open, onOpenChange, onChange, onSave, onDelete }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmingDelete(false);
        onOpenChange(next);
      }}
    >
      <DialogContent overlayClassName={ADMIN_OVERLAY} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar etapa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field label="Título">
            <TextField value={item.title} onChange={(e) => onChange({ title: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <TextField
                type="date"
                value={item.start_date ?? ""}
                onChange={(e) => onChange({ start_date: e.target.value || null })}
              />
            </Field>
            <Field label="Fim">
              <TextField
                type="date"
                value={item.end_date ?? ""}
                onChange={(e) => onChange({ end_date: e.target.value || null })}
              />
            </Field>
          </div>

          <Field label="Status">
            <SelectField
              value={item.status}
              onChange={(e) => onChange({ status: e.target.value as EtapaStatus })}
            >
              <option value="a_comecar">A começar</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluido">Concluído</option>
            </SelectField>
          </Field>

          <Field label="Notas">
            <TextAreaField
              rows={3}
              placeholder="Observações sobre esta etapa..."
              value={item.mentor_notes}
              onChange={(e) => onChange({ mentor_notes: e.target.value })}
            />
          </Field>
        </div>

        <DialogFooter>
          {confirmingDelete ? (
            <div className="mr-auto flex items-center gap-2 text-xs">
              <span className="text-foreground">Remover esta etapa?</span>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Confirmar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="mr-auto text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Remover etapa
            </Button>
          )}
          <DialogClose render={<Button variant="outline" />}>Fechar</DialogClose>
          <Button onClick={onSave}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
