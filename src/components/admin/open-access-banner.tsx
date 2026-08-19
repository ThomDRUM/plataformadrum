import { TriangleAlert } from "lucide-react";

/**
 * Aviso permanente enquanto `ADMIN_ALLOW_ANY_USER=true`. Deliberadamente
 * difícil de ignorar: uma flag dessas esquecida ligada em produção entrega a
 * administração inteira para qualquer conta.
 */
export function OpenAccessBanner() {
  return (
    <div className="flex items-start gap-2.5 border-b border-destructive/30 bg-destructive/10 px-4 py-2.5">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <p className="text-xs text-foreground">
        <strong className="font-semibold">Modo de teste:</strong> qualquer conta autenticada
        está entrando nesta área, sem verificação de papel. Antes de publicar, remova{" "}
        <code className="rounded bg-background/60 px-1 py-0.5">ADMIN_ALLOW_ANY_USER</code> do{" "}
        <code className="rounded bg-background/60 px-1 py-0.5">.env</code> e reinicie o
        servidor.
      </p>
    </div>
  );
}
