"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteUser } from "@/lib/actions/admin/users";
import type { AdminUserRow } from "@/lib/admin/queries";
import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditarUsuarioSheet } from "./editar-usuario-sheet";

export function UsuarioAcoes({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Usuário excluído.");
      setConfirmingDelete(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" />}
          aria-label={`Ações de ${user.fullName}`}
        >
          <EllipsisVerticalIcon aria-hidden="true" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <PencilIcon aria-hidden="true" />
              Editar
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmingDelete(true)}
          >
            <TrashIcon aria-hidden="true" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditarUsuarioSheet user={user} open={editing} onOpenChange={setEditing} />

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent overlayClassName={ADMIN_OVERLAY}>
          <DialogHeader>
            <DialogTitle>Excluir {user.fullName}?</DialogTitle>
            <DialogDescription>
              A conta de acesso e o perfil são removidos. Respostas de exercícios e
              progresso vão junto. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={isPending} />}>
              Cancelar
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
