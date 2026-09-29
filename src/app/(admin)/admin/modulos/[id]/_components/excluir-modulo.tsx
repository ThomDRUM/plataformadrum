"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteModule } from "@/lib/actions/admin/content";
import { DeleteButton } from "@/components/admin/delete-button";

export function ExcluirModulo({ moduleId, name }: { moduleId: string; name: string }) {
  const router = useRouter();

  return (
    <DeleteButton
      label="Excluir"
      itemName={name}
      warning="Todos os tópicos deste módulo — com repertório, exercícios e as respostas já dadas pelos mentorados — são removidos. O módulo sai de todas as formações em que estiver."
      action={async () => {
        const result = await deleteModule(moduleId);
        if (!result.ok) throw new Error(result.error);
        toast.success("Módulo excluído.");
        router.push("/admin/modulos");
        router.refresh();
      }}
    />
  );
}
