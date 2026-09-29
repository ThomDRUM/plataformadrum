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
import { ModuloForm } from "./modulo-form";

export function NovoModuloSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="lg" />}>
        <Plus />
        Novo módulo
      </SheetTrigger>

      <SheetContent
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
        overlayClassName={ADMIN_OVERLAY}
      >
        <SheetHeader>
          <SheetTitle>Novo módulo</SheetTitle>
          <SheetDescription>
            O módulo nasce vazio e independente. Os tópicos são escritos na tela dele;
            entrar numa formação é um passo à parte, feito na tela da formação.
          </SheetDescription>
        </SheetHeader>

        <ModuloForm
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
