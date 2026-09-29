"use client";

import { useMemo, useState } from "react";
import { ChevronRightIcon } from "lucide-react";

import { fetchMentoradoDetail } from "@/lib/actions/mentor";
import type { MentoradoDetail } from "@/lib/mentor/mentorado-detail";
import {
  TableToolbar,
  emptyFilters,
  matchesFilter,
  normalize,
  type FilterGroup,
} from "@/components/admin/table-toolbar";
import { Badge, type badgeVariants } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MentoradoDetalheDialog } from "./mentorado-detalhe-dialog";
import type { VariantProps } from "class-variance-authority";

const STUDENT_TYPE_LABEL: Record<string, string> = {
  successor: "Sucessor",
  succeeded: "Sucedido",
};

type ProgressStatus = "no_trail" | "not_started" | "in_progress" | "completed";

const STATUS_LABEL: Record<ProgressStatus, string> = {
  no_trail: "Sem trilha",
  not_started: "Não iniciado",
  in_progress: "Em andamento",
  completed: "Concluído",
};

const STATUS_VARIANT: Record<ProgressStatus, VariantProps<typeof badgeVariants>["variant"]> = {
  no_trail: "destructive-light",
  not_started: "outline",
  in_progress: "warning-light",
  completed: "success-light",
};

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as ProgressStatus[]).map((value) => ({
  value,
  label: STATUS_LABEL[value],
}));

const TIPO_OPTIONS = [
  { value: "successor", label: STUDENT_TYPE_LABEL.successor },
  { value: "succeeded", label: STUDENT_TYPE_LABEL.succeeded },
];

export interface MentoradoRow {
  id: string;
  fullName: string;
  studentType: string | null;
  familyId: string | null;
  familyName: string | null;
  modulesUnlocked: number;
  modulesTotal: number;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getStatus(m: MentoradoRow): ProgressStatus {
  if (m.modulesTotal === 0) return "no_trail";
  if (m.modulesUnlocked === 0) return "not_started";
  if (m.modulesUnlocked === m.modulesTotal) return "completed";
  return "in_progress";
}

export function MentoradosTable({ mentorados, mentorId }: { mentorados: MentoradoRow[]; mentorId: string }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MentoradoRow | null>(null);
  const [detail, setDetail] = useState<MentoradoDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const groups = useMemo<FilterGroup[]>(() => {
    const familyNameById = new Map<string, string>();
    for (const m of mentorados) {
      if (m.familyId && m.familyName) familyNameById.set(m.familyId, m.familyName);
    }
    const familyOptions = [...familyNameById.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

    return [
      ...(familyOptions.length > 0 ? [{ key: "family", label: "Família", options: familyOptions }] : []),
      { key: "status", label: "Status", options: STATUS_OPTIONS },
      { key: "studentType", label: "Tipo", options: TIPO_OPTIONS },
    ];
  }, [mentorados]);

  const [filters, setFilters] = useState(() => emptyFilters(groups));

  /**
   * Busca no clique, não no `onOpenChange` do dialog: o `open` é controlado de
   * fora (por `selected`), então o callback do dialog só dispara em
   * fechamentos internos (Esc, clique no overlay) — nunca na abertura.
   */
  function handleShowDetail(mentorado: MentoradoRow) {
    setSelected(mentorado);
    setDetail(null);
    setDetailError(null);

    fetchMentoradoDetail(mentorado.id).then((result) => {
      if (result.ok) setDetail(result.data);
      else setDetailError(result.error);
    });
  }

  const visible = useMemo(() => {
    const term = normalize(search.trim());

    return mentorados.filter((m) => {
      if (!matchesFilter(filters.family, m.familyId)) return false;
      if (!matchesFilter(filters.status, getStatus(m))) return false;
      if (!matchesFilter(filters.studentType, m.studentType)) return false;
      if (!term) return true;

      return [m.fullName, m.familyName].some((field) => field && normalize(field).includes(term));
    });
  }, [mentorados, search, filters]);

  return (
    <>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou família"
        groups={groups}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <Frame spacing="xs">
        <FramePanel className="p-0!">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentorado</TableHead>
                <TableHead>Família</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="w-12 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum mentorado corresponde à busca.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((m) => {
                  const status = getStatus(m);

                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleShowDetail(m)}
                          className="group flex items-center gap-3 text-left"
                        >
                          <Avatar size="sm">
                            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                              {initials(m.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                            {m.fullName}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.familyName ?? "—"}</TableCell>
                      <TableCell>
                        {m.studentType && STUDENT_TYPE_LABEL[m.studentType] ? (
                          <Badge
                            variant={m.studentType === "successor" ? "info-light" : "secondary"}
                            size="sm"
                          >
                            {STUDENT_TYPE_LABEL[m.studentType]}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={STATUS_VARIANT[status]} size="sm">
                            {STATUS_LABEL[status]}
                          </Badge>
                          {m.modulesTotal > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {m.modulesUnlocked} de {m.modulesTotal} módulos
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleShowDetail(m)}
                          aria-label={`Ver detalhe de ${m.fullName}`}
                        >
                          <ChevronRightIcon aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </FramePanel>
      </Frame>

      {selected && (
        <MentoradoDetalheDialog
          fullName={selected.fullName}
          mentorId={mentorId}
          detail={detail}
          error={detailError}
          open={selected !== null}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </>
  );
}
