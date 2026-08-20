"use client";

import type { AdminTrailRow } from "@/lib/admin/queries";
import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FormacaoForm } from "./formacao-form";

interface Props {
  trail: AdminTrailRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Edição da formação a partir da lista: só os dados próprios.
 *
 * A listagem já carrega todos eles, então não há busca ao abrir. A composição
 * (quais módulos, em que ordem) continua na tela da formação — depende da lista
 * de módulos disponíveis.
 */
export function EditarFormacaoSheet({ trail, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
        overlayClassName={ADMIN_OVERLAY}
      >
        <SheetHeader>
          <SheetTitle>Editar {trail.title}</SheetTitle>
          <SheetDescription>
            Dados da formação. Escolher os módulos e sua ordem continua na tela da
            formação.
          </SheetDescription>
        </SheetHeader>

        <FormacaoForm
          trailId={trail.id}
          initial={trail}
          className="p-4"
          onSaved={() => onOpenChange(false)}
          cancel={
            <SheetClose render={<Button variant="ghost" size="lg" />}>Cancelar</SheetClose>
          }
        />
      </SheetContent>
    </Sheet>
  );
}
