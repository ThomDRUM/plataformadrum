import { ModuleSelector } from "@/components/topic/module-selector";

interface SelectorModule {
  id: string;
  title: string;
  orderIndex: number;
}

interface Props {
  modules: SelectorModule[];
  currentModuleId: string | null;
  baseHref: string;
  overviewHref: string;
}

export function TrailModuleSelector({ modules, currentModuleId, baseHref, overviewHref }: Props) {
  return (
    <ModuleSelector
      modules={modules.map((m) => ({ ...m, unlocked: true }))}
      currentModuleId={currentModuleId ?? ""}
      baseHref={baseHref}
      leadingItem={{
        label: "Visão Geral",
        href: overviewHref,
        active: currentModuleId === null,
      }}
    />
  );
}
