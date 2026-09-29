"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Frame, FrameHeader, FrameTitle, FramePanel } from "@/components/reui/frame";
import { Checkbox } from "@/components/ui/checkbox";
import { updateGovernanceItem } from "@/lib/actions/mentor";

interface GovernanceItem {
  id: string;
  domain: string;
  item_text: string;
  order_index: number;
  has_today: boolean | null;
  wants: boolean | null;
}

interface Props {
  items: GovernanceItem[];
}

const DOMAIN_CONFIG: Record<string, { label: string; headerClass: string }> = {
  familia: { label: "Família", headerClass: "text-emerald-800 dark:text-emerald-400" },
  propriedade: { label: "Propriedade", headerClass: "text-amber-800 dark:text-amber-400" },
  negocio: { label: "Negócio", headerClass: "text-violet-800 dark:text-violet-400" },
};

const DOMAIN_ORDER = ["familia", "propriedade", "negocio"];

export function GovernancaTab({ items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();

  function toggle(id: string, field: "has_today" | "wants", value: boolean) {
    const prev = items;
    setItems((p) => p.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
    startTransition(async () => {
      const result = await updateGovernanceItem(id, { [field]: value });
      if (!result.ok) {
        setItems(prev);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {DOMAIN_ORDER.map((domain) => {
        const config = DOMAIN_CONFIG[domain];
        const domainItems = items
          .filter((it) => it.domain === domain)
          .sort((a, b) => a.order_index - b.order_index);

        return (
          <Frame key={domain} spacing="sm">
            <FrameHeader>
              <FrameTitle className={cn("text-center", config.headerClass)}>{config.label}</FrameTitle>
            </FrameHeader>
            <FramePanel className="p-0">
              <div className="divide-y divide-border">
                {domainItems.length === 0 && (
                  <p className="px-4 py-4 text-xs text-muted-foreground/50 italic">Nenhum item cadastrado.</p>
                )}
                {domainItems.map((item) => (
                  <div key={item.id} className="space-y-2 px-4 py-3">
                    <p className="text-sm leading-snug text-foreground">{item.item_text}</p>
                    <div className="flex items-center gap-5">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                        <Checkbox
                          checked={item.has_today === true}
                          onCheckedChange={(checked) => toggle(item.id, "has_today", checked === true)}
                        />
                        Temos hoje
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                        <Checkbox
                          checked={item.wants === true}
                          onCheckedChange={(checked) => toggle(item.id, "wants", checked === true)}
                        />
                        Queremos
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </FramePanel>
          </Frame>
        );
      })}
    </div>
  );
}
