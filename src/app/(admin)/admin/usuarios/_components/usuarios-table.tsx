"use client";

import { useMemo, useState } from "react";

import { fetchUserFullDetail, type UserFullDetail } from "@/lib/actions/admin/users";
import type { AdminUserRow } from "@/lib/admin/queries";
import { ROLE_LABEL, STUDENT_TYPE_LABEL } from "@/lib/admin/types";
import {
  TableToolbar,
  emptyFilters,
  matchesFilter,
  normalize,
  type FilterGroup,
} from "@/components/admin/table-toolbar";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { AccountStatusBadge } from "@/components/admin/status-badge";
import { UsuarioAcoes } from "./usuario-acoes";
import { UsuarioDetalheDialog } from "./usuario-detalhe-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "role",
    label: "Papel",
    options: [
      { value: "student", label: ROLE_LABEL.student },
      { value: "mentor", label: ROLE_LABEL.mentor },
      { value: "admin", label: ROLE_LABEL.admin },
    ],
  },
  {
    key: "status",
    label: "Status da conta",
    options: [
      { value: "active", label: "Ativo" },
      { value: "inactive", label: "Desativado" },
    ],
  },
  {
    key: "studentType",
    label: "Tipo de mentorado",
    options: [
      { value: "successor", label: STUDENT_TYPE_LABEL.successor },
      { value: "succeeded", label: STUDENT_TYPE_LABEL.succeeded },
    ],
  },
];

export function UsuariosTable({
  users,
  action,
}: {
  users: AdminUserRow[];
  action?: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(() => emptyFilters(FILTER_GROUPS));
  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);
  const [detail, setDetail] = useState<UserFullDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  /**
   * Busca no clique, não no `onOpenChange` do dialog: o `open` é controlado
   * de fora (por `detailUser`), então o callback do dialog só dispara em
   * fechamentos internos (Esc, clique no overlay) — nunca na abertura.
   */
  function handleShowDetail(user: AdminUserRow) {
    setDetailUser(user);
    setDetail(null);
    setDetailError(null);

    fetchUserFullDetail(user.id).then((result) => {
      if (result.ok) setDetail(result.data);
      else setDetailError(result.error);
    });
  }

  const visible = useMemo(() => {
    const term = normalize(search.trim());

    return users.filter((user) => {
      if (!matchesFilter(filters.role, user.role)) return false;
      if (!matchesFilter(filters.studentType, user.studentType)) return false;
      if (
        !matchesFilter(
          filters.status,
          user.isActive === null ? null : user.isActive ? "active" : "inactive"
        )
      ) {
        return false;
      }
      if (!term) return true;

      return [user.fullName, user.trailTitle, user.familyName].some(
        (field) => field && normalize(field).includes(term)
      );
    });
  }, [users, search, filters]);

  return (
    <>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, formação ou família"
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
                <TableHead>Nome</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Formação</TableHead>
                <TableHead>Família</TableHead>
                <TableHead>Status</TableHead>
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
                    Nenhum usuário corresponde à busca.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        onClick={() => handleShowDetail(user)}
                        className="text-left hover:text-primary transition-colors"
                      >
                        {user.fullName}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" size="sm">
                          {ROLE_LABEL[user.role] ?? user.role}
                        </Badge>
                        {user.studentType && (
                          <span className="text-xs text-muted-foreground">
                            {STUDENT_TYPE_LABEL[user.studentType] ?? user.studentType}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.trailTitle ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.familyName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <AccountStatusBadge isActive={user.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <UsuarioAcoes user={user} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </FramePanel>
      </Frame>

      {detailUser && (
        <UsuarioDetalheDialog
          user={detailUser}
          detail={detail}
          error={detailError}
          open={detailUser !== null}
          onOpenChange={(open) => {
            if (!open) setDetailUser(null);
          }}
        />
      )}
    </>
  );
}
