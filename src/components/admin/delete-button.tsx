"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  action: () => Promise<void>;
  label?: string;
  /** Nome do que será excluído, mostrado na confirmação. */
  itemName?: string;
  /** Aviso extra sobre o que a exclusão leva junto (ex.: tópicos e respostas). */
  warning?: string;
}

/**
 * Exclusão sempre passa por confirmação: as tabelas de conteúdo têm cascade,
 * então um clique errado num módulo leva tópicos, exercícios e as respostas
 * já escritas pelos alunos.
 */
export function DeleteButton({ action, label, itemName, warning }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await action();
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível excluir.");
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive h-8 px-2"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="w-3.5 h-3.5" />
        {label && <span className="ml-1.5">{label}</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {itemName ?? "item"}?</DialogTitle>
            <DialogDescription>
              {warning ?? "Esta ação não pode ser desfeita."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
