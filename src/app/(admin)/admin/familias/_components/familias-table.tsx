"use client";

import { useMemo, useState } from "react";

import {
  fetchFamilyFullDetail,
  type FamilyFullDetail,
} from "@/lib/actions/admin/families";
import type { AdminFamilyRow } from "@/lib/admin/queries";
import { PROJECT_STATUS_LABEL } from "@/lib/admin/types";
import {
  TableToolbar,
  emptyFilters,
  matchesFilter,
  normalize,
  type FilterGroup,
} from "@/components/admin/table-toolbar";
import { Frame, FramePanel } from "@/components/reui/frame";
import { ProjectStatusBadge } from "@/components/admin/status-badge";
import { FamiliaAcoes } from "./familia-acoes";
import { FamiliaDetalheDialog } from "./familia-detalhe-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Família sem projeto é um estado que o admin precisa caçar (é o que trava o
 * vínculo de mentorado e mentor), então vira uma opção de filtro própria em vez
 * de ficar escondida entre os status.
 */
const NO_PROJECT = "__none__";

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "status",
    label: "Projeto",
    options: [
      { value: "active", label: PROJECT_STATUS_LABEL.active },
      { value: "paused", label: PROJECT_STATUS_LABEL.paused },
      { value: "completed", label: PROJECT_STATUS_LABEL.completed },
      { value: NO_PROJECT, label: "Sem projeto" },
    ],
  },
];

export function FamiliasTable({
  families,
  action,
}: {
  families: AdminFamilyRow[];
  action?: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(() => emptyFilters(FILTER_GROUPS));
  const [detailFamily, setDetailFamily] = useState<AdminFamilyRow | null>(null);
  const [detail, setDetail] = useState<FamilyFullDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  /**
   * Busca no clique, não no `onOpenChange` do dialog: o `open` é controlado
   * de fora (por `detailFamily`), então o callback do dialog só dispara em
   * fechamentos internos (Esc, clique no overlay) — nunca na abertura.
   */
  function loadDetail(familyId: string) {
    setDetailError(null);

    fetchFamilyFullDetail(familyId).then((result) => {
      if (result.ok) setDetail(result.data);
      else setDetailError(result.error);
    });
  }

  function handleShowDetail(family: AdminFamilyRow) {
    setDetailFamily(family);
    setDetail(null);
    loadDetail(family.id);
  }

  const visible = useMemo(() => {
    const term = normalize(search.trim());

    return families.filter((family) => {
      const project = family.projects[0];
      if (!matchesFilter(filters.status, project?.status ?? NO_PROJECT)) return false;
      if (!term) return true;

      return [family.name, family.businessName, project?.name].some(
        (field) => field && normalize(field).includes(term)
      );
    });
  }, [families, search, filters]);

  return (
    <>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por família, negócio ou projeto"
        groups={FILTER_GROUPS}
        filters={filters}
        onFiltersChange={setFilters}
        action={action}
      />

      <Frame spacing="xs">
        <FramePanel className="p-0!">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Família</TableHead>
                <TableHead>Negócio</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma família corresponde à busca.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((family) => {
                  const project = family.projects[0];
                  return (
                    <TableRow key={family.id}>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          onClick={() => handleShowDetail(family)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          {family.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {family.businessName || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <ProjectStatusBadge status={project?.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {family.memberCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <FamiliaAcoes family={family} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </FramePanel>
      </Frame>

      {detailFamily && (
        <FamiliaDetalheDialog
          family={detailFamily}
          detail={detail}
          error={detailError}
          onSaved={() => loadDetail(detailFamily.id)}
          open={detailFamily !== null}
          onOpenChange={(open) => {
            if (!open) setDetailFamily(null);
          }}
        />
      )}
    </>
  );
}
