"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { AdminModuleRow } from "@/lib/admin/queries";
import {
  TableToolbar,
  emptyFilters,
  matchesFilter,
  normalize,
  type FilterGroup,
} from "@/components/admin/table-toolbar";
import { Frame, FramePanel } from "@/components/reui/frame";
import { ModuleTopicsBadge, ModuleUsageBadge } from "@/components/admin/status-badge";
import { ModuloAcoes } from "./modulo-acoes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Os dois estados que o admin precisa caçar: módulo vazio (nada para ler nem
 * responder) e módulo fora de toda formação (ninguém chega nele). Ambos viram
 * opção de filtro em vez de ficarem escondidos na leitura linha por linha.
 */
const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "topics",
    label: "Conteúdo",
    options: [
      { value: "filled", label: "Com tópicos" },
      { value: "empty", label: "Sem tópicos" },
    ],
  },
  {
    key: "usage",
    label: "Uso",
    options: [
      { value: "used", label: "Em formações" },
      { value: "unused", label: "Fora de formações" },
    ],
  },
];

export function ModulosTable({
  modules,
  action,
}: {
  modules: AdminModuleRow[];
  action?: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(() => emptyFilters(FILTER_GROUPS));

  const visible = useMemo(() => {
    const term = normalize(search.trim());

    return modules.filter((mod) => {
      if (!matchesFilter(filters.topics, mod.topicCount > 0 ? "filled" : "empty")) {
        return false;
      }
      if (!matchesFilter(filters.usage, mod.trailTitles.length > 0 ? "used" : "unused")) {
        return false;
      }
      if (!term) return true;

      return [mod.title, mod.internalName, mod.intention, mod.why, ...mod.trailTitles].some(
        (field) => field && normalize(field).includes(term)
      );
    });
  }, [modules, search, filters]);

  return (
    <>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por módulo, intenção ou formação"
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
                <TableHead>Módulo</TableHead>
                <TableHead>Nome interno</TableHead>
                <TableHead>Tópicos</TableHead>
                <TableHead>Formações</TableHead>
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
                    Nenhum módulo corresponde à busca.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/modulos/${mod.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {mod.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {/* Repetir o título aqui não informa nada: `createModule`
                          copia o título quando o campo fica vazio. */}
                      {mod.internalName && mod.internalName !== mod.title
                        ? mod.internalName
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <ModuleTopicsBadge count={mod.topicCount} />
                    </TableCell>
                    <TableCell>
                      <ModuleUsageBadge trailTitles={mod.trailTitles} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ModuloAcoes module={mod} />
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
