"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteFamily } from "@/lib/actions/admin/families";
import { DeleteButton } from "@/components/admin/delete-button";

export function ExcluirFamilia({ familyId, name }: { familyId: string; name: string }) {
  const router = useRouter();

  return (
    <DeleteButton
      label="Excluir"
      itemName={name}
      warning="O projeto, a árvore genealógica, o patrimônio e o cronograma da família são removidos junto. Os usuários vinculados perdem o vínculo, mas continuam existindo."
      action={async () => {
        const result = await deleteFamily(familyId);
        if (!result.ok) throw new Error(result.error);
        toast.success("Família excluída.");
        router.push("/admin/familias");
        router.refresh();
      }}
    />
  );
}
