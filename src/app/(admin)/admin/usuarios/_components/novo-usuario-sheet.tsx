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
import { NovoUsuarioForm } from "./novo-usuario-form";

interface Props {
  trails: { id: string; title: string; trail_type: string }[];
  families: { id: string; name: string; projectId: string | null }[];
  mentors: { id: string; fullName: string }[];
  students: {
    id: string;
    fullName: string;
    projectId: string | null;
    familyName: string | null;
  }[];
}

export function NovoUsuarioSheet({ trails, families, mentors, students }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="lg" />}>
        <Plus />
        Novo usuário
      </SheetTrigger>

      <SheetContent
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
        overlayClassName={ADMIN_OVERLAY}
      >
        <SheetHeader>
          <SheetTitle>Novo usuário</SheetTitle>
          <SheetDescription>
            Cria o login e o perfil de uma só vez. A pessoa já consegue entrar com
            o e-mail e a senha definidos aqui.
          </SheetDescription>
        </SheetHeader>

        <NovoUsuarioForm
          trails={trails}
          families={families}
          mentors={mentors}
          students={students}
          className="p-4"
          onCreated={() => setOpen(false)}
          cancel={
            <SheetClose render={<Button variant="ghost" size="lg" />}>
              Cancelar
            </SheetClose>
          }
        />
      </SheetContent>
    </Sheet>
  );
}
