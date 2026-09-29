"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EllipsisVerticalIcon, InfoIcon, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteModule, fetchModuleOverview } from "@/lib/actions/admin/content";
import type { AdminModuleRow, ModuleOverview } from "@/lib/admin/queries";
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
import { EditarModuloSheet } from "./editar-modulo-sheet";
import { ModuloInfoDialog } from "./modulo-info-dialog";

export function ModuloAcoes({ module: mod }: { module: AdminModuleRow }) {
  const router = useRouter();
  const [showingInfo, setShowingInfo] = useState(false);
  const [overview, setOverview] = useState<ModuleOverview | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * Os tópicos e as formações que usam o módulo não vêm na listagem. Buscados
   * na abertura — no handler, não num effect, e sempre de novo para não mostrar
   * um valor velho depois de um salvamento.
   */
  function handleShowInfo() {
    setShowingInfo(true);
    setOverview(undefined);

    fetchModuleOverview(mod.id).then((result) => {
      setOverview(result.ok ? result.data : null);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteModule(mod.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Módulo excluído.");
      setConfirmingDelete(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" />}
          aria-label={`Ações de ${mod.title}`}
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

      <ModuloInfoDialog
        module={mod}
        overview={overview}
        open={showingInfo}
        onOpenChange={setShowingInfo}
      />

      <EditarModuloSheet module={mod} open={editing} onOpenChange={setEditing} />

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent overlayClassName={ADMIN_OVERLAY}>
          <DialogHeader>
            <DialogTitle>Excluir {mod.title}?</DialogTitle>
            <DialogDescription>
              Todos os tópicos deste módulo — com repertório, exercícios e as respostas
              já dadas pelos mentorados — são removidos.{" "}
              {mod.trailTitles.length > 0
                ? // Nomear as formações afetadas: a exclusão não é bloqueada, então
                  // é aqui que o admin vê o alcance dela.
                  `O módulo também sai ${mod.trailTitles.length === 1 ? "da formação" : "das formações"} ${mod.trailTitles.join(", ")}.`
                : "O módulo não está em nenhuma formação."}{" "}
              Esta ação não pode ser desfeita.
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
