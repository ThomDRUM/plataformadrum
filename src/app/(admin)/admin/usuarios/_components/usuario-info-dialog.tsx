"use client";

import type { AdminUserRow } from "@/lib/admin/queries";
import { ROLE_LABEL, STUDENT_TYPE_LABEL } from "@/lib/admin/types";
import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { AccountStatusBadge } from "@/components/admin/status-badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** `undefined` enquanto carrega, `null` quando não deu para ler. */
export type Email = string | null | undefined;

interface Props {
  user: AdminUserRow;
  /** Buscado por quem abre o dialog — ver `fetchUserEmail`. */
  email: Email;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UsuarioInfoDialog({ user, email, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName={ADMIN_OVERLAY}>
        <DialogHeader>
          <DialogTitle>{user.fullName}</DialogTitle>
          <DialogDescription>
            {ROLE_LABEL[user.role] ?? user.role}
            {user.studentType
              ? ` · ${STUDENT_TYPE_LABEL[user.studentType] ?? user.studentType}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3">
          <InfoRow label="E-mail">
            {email === undefined ? (
              <span className="text-muted-foreground">Carregando…</span>
            ) : email ? (
              <span className="font-mono text-xs">{email}</span>
            ) : (
              <span className="text-muted-foreground">Não disponível</span>
            )}
          </InfoRow>

          <InfoRow label="Status">
            <AccountStatusBadge isActive={user.isActive} />
          </InfoRow>

          <InfoRow label="Papel">
            <Badge variant="secondary" size="sm">
              {ROLE_LABEL[user.role] ?? user.role}
            </Badge>
          </InfoRow>

          {user.role === "student" && (
            <InfoRow label="Tipo">
              {user.studentType
                ? STUDENT_TYPE_LABEL[user.studentType] ?? user.studentType
                : "Não definido"}
            </InfoRow>
          )}

          <InfoRow label="Formação">{user.trailTitle ?? "—"}</InfoRow>
          <InfoRow label="Família">{user.familyName ?? "—"}</InfoRow>
        </dl>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Fechar</DialogClose>
          <LinkButton href={`/admin/usuarios/${user.id}`}>Abrir tela completa</LinkButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}
