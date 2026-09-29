"use client";

import type { AdminModuleRow } from "@/lib/admin/queries";
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
import { ModuloForm } from "./modulo-form";

interface Props {
  module: AdminModuleRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Edição do módulo a partir da lista: só os dados próprios.
 *
 * A listagem já carrega todos eles, então não há busca ao abrir. Os tópicos —
 * com repertório e exercício — continuam na tela do módulo.
 */
export function EditarModuloSheet({ module: mod, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
        overlayClassName={ADMIN_OVERLAY}
      >
        <SheetHeader>
          <SheetTitle>Editar {mod.title}</SheetTitle>
          <SheetDescription>
            Dados do módulo. Escrever os tópicos continua na tela dele.
          </SheetDescription>
        </SheetHeader>

        <ModuloForm
          moduleId={mod.id}
          initial={mod}
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
