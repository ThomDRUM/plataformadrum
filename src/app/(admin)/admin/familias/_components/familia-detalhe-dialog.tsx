"use client";

import type { FamilyFullDetail } from "@/lib/actions/admin/families";
import type { AdminFamilyRow } from "@/lib/admin/queries";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PessoasTab } from "@/app/(admin)/admin/familias/[id]/_components/pessoas-tab";
import { ProjetoTab } from "@/app/(admin)/admin/familias/[id]/_components/projeto-tab";
import { DadosTab } from "@/app/(admin)/admin/familias/[id]/_components/dados-tab";

interface Props {
  family: AdminFamilyRow;
  /** Buscado por quem abre o dialog — ver `handleShowDetail` em `FamiliasTable`. */
  detail: FamilyFullDetail | null;
  error: string | null;
  /** Rebusca o retrato: as abas gravam campo a campo e precisam refletir o salvo. */
  onSaved: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FamiliaDetalheDialog({
  family,
  detail,
  error,
  onSaved,
  open,
  onOpenChange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={ADMIN_OVERLAY}
        className="max-h-[85vh] gap-0 overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle>{detail?.family.name ?? family.name}</DialogTitle>
          <DialogDescription>
            {detail?.family.business_name || family.businessName || "Sem negócio informado"}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="py-10 text-center text-sm text-destructive">{error}</p>
        ) : !detail ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <Tabs defaultValue="pessoas" className="py-2">
            <TabsList>
              <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
              <TabsTrigger value="projeto">Projeto</TabsTrigger>
              <TabsTrigger value="dados">Dados</TabsTrigger>
            </TabsList>

            <TabsContent value="pessoas" className="pt-6">
              <PessoasTab
                projects={detail.projects}
                students={detail.students}
                mentorLinks={detail.mentorLinks}
                allProfiles={detail.allProfiles}
                onSaved={onSaved}
              />
            </TabsContent>

            <TabsContent value="projeto" className="pt-6">
              <ProjetoTab
                familyId={family.id}
                projects={detail.projects}
                onSaved={onSaved}
                className="max-w-none"
              />
            </TabsContent>

            <TabsContent value="dados" className="pt-6">
              <DadosTab
                familyId={family.id}
                family={detail.family}
                onSaved={onSaved}
                className="max-w-none"
              />
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Fechar</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
