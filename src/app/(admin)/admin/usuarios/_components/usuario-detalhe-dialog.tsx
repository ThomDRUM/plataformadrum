"use client";

import { useState } from "react";

import type { UserFullDetail } from "@/lib/actions/admin/users";
import type { AdminUserRow } from "@/lib/admin/queries";
import { ROLE_LABEL } from "@/lib/admin/types";
import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import { Separator } from "@/components/ui/separator";
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
import { PerfilForm } from "@/app/(admin)/admin/usuarios/[id]/_components/perfil-form";
import { VinculosSection } from "@/app/(admin)/admin/usuarios/[id]/_components/vinculos-section";
import { ModulosSection } from "@/app/(admin)/admin/usuarios/[id]/_components/modulos-section";

const PERFIL_FORM_ID = "usuario-detalhe-perfil-form";

interface Props {
  user: AdminUserRow;
  /** Buscado por quem abre o dialog — ver `handleShowDetail` em `UsuariosTable`. */
  detail: UserFullDetail | null;
  error: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UsuarioDetalheDialog({ user, detail, error, open, onOpenChange }: Props) {
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={ADMIN_OVERLAY}
        className="max-h-[85vh] gap-0 overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>{user.fullName}</DialogTitle>
          <DialogDescription>{ROLE_LABEL[user.role] ?? user.role}</DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="py-10 text-center text-sm text-destructive">{error}</p>
        ) : !detail ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="space-y-6 py-2">
            <PerfilForm
              userId={user.id}
              email={detail.email}
              fullName={detail.profile.full_name}
              role={detail.profile.role}
              studentType={detail.profile.student_type}
              yearlyIntention={detail.profile.yearly_intention}
              formId={PERFIL_FORM_ID}
              onDirtyChange={setIsProfileDirty}
              onPendingChange={setIsSavingProfile}
            />

            <Separator />

            <VinculosSection
              userId={user.id}
              role={detail.profile.role}
              trailId={detail.profile.trail_id}
              projectId={detail.profile.project_id}
              trails={detail.trails}
              families={detail.families}
              mentorProjectIds={detail.mentorProjectIds}
            />

            {detail.profile.role !== "admin" && (
              <>
                <Separator />
                <ModulosSection
                  userId={user.id}
                  modules={detail.modules}
                  hasTrail={Boolean(detail.profile.trail_id)}
                />
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Fechar</DialogClose>
          {detail && (
            <Button type="submit" form={PERFIL_FORM_ID} disabled={!isProfileDirty || isSavingProfile}>
              {isSavingProfile ? "Salvando…" : "Salvar perfil"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
