"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteFamily, fetchFamilyOverview } from "@/lib/actions/admin/families";
import type { AdminFamilyRow, FamilyOverview } from "@/lib/admin/queries";
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
import { EditarFamiliaSheet } from "./editar-familia-sheet";

export function FamiliaAcoes({ family }: { family: AdminFamilyRow }) {
  const router = useRouter();
  const [overview, setOverview] = useState<FamilyOverview | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * O sheet de edição trabalha sobre o retrato completo, que a listagem não
   * carrega. Buscado na abertura — no handler, não num effect, e sempre de novo
   * para não mostrar um valor velho depois de um salvamento.
   */
  function loadOverview() {
    setOverview(undefined);

    return fetchFamilyOverview(family.id).then((result) => {
      setOverview(result.ok ? result.data : null);
    });
  }

  function handleEdit() {
    setEditing(true);
    loadOverview();
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteFamily(family.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Família excluída.");
      setConfirmingDelete(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" />}
          aria-label={`Ações de ${family.name}`}
        >
          <EllipsisVerticalIcon aria-hidden="true" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleEdit}>
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

      <EditarFamiliaSheet
        familyName={family.name}
        overview={overview}
        open={editing}
        onOpenChange={setEditing}
      />

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent overlayClassName={ADMIN_OVERLAY}>
          <DialogHeader>
            <DialogTitle>Excluir {family.name}?</DialogTitle>
            <DialogDescription>
              O projeto, a árvore genealógica, o patrimônio e o cronograma da família
              são removidos junto. Os usuários vinculados perdem o vínculo, mas
              continuam existindo. Esta ação não pode ser desfeita.
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
