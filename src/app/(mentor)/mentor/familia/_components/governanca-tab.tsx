"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
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
  familia: { label: "Família", headerClass: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  propriedade: { label: "Propriedade", headerClass: "bg-amber-50 text-amber-800 border-amber-200" },
  negocio: { label: "Negócio", headerClass: "bg-violet-50 text-violet-800 border-violet-200" },
};

const DOMAIN_ORDER = ["familia", "propriedade", "negocio"];

export function GovernancaTab({ items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems);

  async function toggle(id: string, field: "has_today" | "wants", value: boolean) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
    await updateGovernanceItem(id, { [field]: value });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {DOMAIN_ORDER.map((domain) => {
        const config = DOMAIN_CONFIG[domain];
        const domainItems = items
          .filter((it) => it.domain === domain)
          .sort((a, b) => a.order_index - b.order_index);

        return (
          <div key={domain} className="border border-border rounded-lg overflow-hidden">
            <div className={cn("py-3 text-center font-semibold text-sm border-b", config.headerClass)}>
              {config.label}
            </div>
            <div className="divide-y divide-border">
              {domainItems.length === 0 && (
                <p className="px-4 py-4 text-xs text-muted-foreground/50 italic">Nenhum item cadastrado.</p>
              )}
              {domainItems.map((item) => (
                <div key={item.id} className="px-4 py-3 space-y-2">
                  <p className="text-sm text-foreground leading-snug">{item.item_text}</p>
                  <div className="flex items-center gap-5">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.has_today === true}
                        onChange={(e) => toggle(item.id, "has_today", e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      Temos hoje
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.wants === true}
                        onChange={(e) => toggle(item.id, "wants", e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      Queremos
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
