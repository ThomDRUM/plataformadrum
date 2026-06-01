"use client";

import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

interface AchievementItemProps {
  id: string;
  title: string;
  checked: boolean;
  userId: string;
}

export function AchievementItem({ id, title, checked, userId }: AchievementItemProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from("achievements")
        .update({ checked: !checked })
        .eq("id", id)
        .eq("user_id", userId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all",
        checked
          ? "border-primary/20 bg-accent/30"
          : "border-border bg-card hover:border-primary/20 hover:bg-muted/50",
        isPending && "opacity-60"
      )}
    >
      {checked ? (
        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}
      <span
        className={cn(
          "text-sm",
          checked ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {title}
      </span>
    </button>
  );
}
