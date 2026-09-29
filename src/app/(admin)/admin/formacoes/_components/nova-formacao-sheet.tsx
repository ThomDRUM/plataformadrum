"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FormacaoForm } from "./formacao-form";

export function NovaFormacaoSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="lg" />}>
        <Plus />
        Nova formação
      </SheetTrigger>

      <SheetContent
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
        overlayClassName={ADMIN_OVERLAY}
      >
        <SheetHeader>
          <SheetTitle>Nova formação</SheetTitle>
          <SheetDescription>
            A formação nasce vazia. Os módulos que a compõem são adicionados na tela
            dela — sem nenhum, quem a recebe não encontra o que estudar.
          </SheetDescription>
        </SheetHeader>

        <FormacaoForm
          className="p-4"
          onSaved={() => setOpen(false)}
          cancel={
            <SheetClose render={<Button variant="ghost" size="lg" />}>Cancelar</SheetClose>
          }
        />
      </SheetContent>
    </Sheet>
  );
}
