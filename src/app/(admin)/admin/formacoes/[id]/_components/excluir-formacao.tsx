"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteTrail } from "@/lib/actions/admin/content";
import { DeleteButton } from "@/components/admin/delete-button";

export function ExcluirFormacao({ trailId, name }: { trailId: string; name: string }) {
  const router = useRouter();

  return (
    <DeleteButton
      label="Excluir"
      itemName={name}
      warning="Os módulos não são excluídos — apenas deixam de fazer parte desta formação."
      action={async () => {
        const result = await deleteTrail(trailId);
        if (!result.ok) throw new Error(result.error);
        toast.success("Formação excluída.");
        router.push("/admin/formacoes");
        router.refresh();
      }}
    />
  );
}
