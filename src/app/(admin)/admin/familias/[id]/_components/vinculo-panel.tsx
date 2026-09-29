"use client";

import Link from "next/link";
import { Plus, X } from "lucide-react";

import { SelectField } from "@/components/admin/form-fields";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { initials } from "@/lib/utils";

export interface VinculoItem {
  /** Chave da linha — pode ser o id do vínculo, não da pessoa. */
  key: string;
  /** Id do perfil, para o link da tela do usuário. */
  profileId: string;
  name: string;
  /** Rótulo secundário (ex.: "Sucessor"). */
  meta?: string | null;
  onRemove: () => void;
}

export interface VinculoOption {
  id: string;
  label: string;
}

interface Props {
  title: string;
  description?: string;
  count: number;
  emptyLabel: string;
  items: VinculoItem[];
  selectLabel: string;
  options: VinculoOption[];
  /** Motivo de não haver ninguém para vincular, quando `options` está vazio. */
  exhaustedLabel: string;
  value: string;
  onValueChange: (value: string) => void;
  onAdd: () => void;
  disabled: boolean;
  removeLabel: string;
}

/**
 * Painel de vínculos de pessoas ao projeto da família.
 *
 * Mentorados e mentores têm a mesma anatomia — lista + seletor de adição — e só
 * diferem nas actions que gravam, então dividem este componente.
 */
export function VinculoPanel({
  title,
  description,
  count,
  emptyLabel,
  items,
  selectLabel,
  options,
  exhaustedLabel,
  value,
  onValueChange,
  onAdd,
  disabled,
  removeLabel,
}: Props) {
  return (
    <Frame spacing="sm" className="h-full">
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          {title}
          <Badge variant="secondary" size="sm">
            {count}
          </Badge>
        </FrameTitle>
        {description && <FrameDescription>{description}</FrameDescription>}
      </FrameHeader>

      <FramePanel className="p-0!">
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 px-3 py-2">
                <Avatar size="sm">
                  <AvatarFallback>{initials(item.name)}</AvatarFallback>
                </Avatar>

                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                  <Link
                    href={`/admin/usuarios/${item.profileId}`}
                    className="truncate text-sm font-medium transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  {item.meta && (
                    <Badge variant="secondary" size="sm">
                      {item.meta}
                    </Badge>
                  )}
                </div>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={disabled}
                        onClick={item.onRemove}
                        aria-label={`${removeLabel}: ${item.name}`}
                        className="ml-auto shrink-0 text-muted-foreground hover:text-destructive"
                      />
                    }
                  >
                    <X aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent>{removeLabel}</TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </FramePanel>

      <FrameFooter>
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground">{exhaustedLabel}</p>
        ) : (
          <div className="flex items-center gap-2">
            <SelectField
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              aria-label={selectLabel}
              className="h-9"
            >
              <option value="">{selectLabel}</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={disabled || !value}
              onClick={onAdd}
              className="shrink-0"
            >
              <Plus aria-hidden="true" />
              Vincular
            </Button>
          </div>
        )}
      </FrameFooter>
    </Frame>
  );
}
