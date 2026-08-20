"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EllipsisVerticalIcon, InfoIcon, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteUser, fetchUserEmail } from "@/lib/actions/admin/users";
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
import { UsuarioInfoDialog, type Email } from "./usuario-info-dialog";

export function UsuarioAcoes({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const [showingInfo, setShowingInfo] = useState(false);
  const [email, setEmail] = useState<Email>(undefined);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * O e-mail vive em `auth.users` e não vem na listagem, então é buscado na
   * abertura — no handler, não num effect, para o dialog seguir sem estado.
   */
  function handleShowInfo() {
    setShowingInfo(true);
    setEmail(undefined);

    fetchUserEmail(user.id).then((result) => {
      setEmail(result.ok ? result.data.email : null);
    });
  }

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
            <DropdownMenuItem onClick={handleShowInfo}>
              <InfoIcon aria-hidden="true" />
              Informações
            </DropdownMenuItem>
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

      <UsuarioInfoDialog
        user={user}
        email={email}
        open={showingInfo}
        onOpenChange={setShowingInfo}
      />

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
