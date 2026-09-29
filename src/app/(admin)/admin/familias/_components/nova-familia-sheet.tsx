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
import { NovaFamiliaForm } from "./nova-familia-form";

export function NovaFamiliaSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="lg" />}>
        <Plus />
        Nova família
      </SheetTrigger>

      <SheetContent
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
        overlayClassName={ADMIN_OVERLAY}
      >
        <SheetHeader>
          <SheetTitle>Nova família</SheetTitle>
          <SheetDescription>
            A família e o projeto são criados juntos. Os demais dados (história,
            missão, árvore genealógica) são preenchidos pelo mentor.
          </SheetDescription>
        </SheetHeader>

        <NovaFamiliaForm
          className="p-4"
          onCreated={() => setOpen(false)}
          cancel={
            <SheetClose render={<Button variant="ghost" size="lg" />}>Cancelar</SheetClose>
          }
        />
      </SheetContent>
    </Sheet>
  );
}
