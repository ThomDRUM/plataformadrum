"use client";

import { Fragment } from "react";
import { ListFilter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FilterGroup {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

/** Valores marcados por grupo — `{ role: ["mentor"], studentType: [] }`. */
export type FilterState = Record<string, string[]>;

/** Estado inicial (nada marcado) derivado da definição dos grupos. */
export function emptyFilters(groups: FilterGroup[]): FilterState {
  return Object.fromEntries(groups.map((group) => [group.key, []]));
}

/**
 * Grupo vazio não filtra nada — só quando o usuário marca alguma opção é que o
 * grupo passa a restringir. `null` (mentor não tem tipo de mentorado, família
 * não tem projeto) nunca passa num grupo com marcação ativa.
 */
export function matchesFilter(selected: string[] | undefined, value: string | null) {
  if (!selected || selected.length === 0) return true;
  return value !== null && selected.includes(value);
}

/** Busca insensível a caixa e acento — "veronica" encontra "Verônica". */
export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  groups: FilterGroup[];
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  /** Ação principal da página (ex.: "Novo usuário"), alinhada à direita. */
  action?: React.ReactNode;
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  groups,
  filters,
  onFiltersChange,
  action,
}: Props) {
  const activeCount = Object.values(filters).reduce(
    (total, values) => total + values.length,
    0
  );

  function toggle(groupKey: string, value: string) {
    const current = filters[groupKey] ?? [];
    onFiltersChange({
      ...filters,
      [groupKey]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  }

  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-9 pl-8"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-lg"
              className="relative"
              aria-label={
                activeCount > 0 ? `Filtros (${activeCount} ativos)` : "Filtros"
              }
            />
          }
        >
          <ListFilter />
          {activeCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.625rem] leading-none font-medium text-primary-foreground tabular-nums">
              {activeCount}
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {groups.map((group, index) => (
            <Fragment key={group.key}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuGroup>
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {group.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={(filters[group.key] ?? []).includes(option.value)}
                    onCheckedChange={() => toggle(group.key, option.value)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </Fragment>
          ))}

          {activeCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onFiltersChange(emptyFilters(groups))}>
                Limpar filtros
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}
