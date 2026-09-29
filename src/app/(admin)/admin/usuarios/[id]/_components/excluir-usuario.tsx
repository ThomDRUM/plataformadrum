"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteUser } from "@/lib/actions/admin/users";
import { DeleteButton } from "@/components/admin/delete-button";

export function ExcluirUsuario({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();

  return (
    <DeleteButton
      label="Excluir"
      itemName={name}
      warning="A conta de acesso e o perfil são removidos. Respostas de exercícios e progresso vão junto."
      action={async () => {
        const result = await deleteUser(userId);
        if (!result.ok) {
          // Relançar mantém o diálogo aberto e deixa o DeleteButton mostrar o erro.
          throw new Error(result.error);
        }
        toast.success("Usuário excluído.");
        router.push("/admin/usuarios");
        router.refresh();
      }}
    />
  );
}
