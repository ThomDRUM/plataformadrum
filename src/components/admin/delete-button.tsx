"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  action: () => Promise<void>;
  label?: string;
}

export function DeleteButton({ action, label }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-destructive h-8 px-2"
      disabled={isPending}
      onClick={() => startTransition(action)}
    >
      <Trash2 className="w-3.5 h-3.5" />
      {label && <span className="ml-1.5">{label}</span>}
    </Button>
  );
}
