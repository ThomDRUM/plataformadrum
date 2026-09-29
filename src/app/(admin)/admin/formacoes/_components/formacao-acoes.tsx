"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EllipsisVerticalIcon, InfoIcon, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteTrail, fetchTrailOverview } from "@/lib/actions/admin/content";
import type { AdminTrailRow, TrailOverview } from "@/lib/admin/queries";
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
import { EditarFormacaoSheet } from "./editar-formacao-sheet";
import { FormacaoInfoDialog } from "./formacao-info-dialog";

export function FormacaoAcoes({ trail }: { trail: AdminTrailRow }) {
  const router = useRouter();
  const [showingInfo, setShowingInfo] = useState(false);
  const [overview, setOverview] = useState<TrailOverview | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * Os módulos e quem usa a formação não vêm na listagem. Buscados na abertura
   * — no handler, não num effect, e sempre de novo para não mostrar um valor
   * velho depois de um salvamento.
   */
  function handleShowInfo() {
    setShowingInfo(true);
    setOverview(undefined);

    fetchTrailOverview(trail.id).then((result) => {
      setOverview(result.ok ? result.data : null);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTrail(trail.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Formação excluída.");
      setConfirmingDelete(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" />}
          aria-label={`Ações de ${trail.title}`}
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

      <FormacaoInfoDialog
        trail={trail}
        overview={overview}
        open={showingInfo}
        onOpenChange={setShowingInfo}
      />

      <EditarFormacaoSheet trail={trail} open={editing} onOpenChange={setEditing} />

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent overlayClassName={ADMIN_OVERLAY}>
          <DialogHeader>
            <DialogTitle>Excluir {trail.title}?</DialogTitle>
            <DialogDescription>
              {trail.userCount > 0
                ? // A action recusa a exclusão nesse caso; dizer isso antes evita
                  // um clique que só devolve erro.
                  `${trail.userCount} usuário(s) ainda usam esta formação. Troque a formação deles antes de excluir.`
                : "Os módulos não são excluídos — apenas deixam de fazer parte desta formação. Esta ação não pode ser desfeita."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={isPending} />}>
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending || trail.userCount > 0}
            >
              {isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
