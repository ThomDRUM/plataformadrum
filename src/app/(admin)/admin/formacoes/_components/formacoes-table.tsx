"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { AdminTrailRow } from "@/lib/admin/queries";
import { TRAIL_TYPE_LABEL } from "@/lib/admin/types";
import {
  TableToolbar,
  emptyFilters,
  matchesFilter,
  normalize,
  type FilterGroup,
} from "@/components/admin/table-toolbar";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { TrailModulesBadge } from "@/components/admin/status-badge";
import { FormacaoAcoes } from "./formacao-acoes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Formação vazia é um estado que o admin precisa caçar (quem a recebe não
 * encontra o que estudar), então vira uma opção de filtro própria — mesmo papel
 * de "Sem projeto" na lista de famílias.
 */
const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "trailType",
    label: "Para quem",
    options: [
      { value: "successor", label: TRAIL_TYPE_LABEL.successor },
      { value: "succeeded", label: TRAIL_TYPE_LABEL.succeeded },
      { value: "mentor", label: TRAIL_TYPE_LABEL.mentor },
    ],
  },
  {
    key: "modules",
    label: "Composição",
    options: [
      { value: "filled", label: "Com módulos" },
      { value: "empty", label: "Sem módulos" },
    ],
  },
];

export function FormacoesTable({
  trails,
  action,
}: {
  trails: AdminTrailRow[];
  action?: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(() => emptyFilters(FILTER_GROUPS));

  const visible = useMemo(() => {
    const term = normalize(search.trim());

    return trails.filter((trail) => {
      if (!matchesFilter(filters.trailType, trail.trailType)) return false;
      if (!matchesFilter(filters.modules, trail.moduleCount > 0 ? "filled" : "empty")) {
        return false;
      }
      if (!term) return true;

      return [trail.title, trail.intention, trail.why].some(
        (field) => field && normalize(field).includes(term)
      );
    });
  }, [trails, search, filters]);

  return (
    <>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por título ou intenção"
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
                <TableHead>Formação</TableHead>
                <TableHead>Para quem</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma formação corresponde à busca.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((trail) => (
                  <TableRow key={trail.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/formacoes/${trail.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {trail.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" size="sm">
                        {TRAIL_TYPE_LABEL[trail.trailType] ?? trail.trailType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TrailModulesBadge count={trail.moduleCount} />
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {trail.userCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <FormacaoAcoes trail={trail} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </FramePanel>
      </Frame>
    </>
  );
}
